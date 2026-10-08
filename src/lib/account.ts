import { db } from "@/db";
import { clients, payments, playlists, requests, settings, admins } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { publicClient } from "@/lib/workspace";
import type { ClientAccount } from "@/lib/types";

export async function readAccount(clientId: string): Promise<ClientAccount> {
  const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
  if (!client) throw new Error("AUTH_REQUIRED");
  const [listRows, paymentRows, requestRows, settingRows, adminRows] = await Promise.all([
    client.playlistId ? db.select().from(playlists).where(eq(playlists.id, client.playlistId)) : Promise.resolve([]),
    db.select().from(payments).where(eq(payments.clientId, clientId)).orderBy(desc(payments.createdAt)).limit(20),
    db.select().from(requests).where(eq(requests.clientId, clientId)).orderBy(desc(requests.createdAt)).limit(20),
    db.select().from(settings),
    db.select({ id: admins.id }).from(admins).limit(1),
  ]);
  const map = Object.fromEntries(settingRows.map(s => [s.key, s.value]));
  const list = listRows[0];
  return JSON.parse(JSON.stringify({
    client: publicClient(client),
    playlist: list ? { id: list.id, name: list.name, category: list.category, enabled: list.enabled, hasSource: Boolean(list.sourceUrl) } : null,
    payments: paymentRows, requests: requestRows,
    settings: { company: map.company || "D&J UniTV", email: map.email || "", phone: map.phone || "" },
    configured: adminRows.length > 0,
  }));
}
