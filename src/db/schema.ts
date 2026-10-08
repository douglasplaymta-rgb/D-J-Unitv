import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const admins = pgTable("unitv_admins", {
  id: text("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(), createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const sessions = pgTable("unitv_sessions", {
  id: text("id").primaryKey(), adminId: text("admin_id").notNull().references(() => admins.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
});
export const settings = pgTable("unitv_settings", { key: text("key").primaryKey(), value: text("value").notNull() });
export const playlists = pgTable("unitv_playlists", {
  id: text("id").primaryKey(), name: text("name").notNull(), description: text("description").notNull().default(""),
  sourceUrl: text("source_url"), category: text("category").notNull().default("Geral"),
  enabled: boolean("enabled").notNull().default(true), createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const clients = pgTable("unitv_clients", {
  id: text("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""), plan: text("plan").notNull().default("Mensal"),
  status: text("status").notNull().default("active"), expiresAt: timestamp("expires_at").notNull(),
  playlistId: text("playlist_id").references(() => playlists.id, { onDelete: "set null" }),
  token: text("token").notNull().unique(), notes: text("notes").notNull().default(""),
  passwordHash: text("password_hash"), trialUsed: boolean("trial_used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const clientSessions = pgTable("unitv_client_sessions", {
  id: text("id").primaryKey(), clientId: text("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
});
export const requests = pgTable("unitv_requests", {
  id: text("id").primaryKey(),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  clientName: text("client_name").notNull(),
  kind: text("kind").notNull(),
  plan: text("plan").notNull().default(""),
  amount: integer("amount").notNull().default(0),
  status: text("status").notNull().default("pending"),
  message: text("message").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});
export const payments = pgTable("unitv_payments", {
  id: text("id").primaryKey(), clientId: text("client_id").references(() => clients.id, { onDelete: "set null" }),
  clientName: text("client_name").notNull(), amount: integer("amount").notNull(), plan: text("plan").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const activities = pgTable("unitv_activities", {
  id: text("id").primaryKey(), kind: text("kind").notNull(), title: text("title").notNull(),
  detail: text("detail").notNull(), createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const loginAttempts = pgTable("unitv_login_attempts", {
  key: text("key").primaryKey(), count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at").notNull(),
});
