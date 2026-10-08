import { db } from "@/db";
import { activities, clients, payments, playlists, settings, admins, requests } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID, randomBytes } from "node:crypto";
import { checkOrigin, requireAccess } from "@/lib/auth";
import { readWorkspace } from "@/lib/workspace";
import { ensureSeed } from "@/lib/seed";
import { PLANS } from "@/lib/types";
import { renewalExpiry } from "@/lib/billing";

export async function GET() {
  try { await requireAccess(); return Response.json(await readWorkspace(), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return failure(error); }
}
const text = (value: unknown, max = 150) => String(value ?? "").trim().slice(0, max);
function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "Não foi possível salvar. Tente novamente.";
  if (message === "AUTH_REQUIRED") return Response.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });
  console.error("Workspace:", message);
  return Response.json({ error: /query|constraint|relation|connect/i.test(message) ? "Não foi possível salvar os dados. Tente novamente." : message }, { status: 400 });
}
export async function POST(request: Request) {
  try {
    checkOrigin(request); const currentAdmin = await requireAccess(); await ensureSeed();
    const body = await request.json();
    const data = body.data || {};
    const id = text(body.id);
    await db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(754282)`);
      if (!currentAdmin) throw new Error("AUTH_REQUIRED");
      const log = async (kind: string, title: string, detail: string) => { await tx.insert(activities).values({ id: randomUUID(), kind, title, detail }); };
      switch (body.action) {
        case "save-client": {
          const name = text(data.name, 100); if (name.length < 2) throw new Error("Informe o nome completo do cliente.");
          const email = text(data.email, 180); if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Informe um e-mail válido.");
          const trial = Boolean(data.trial);
          const plan = trial ? "Teste" : text(data.plan);
          if (!trial && !PLANS[plan]) throw new Error("Selecione um plano válido.");
          const playlistId = text(data.playlistId) || null;
          if (playlistId && !(await tx.select().from(playlists).where(eq(playlists.id, playlistId))).length) throw new Error("Lista de canais não encontrada.");
          const values = { name, email, phone: text(data.phone, 30), plan, playlistId, notes: text(data.notes, 2000) };
          if (id) {
            const [existing] = await tx.select().from(clients).where(eq(clients.id, id));
            if (!existing) throw new Error("Cliente não encontrado.");
            await tx.update(clients).set(values).where(eq(clients.id, id));
            await log("client", "Cadastro atualizado", name);
          } else {
            const clientId = randomUUID(); const expiresAt = new Date();
            if (trial) { const hours = Number(data.hours); if (![6, 12, 24, 48].includes(hours)) throw new Error("Selecione a duração do teste."); expiresAt.setHours(expiresAt.getHours() + hours); }
            else { const day = expiresAt.getDate(); expiresAt.setDate(1); expiresAt.setMonth(expiresAt.getMonth() + PLANS[plan].months); expiresAt.setDate(Math.min(day, new Date(expiresAt.getFullYear(), expiresAt.getMonth() + 1, 0).getDate())); }
            await tx.insert(clients).values({ ...values, id: clientId, status: trial ? "trial" : "active", expiresAt, token: randomBytes(24).toString("hex"), trialUsed: trial });
            if (!trial) await tx.insert(payments).values({ id: randomUUID(), clientId, clientName: name, amount: PLANS[plan].price, plan });
            await log(trial ? "trial" : "client", trial ? "Teste criado" : "Novo cliente cadastrado", `${name} · ${trial ? data.hours + " horas de acesso" : "Plano " + plan.toLowerCase()}`);
          }
          break;
        }
        case "renew": {
          const [client] = await tx.select().from(clients).where(eq(clients.id, id)).for("update");
          if (!client) throw new Error("Cliente não encontrado.");
          const plan = text(data.plan); if (!PLANS[plan]) throw new Error("Selecione um plano válido.");
          const expiresAt = renewalExpiry(client.status, client.expiresAt, plan);
          await tx.update(clients).set({ plan, expiresAt, status: "active" }).where(eq(clients.id, id));
          await tx.insert(payments).values({ id: randomUUID(), clientId: id, clientName: client.name, amount: PLANS[plan].price, plan });
          await log("renewal", "Renovação concluída", `${client.name} · Plano ${plan.toLowerCase()}`); break;
        }
        case "toggle-client": {
          const [client] = await tx.select().from(clients).where(eq(clients.id, id)); if (!client) throw new Error("Cliente não encontrado.");
          const paused = client.status !== "paused";
          await tx.update(clients).set({ status: paused ? "paused" : client.plan === "Teste" ? "trial" : "active" }).where(eq(clients.id, id));
          await log("client", paused ? "Acesso pausado" : "Acesso reativado", client.name); break;
        }
        case "delete-client": {
          const [client] = await tx.select().from(clients).where(eq(clients.id, id)); if (!client) throw new Error("Cliente não encontrado.");
          await tx.delete(clients).where(eq(clients.id, id)); await log("client", "Cliente excluído", client.name); break;
        }
        case "save-playlist": {
          const name = text(data.name, 100); if (name.length < 2) throw new Error("Informe o nome da lista.");
          const sourceUrl = text(data.sourceUrl, 3000) || null;
          if (sourceUrl) { try { const url = new URL(sourceUrl); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); } catch { throw new Error("Informe uma URL M3U válida, iniciada por https:// ou http://."); } }
          const values = { name, sourceUrl, description: text(data.description, 500), category: text(data.category, 60) || "Geral" };
          if (id) { if (!(await tx.select().from(playlists).where(eq(playlists.id, id))).length) throw new Error("Lista não encontrada."); await tx.update(playlists).set(values).where(eq(playlists.id, id)); }
          else await tx.insert(playlists).values({ ...values, id: randomUUID() });
          await log("list", id ? "Lista atualizada" : "Lista de canais criada", `${name} · ${sourceUrl ? "Fonte cadastrada" : "Aguardando fonte"}`); break;
        }
        case "delete-playlist": { await tx.delete(playlists).where(eq(playlists.id, id)); await log("list", "Lista excluída", "Os clientes vinculados foram desvinculados."); break; }
        case "toggle-playlist": {
          const [list] = await tx.select().from(playlists).where(eq(playlists.id, id)); if (!list) throw new Error("Lista não encontrada.");
          await tx.update(playlists).set({ enabled: !list.enabled }).where(eq(playlists.id, id));
          await log("list", list.enabled ? "Lista desativada" : "Lista ativada", list.name); break;
        }
        case "save-settings": {
          const company = text(data.company, 100); if (!company) throw new Error("Informe o nome da empresa.");
          for (const [key, value] of Object.entries({ company, email: text(data.email, 180), phone: text(data.phone, 30), renewalNotice: String(Math.max(1, Math.min(30, Number(data.renewalNotice) || 7))) })) {
            await tx.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
          }
          await log("settings", "Configurações atualizadas", company); break;
        }
        case "resolve-request": {
          const [item] = await tx.select().from(requests).where(eq(requests.id, id)).for("update");
          if (!item) throw new Error("Solicitação não encontrada.");
          if (item.status !== "pending") throw new Error("Esta solicitação já foi analisada.");
          const decision = text(data.decision);
          if (decision === "reject") {
            await tx.update(requests).set({ status: "rejected", resolvedAt: new Date() }).where(eq(requests.id, id));
            await log("request", "Solicitação recusada", `${item.clientName} · ${item.plan || item.kind}`);
            break;
          }
          if (decision !== "approve") throw new Error("Informe se a solicitação foi aprovada ou recusada.");
          const [client] = await tx.select().from(clients).where(eq(clients.id, item.clientId)).for("update");
          if (!client) throw new Error("Cliente não encontrado.");
          if (item.kind === "renewal") {
            if (!PLANS[item.plan]) throw new Error("Plano da solicitação inválido.");
            const expiresAt = renewalExpiry(client.status, client.expiresAt, item.plan);
            await tx.update(clients).set({ plan: item.plan, expiresAt, status: "active" }).where(eq(clients.id, client.id));
            await tx.insert(payments).values({ id: randomUUID(), clientId: client.id, clientName: client.name, amount: item.amount || PLANS[item.plan].price, plan: item.plan });
            await log("renewal", "Renovação confirmada pelo portal", `${client.name} · Plano ${item.plan.toLowerCase()}`);
          }
          await tx.update(requests).set({ status: "approved", resolvedAt: new Date() }).where(eq(requests.id, id));
          break;
        }
        default: throw new Error("Operação não reconhecida.");
      }
    });
    return Response.json(await readWorkspace());
  } catch (error) { return failure(error); }
}
