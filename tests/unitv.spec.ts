import "dotenv/config";
import { test, expect, request as makeRequest } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { db, pool } from "../src/db";
import { admins, clients, payments, playlists, activities, requests } from "../src/db/schema";
import { eq, like } from "drizzle-orm";

const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const prefix = `Verificação ${Date.now()}`;
const adminEmail1 = `fundador-${Date.now()}@example.com`;
const adminEmail2 = `pai-${Date.now()}@example.com`;
const adminPassword = randomBytes(18).toString("base64url");
const portalEmail = `portal-${Date.now()}@example.com`;
test.describe.configure({ mode: "serial" });
let canAdmin = false;

test.afterAll(async () => {
  await db.delete(payments).where(like(payments.clientName, `${prefix}%`));
  await db.delete(requests).where(like(requests.clientName, `${prefix}%`));
  await db.delete(clients).where(like(clients.name, `${prefix}%`));
  await db.delete(clients).where(eq(clients.email, portalEmail));
  await db.delete(playlists).where(like(playlists.name, `${prefix}%`));
  await db.delete(activities).where(like(activities.detail, `${prefix}%`));
  await db.delete(admins).where(eq(admins.email, adminEmail1));
  await db.delete(admins).where(eq(admins.email, adminEmail2));
  await pool.end();
});

async function enterAdmin(page: import("@playwright/test").Page) {
  const login = await page.request.post(`${base}/api/auth`, { data: { action: "login", email: adminEmail1, password: adminPassword } });
  expect(login.ok()).toBeTruthy();
}

test("public site is for clients and admin is locked", async ({ page, request }) => {
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto(base);
  await expect(page.getByRole("heading", { name: "Seu entretenimento. Na sua TV. Do seu jeito." })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Buscar no painel" })).toHaveCount(0);
  expect((await request.get(`${base}/api/workspace`)).status()).toBe(401);
  await page.goto(`${base}/admin`);
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: /Acesso administrativo|Ativar o painel zerado/ })).toBeVisible();
});

