import { db } from "@/db";
import { admins, sessions, clients, clientSessions } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";

const ADMIN_COOKIE = "unitv_admin";
const CLIENT_COOKIE = "unitv_client";

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, hash: string) {
  const [salt, stored] = hash.split(":");
  if (!salt || !stored) return false;
  const result = scryptSync(password, salt, 64);
  const expected = Buffer.from(stored, "hex");
  return expected.length === result.length && timingSafeEqual(expected, result);
}
async function setAuthCookie(name: string, token: string, expiresAt: Date) {
  (await cookies()).set(name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    maxAge: Math.max(60, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
  });
}
export async function getAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const [session] = await db.select({ id: admins.id, name: admins.name, email: admins.email }).from(sessions)
    .innerJoin(admins, eq(sessions.adminId, admins.id))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date()))).limit(1);
  return session ?? null;
}
export async function getClientUser() {
  const token = (await cookies()).get(CLIENT_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db.select({
    id: clients.id, name: clients.name, email: clients.email, phone: clients.phone, plan: clients.plan,
    status: clients.status, expiresAt: clients.expiresAt, playlistId: clients.playlistId, token: clients.token,
    notes: clients.notes, createdAt: clients.createdAt, trialUsed: clients.trialUsed,
  }).from(clientSessions)
    .innerJoin(clients, eq(clientSessions.clientId, clients.id))
    .where(and(eq(clientSessions.id, hashToken(token)), gt(clientSessions.expiresAt, new Date()))).limit(1);
  return row ?? null;
}
export async function isConfigured() {
  return (await db.select({ id: admins.id }).from(admins).limit(1)).length > 0;
}
export async function requireAccess() {
  const admin = await getAdmin();
  if (!admin) throw new Error("AUTH_REQUIRED");
  return admin;
}
export async function requireClient() {
  const client = await getClientUser();
  if (!client) throw new Error("AUTH_REQUIRED");
  return client;
}
export async function createSession(adminId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 86400000);
  await db.insert(sessions).values({ id: hashToken(token), adminId, expiresAt });
  await setAuthCookie(ADMIN_COOKIE, token, expiresAt);
}
export async function createClientSession(clientId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 86400000);
  await db.insert(clientSessions).values({ id: hashToken(token), clientId, expiresAt });
  await setAuthCookie(CLIENT_COOKIE, token, expiresAt);
}
export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  jar.delete(ADMIN_COOKIE);
}
export async function destroyClientSession() {
  const jar = await cookies();
  const token = jar.get(CLIENT_COOKIE)?.value;
  if (token) await db.delete(clientSessions).where(eq(clientSessions.id, hashToken(token)));
  jar.delete(CLIENT_COOKIE);
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const allowed = [request.headers.get("host"), request.headers.get("x-forwarded-host"), new URL(request.url).host];
  if (!allowed.includes(new URL(origin).host)) throw new Error("Origem da solicitação não autorizada.");
}
export async function throttle(key: string, limit = 8) {
  const { loginAttempts } = await import("@/db/schema");
  const { sql } = await import("drizzle-orm");
  const [attempt] = await db.select().from(loginAttempts).where(eq(loginAttempts.key, key));
  if (attempt && attempt.resetAt > new Date() && attempt.count >= limit) throw new Error("RATE_LIMIT");
  if (attempt && attempt.resetAt <= new Date()) await db.delete(loginAttempts).where(eq(loginAttempts.key, key));
  await db.insert(loginAttempts).values({ key, count: 1, resetAt: new Date(Date.now() + 15 * 60000) })
    .onConflictDoUpdate({ target: loginAttempts.key, set: { count: sql`${loginAttempts.count} + 1` } });
}
export async function clearThrottle(key: string) {
  const { loginAttempts } = await import("@/db/schema");
  await db.delete(loginAttempts).where(eq(loginAttempts.key, key));
}
