import { db } from "@/db";
import { activities, clients, payments, playlists, settings, admins, requests } from "@/db/schema";
import { desc } from "drizzle-orm";
import { ensureSeed } from "@/lib/seed";
import { getAdmin, isConfigured } from "@/lib/auth";
import type { Workspace } from "@/lib/types";

export function publicClient<T extends { passwordHash?: string | null }>(row: T) {
  const { passwordHash, ...rest } = row;
  return { ...rest, hasPortal: Boolean(passwordHash) };
}

export async function readWorkspace(): Promise<Workspace> {
  await ensureSeed();
  const [clientRows, listRows, paymentRows, activityRows, settingRows, adminRows, requestRows, currentAdmin] = await Promise.all([
    db.select().from(clients).orderBy(desc(clients.createdAt)),
    db.select().from(playlists).orderBy(playlists.createdAt),
    db.select().from(payments).orderBy(desc(payments.createdAt)),
    db.select().from(activities).orderBy(desc(activities.createdAt)).limit(80),
    db.select().from(settings),
    db.select({ id: admins.id, name: admins.name, email: admins.email }).from(admins),
    db.select().from(requests).orderBy(desc(requests.createdAt)),
    getAdmin(),
  ]);
  if (!currentAdmin) throw new Error("AUTH_REQUIRED");
  return JSON.parse(JSON.stringify({
    clients: clientRows.map(publicClient), playlists: listRows, payments: paymentRows,
    activities: activityRows, requests: requestRows,
    settings: Object.fromEntries(settingRows.map(s => [s.key, s.value])),
    admins: adminRows, demo: false, currentAdmin,
  }));
}
