import { db } from "@/db";
import { activities, clients, playlists, requests } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { checkOrigin, requireClient } from "@/lib/auth";
import { readAccount } from "@/lib/account";
import { text, TRIAL_HOURS } from "@/lib/billing";
import { PLANS as PLAN_MAP } from "@/lib/types";
import { clientStatus } from "@/lib/types";

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "Não foi possível salvar. Tente novamente.";
  if (message === "AUTH_REQUIRED") return Response.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });
  console.error("Account:", message);
  return Response.json({ error: /query|constraint|relation|connect/i.test(message) ? "Não foi possível salvar. Tente novamente." : message }, { status: 400 });
}

export async function GET() {
  try {
    const user = await requireClient();
    return Response.json(await readAccount(user.id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const user = await requireClient();
    const body = await request.json();
    await db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(754284)`);
      const [client] = await tx.select().from(clients).where(eq(clients.id, user.id)).for("update");
      if (!client) throw new Error("AUTH_REQUIRED");
      const log = async (kind: string, title: string, detail: string) => { await tx.insert(activities).values({ id: randomUUID(), kind, title, detail }); };

      if (body.action === "profile") {
        const name = text(body.name, 100); if (name.length < 2) throw new Error("Informe o seu nome.");
        const phone = text(body.phone, 30);
        if (body.email && text(body.email, 180).toLowerCase() !== client.email) throw new Error("O e-mail da conta não pode ser alterado por aqui.");
        await tx.update(clients).set({ name, phone }).where(eq(clients.id, client.id));
        return;
      }

      if (body.action === "trial") {
        if (client.trialUsed) throw new Error("Você já utilizou o teste grátis desta conta.");
        const status = clientStatus({ status: client.status, expiresAt: client.expiresAt.toISOString() });
        if (["active", "expiring", "trial"].includes(status)) throw new Error("Seu acesso já está ativo. O teste grátis fica para quando precisar.");
        const lists = await tx.select().from(playlists);
        const list = lists.find(l => l.enabled) || lists[0];
        const expiresAt = new Date(); expiresAt.setHours(expiresAt.getHours() + TRIAL_HOURS);
        await tx.update(clients).set({
          plan: "Teste", status: "trial", expiresAt, trialUsed: true,
          playlistId: client.playlistId || list?.id || null,
        }).where(eq(clients.id, client.id));
        await log("trial", "Teste iniciado pelo cliente", `${client.name} · ${TRIAL_HOURS} horas de acesso`);
        return;
      }

      if (body.action === "renew") {
        const plan = text(body.plan);
        if (!PLAN_MAP[plan]) throw new Error("Selecione um plano válido.");
        const pending = await tx.select().from(requests).where(and(eq(requests.clientId, client.id), eq(requests.status, "pending"), eq(requests.kind, "renewal")));
        if (pending.length) throw new Error("Você já tem uma renovação em análise. Aguarde a confirmação.");
        await tx.insert(requests).values({
          id: randomUUID(), clientId: client.id, clientName: client.name, kind: "renewal",
          plan, amount: PLAN_MAP[plan].price, status: "pending", message: text(body.message, 500),
        });
        await log("request", "Renovação solicitada pelo cliente", `${client.name} · Plano ${plan.toLowerCase()}`);
        return;
      }

      throw new Error("Operação não reconhecida.");
    });
    return Response.json(await readAccount(user.id));
  } catch (error) { return failure(error); }
}
