import { db } from "@/db";
import { activities, clients, playlists } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID, randomBytes } from "node:crypto";
import { checkOrigin, createClientSession, destroyClientSession, getClientUser, hashPassword, hashToken, throttle, clearThrottle, verifyPassword } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";
import { EMAIL_RE, text, TRIAL_HOURS } from "@/lib/billing";

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const body = await request.json();
    if (body.action === "logout") { await destroyClientSession(); return Response.json({ ok: true }); }

    if (body.action === "register") {
      await ensureSeed();
      const name = text(body.name, 100);
      const email = text(body.email, 180).toLowerCase();
      const phone = text(body.phone, 30);
      const password = String(body.password || "");
      const startTrial = Boolean(body.startTrial);
      if (name.length < 2) throw new Error("Informe o seu nome completo.");
      if (!EMAIL_RE.test(email)) throw new Error("Informe um e-mail válido.");
      if (password.length < 8 || password.length > 128) throw new Error("A senha deve ter entre 8 e 128 caracteres.");
      const key = hashToken(`reg:${email}`);
      try { await throttle(key, 6); } catch { return Response.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 }); }

      let clientId = "";
      await db.transaction(async tx => {
        await tx.execute(sql`select pg_advisory_xact_lock(754283)`);
        const matches = email ? await tx.select().from(clients).where(eq(clients.email, email)) : [];
        const existing = matches[0];
        if (existing?.passwordHash) throw new Error("Este e-mail já possui uma conta. Entre para continuar.");
        const lists = await tx.select().from(playlists);
        const defaultList = lists.find(l => l.enabled) || lists[0];
        const existingActive = existing && existing.status !== "paused" && existing.expiresAt > new Date();
        const expiresAt = new Date();
        let status = existing?.status || "active";
        let plan = existing?.plan || "Avulso";
        let trialUsed = existing?.trialUsed ?? false;
        const canTrial = startTrial && !trialUsed && !existingActive;
        if (canTrial) {
          expiresAt.setHours(expiresAt.getHours() + TRIAL_HOURS);
          status = "trial"; plan = "Teste"; trialUsed = true;
        } else if (!existing) {
          expiresAt.setTime(Date.now() - 60000);
        }
        const hash = hashPassword(password);
        if (existing) {
          clientId = existing.id;
          await tx.update(clients).set({
            name: existing.name.length >= 2 ? existing.name : name,
            phone: phone || existing.phone, passwordHash: hash,
            ...(canTrial ? { plan, status, expiresAt, trialUsed: true, playlistId: existing.playlistId || defaultList?.id || null } : {}),
          }).where(eq(clients.id, existing.id));
        } else {
          clientId = randomUUID();
          await tx.insert(clients).values({
            id: clientId, name, email, phone, plan, status, expiresAt, trialUsed,
            playlistId: defaultList?.id || null, token: randomBytes(24).toString("hex"),
            passwordHash: hash, notes: "Cadastro pelo portal do cliente.",
          });
        }
        await tx.insert(activities).values({
          id: randomUUID(), kind: canTrial ? "trial" : "client",
          title: canTrial ? "Teste iniciado pelo cliente" : "Cliente criou acesso no portal",
          detail: `${name} · ${email}`,
        });
      });
      await clearThrottle(key);
      await createClientSession(clientId);
      return Response.json({ ok: true });
    }

    if (body.action === "login") {
      const email = text(body.email, 180).toLowerCase();
      const password = String(body.password || "").slice(0, 128);
      const key = hashToken(`cli:${email}`);
      try { await throttle(key, 8); } catch { return Response.json({ error: "Muitas tentativas. Aguarde 15 minutos antes de tentar novamente." }, { status: 429 }); }
      const [client] = email ? await db.select().from(clients).where(eq(clients.email, email)) : [];
      if (!client?.passwordHash || !verifyPassword(password, client.passwordHash)) {
        return Response.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
      }
      await clearThrottle(key);
      await createClientSession(client.id);
      return Response.json({ ok: true });
    }

    if (body.action === "password") {
      const user = await getClientUser();
      if (!user) return Response.json({ error: "Entre na sua conta para continuar." }, { status: 401 });
      const [stored] = await db.select().from(clients).where(eq(clients.id, user.id));
      if (!stored?.passwordHash || !verifyPassword(String(body.currentPassword || "").slice(0, 128), stored.passwordHash)) {
        throw new Error("A senha atual está incorreta.");
      }
      const next = String(body.newPassword || "");
      if (next.length < 8 || next.length > 128) throw new Error("A nova senha deve ter entre 8 e 128 caracteres.");
      await db.update(clients).set({ passwordHash: hashPassword(next) }).where(eq(clients.id, user.id));
      await destroyClientSession();
      await createClientSession(user.id);
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Operação inválida." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível concluir. Tente novamente.";
    if (message === "RATE_LIMIT") return Response.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
    console.error("Client auth:", message);
    return Response.json({ error: /query|constraint|relation|connect/i.test(message) ? "Não foi possível concluir. Tente novamente." : message }, { status: 400 });
  }
}
