import { db } from "@/db";
import { clients, playlists } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  if (!(await isConfigured())) return new Response("Ative o acesso privado antes de conectar uma TV.", { status: 403 });
  const { token } = await context.params;
  if (!/^[a-f0-9]{48}$/.test(token)) return new Response("Acesso não encontrado.", { status: 404 });
  const [client] = await db.select().from(clients).where(eq(clients.token, token));
  if (!client || client.status === "paused" || client.expiresAt <= new Date()) return new Response("Acesso expirado ou indisponível. Entre em contato com a D&J UniTV.", { status: 403 });
  if (!client.playlistId) return new Response("Nenhuma lista vinculada a este acesso.", { status: 404 });
  const [list] = await db.select().from(playlists).where(eq(playlists.id, client.playlistId));
  if (!list?.enabled || !list.sourceUrl) return new Response("A fonte de canais ainda não foi configurada.", { status: 404 });
  return new Response(null, { status: 307, headers: { Location: list.sourceUrl, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
}
