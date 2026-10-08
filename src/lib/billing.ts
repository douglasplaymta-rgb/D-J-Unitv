import { PLANS } from "@/lib/types";

export function addPlanMonths(from: Date, months: number) {
  const expiresAt = new Date(from);
  const day = expiresAt.getDate();
  expiresAt.setDate(1);
  expiresAt.setMonth(expiresAt.getMonth() + months);
  expiresAt.setDate(Math.min(day, new Date(expiresAt.getFullYear(), expiresAt.getMonth() + 1, 0).getDate()));
  return expiresAt;
}

export function renewalExpiry(status: string, current: Date, plan: string) {
  const info = PLANS[plan];
  if (!info) throw new Error("Selecione um plano válido.");
  const base = status === "trial" || current < new Date() ? new Date() : new Date(current);
  return addPlanMonths(base, info.months);
}

export const TRIAL_HOURS = 24;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const text = (value: unknown, max = 150) => String(value ?? "").trim().slice(0, max);