test("founders open the live admin panel", async ({ page }) => {
  await page.goto(`${base}/admin/login`);
  const needsSetup = await page.getByRole("heading", { name: "Ativar o painel zerado" }).count();
  if (!needsSetup) {
    await expect(page.getByRole("heading", { name: "Acesso administrativo" })).toBeVisible();
    return;
  }
  await page.locator('input[name="name1"]').fill("Fundador");
  await page.locator('input[name="email1"]').fill(adminEmail1);
  await page.locator('input[name="password1"]').fill(adminPassword);
  await page.locator('input[name="name2"]').fill("Pai Fundador");
  await page.locator('input[name="email2"]').fill(adminEmail2);
  await page.locator('input[name="password2"]').fill(adminPassword);
  await page.getByRole("button", { name: "Ativar painel zerado" }).click();
  await expect(page.getByRole("heading", { name: "Visão geral", exact: true })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Painel ao vivo")).toBeVisible();
  canAdmin = true;
  await page.screenshot({ path: "/tmp/unitv-desktop.png", fullPage: true });
});

test("admin can register clients, renewals, trials and playlists", async ({ page }) => {
  test.skip(!canAdmin, "Painel já está com os fundadores reais; não recriamos contas de teste.");
  await enterAdmin(page);
  await page.goto(`${base}/admin`);
  await expect(page.getByRole("heading", { name: "Visão geral", exact: true })).toBeVisible();
  await page.locator(".heading-actions").getByRole("button", { name: "Novo cliente" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('input[name="name"]').fill(`${prefix} Cliente`);
  await dialog.locator('input[name="email"]').fill("qa-cliente@example.com");
  await dialog.getByRole("button", { name: "Cadastrar cliente" }).click();
  await expect(dialog).not.toBeVisible();
  const workspace = await (await page.request.get(`${base}/api/workspace`)).json();
  const client = workspace.clients.find((c: { name: string }) => c.name === `${prefix} Cliente`);
  expect(client).toBeTruthy();
  await page.getByRole("textbox", { name: "Buscar no painel" }).fill(`${prefix} Cliente`);
  await page.locator(".search-results").getByRole("button").filter({ hasText: `${prefix} Cliente` }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Renovar acesso", exact: true }).click();
  await page.getByRole("dialog").getByText("Trimestral", { exact: true }).click();
  await page.getByRole("button", { name: "Confirmar renovação", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const trial = await page.request.post(`${base}/api/workspace`, { data: { action: "save-client", data: { name: `${prefix} Teste`, trial: true, hours: 6, plan: "Teste" } } });
  expect(trial.ok()).toBeTruthy();
  const trialClient = (await trial.json()).clients.find((c: { name: string }) => c.name === `${prefix} Teste`);
  const conversion = await page.request.post(`${base}/api/workspace`, { data: { action: "renew", id: trialClient.id, data: { plan: "Mensal" } } });
  expect((await conversion.json()).clients.find((c: { id: string }) => c.id === trialClient.id).status).toBe("active");
  await page.goto(`${base}/admin#playlists`);
  await page.locator(".heading-actions").getByRole("button", { name: "Nova lista" }).click();
  await page.getByRole("dialog").locator('input[name="name"]').fill(`${prefix} Lista`);
  await page.getByRole("dialog").locator('input[name="sourceUrl"]').fill("https://example.com/authorized.m3u");
  await page.getByRole("button", { name: "Criar lista", exact: true }).click();
  await expect(page.getByRole("heading", { name: `${prefix} Lista`, exact: true })).toBeVisible();
});

test("client portal trial and renewal stay outside admin", async ({ page }) => {
  const password = "PortalSeguro123";
  await page.goto(`${base}/cadastro`);
  await page.locator('input[name="name"]').fill(`${prefix} Portal`);
  await page.locator('input[name="email"]').fill(portalEmail);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByRole("heading", { name: "Seu teste está no ar." })).toBeVisible({ timeout: 15000 });
  await page.getByText("Trimestral", { exact: true }).click();
  await page.getByRole("button", { name: "Solicitar renovação" }).click();
  await expect(page.getByText("Pedido em análise")).toBeVisible();
  if (!canAdmin) return;
  await enterAdmin(page);
  await page.goto(`${base}/admin`);
  await expect(page.getByRole("heading", { name: "Visão geral", exact: true })).toBeVisible();
  const workspace = await (await page.request.get(`${base}/api/workspace`)).json();
  const item = workspace.requests.find((r: { clientName: string; status: string }) => r.clientName === `${prefix} Portal` && r.status === "pending");
  expect(item).toBeTruthy();
  const approve = await page.request.post(`${base}/api/workspace`, { data: { action: "resolve-request", id: item.id, data: { decision: "approve" } } });
  expect(approve.ok()).toBeTruthy();
});

test("admin APIs stay locked without a founder session", async ({ request }) => {
  const anonymous = await makeRequest.newContext();
  expect((await anonymous.get(`${base}/api/workspace`)).status()).toBe(401);
  expect((await anonymous.post(`${base}/api/workspace`, { data: { action: "save-client", data: { name: "Unauthorized", plan: "Mensal" } } })).status()).toBe(401);
  const secondSetup = await anonymous.post(`${base}/api/auth`, { data: { action: "setup", accounts: [] } });
  expect([400, 409]).toContain(secondSetup.status());
  if (canAdmin) {
    const login = await anonymous.post(`${base}/api/auth`, { data: { action: "login", email: adminEmail2, password: adminPassword } });
    expect(login.status()).toBe(200);
    const cookie = login.headers()["set-cookie"].split(";")[0];
    const content = await (await anonymous.get(`${base}/api/workspace`, { headers: { Cookie: cookie } })).json();
    expect(content.admins.length).toBeGreaterThan(0);
    expect(JSON.stringify(content)).not.toContain("passwordHash");
    await anonymous.post(`${base}/api/auth`, { headers: { Cookie: cookie }, data: { action: "logout" } });
    expect((await anonymous.get(`${base}/api/workspace`, { headers: { Cookie: cookie } })).status()).toBe(401);
  }
  await anonymous.dispose();
});
