import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

let seeded = false;
export async function ensureSeed() {
  if (seeded) return;
  await db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(754281)`);
    const existing = await tx.select().from(settings).where(eq(settings.key, "initialized"));
    if (existing.length) return;
    await tx.insert(settings).values([
      { key: "initialized", value: "true" },
      { key: "company", value: "D&J UniTV" },
      { key: "email", value: "" },
      { key: "phone", value: "" },
      { key: "renewalNotice", value: "7" },
    ]);
  });
  seeded = true;
}
