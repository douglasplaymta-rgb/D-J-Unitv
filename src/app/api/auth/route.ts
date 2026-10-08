import { db } from "@/db";
import { admins, activities, clients, payments, playlists, loginAttempts, sessions, requests, clientSessions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { checkOrigin, createSession, destroySession, getAdmin, hashPassword, hashToken, isConfigured, verifyPassword } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = await request.json();
    if (body.action === "logout") { await destroySession(); return Response.json({ ok: true }); }
    if (body.action === "setup") {
      if (await isConfigured()) return Response.json({ error: "O acesso privado já está configurado." }, { status: 409 });
      if (process.env.SETUP_TOKEN && body.setupToken !== process.env.SETUP_TOKEN) return Response.json({ error: "Informe a chave de instalação correta." }, { status: 403 });
      if (!Array.isArray(body.accounts) || body.accounts.length !== 2) throw new Error("Cadastre exatamente dois administradores.");
      const accounts = body.accounts.map((a: { name?: unknown; email?: unknown; password?: unknown }) => {
        const name = String(a.name || "").trim().slice(0, 100);
        const email = String(a.email || "").toLowerCase().trim().slice(0, 180);
        const password = String(a.password || "");
        if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Preencha o nome e um e-mail válido para cada administrador.");
        if (password.length < 10 || password.length > 128) throw new Error("Cada senha deve ter entre 10 e 128 caracteres.");
        return { id: randomUUID(), name, email, passwordHash: hashPassword(password) };
      });
      if (accounts[0].email === accounts[1].email) throw new Error("Utilize dois e-mails diferentes.");
      await ensureSeed();
      await db.transaction(async tx => {
        await tx.execute(sql`select pg_advisory_xact_lock(754282)`);
        if ((await tx.select({ id: admins.id }).from(admins).limit(1)).length) throw new Error("O acesso já foi configurado.");
        await tx.insert(admins).values(accounts);
        await tx.delete(payments);
        await tx.delete(requests);
        await tx.delete(clientSessions);
        await tx.delete(activities);
        await tx.delete(clients);
        await tx.delete(playlists);
        await tx.insert(activities).values({ id: randomUUID(), kind: "security", title: "Painel administrativo ativado", detail: "Acesso exclusivo dos dois fundadores. Ambiente iniciado zerado." });
      });
      await createSession(accounts[0].id);
      return Response.json({ ok: true });
    }
    if (body.action === "login") {
      const email = String(body.email || "").toLowerCase().trim().slice(0, 180);
      const password = String(body.password || "").slice(0, 128);
      const key = hashToken(email);
      const [attempt] = await db.select().from(loginAttempts).where(eq(loginAttempts.key, key));
      if (attempt && attempt.resetAt > new Date() && attempt.count >= 8) return Response.json({ error: "Muitas tentativas. Aguarde 15 minutos antes de tentar novamente." }, { status: 429 });
      if (attempt && attempt.resetAt <= new Date()) await db.delete(loginAttempts).where(eq(loginAttempts.key, key));
      await db.insert(loginAttempts).values({ key, count: 1, resetAt: new Date(Date.now() + 15 * 60000) }).onConflictDoUpdate({ target: loginAttempts.key, set: { count: sql`${loginAttempts.count} + 1` } });
      const [admin] = await db.select().from(admins).where(eq(admins.email, email));
      if (!admin || !verifyPassword(password, admin.passwordHash)) return Response.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
      await db.delete(loginAttempts).where(eq(loginAttempts.key, key));
      await createSession(admin.id);
      return Response.json({ ok: true });
    }
    if (body.action === "password") {
      const admin = await getAdmin();
      if (!admin) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
      const [stored] = await db.select().from(admins).where(eq(admins.id, admin.id));
      if (!verifyPassword(String(body.currentPassword || "").slice(0, 128), stored.passwordHash)) throw new Error("A senha atual está incorreta.");
      const next = String(body.newPassword || "");
      if (next.length < 10 || next.length > 128) throw new Error("A nova senha deve ter entre 10 e 128 caracteres.");
      await db.transaction(async tx => {
        await tx.update(admins).set({ passwordHash: hashPassword(next) }).where(eq(admins.id, admin.id));
        await tx.delete(sessions).where(eq(sessions.adminId, admin.id));
      });
      await destroySession();
      await createSession(admin.id);
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Operação inválida." }, { status: 400 });
  } catch (error) {
    console.error("Auth:", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: error instanceof Error && !error.message.includes("query") ? error.message : "Não foi possível concluir. Tente novamente." }, { status: 400 });
  }
}
