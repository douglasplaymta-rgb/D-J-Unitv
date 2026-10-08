export type Client = {
  id: string; name: string; email: string; phone: string; plan: string; status: string;
  expiresAt: string; playlistId: string | null; token: string; notes: string; createdAt: string;
  trialUsed: boolean; hasPortal: boolean;
};
export type Playlist = { id: string; name: string; description: string; sourceUrl: string | null; category: string; enabled: boolean; createdAt: string };
export type Payment = { id: string; clientId: string | null; clientName: string; amount: number; plan: string; createdAt: string };
export type Activity = { id: string; kind: string; title: string; detail: string; createdAt: string };
export type Admin = { id: string; name: string; email: string };
export type AccessRequest = {
  id: string; clientId: string; clientName: string; kind: string; plan: string; amount: number;
  status: string; message: string; createdAt: string; resolvedAt: string | null;
};
export type Workspace = {
  clients: Client[]; playlists: Playlist[]; payments: Payment[]; activities: Activity[];
  admins: Admin[]; requests: AccessRequest[]; settings: Record<string, string>; demo: boolean; currentAdmin: Admin | null;
};
export type ClientAccount = {
  client: Client; playlist: { id: string; name: string; category: string; enabled: boolean; hasSource: boolean } | null;
  payments: Payment[]; requests: AccessRequest[]; settings: { company: string; email: string; phone: string };
configured: boolean;
};
export type View = "overview" | "clients" | "renewals" | "trials" | "requests" | "playlists" | "finance" | "reports" | "settings";
export const PLANS: Record<string, { months: number; price: number; description: string }> = {
  Mensal: { months: 1, price: 3000, description: "Flexibilidade para o dia a dia" },
  Trimestral: { months: 3, price: 8000, description: "Mais tempo, mais economia" },
  Semestral: { months: 6, price: 15000, description: "Entretenimento sem preocupação" },
  Anual: { months: 12, price: 28000, description: "Um ano inteiro de conexão" },
};
export const money = (cents: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
export const date = (value: string | Date, short = false) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: short ? "short" : "2-digit", ...(short ? {} : { year: "numeric" }) }).format(new Date(value));
export const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase();
export const daysLeft = (value: string) => Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
export function clientStatus(client: Pick<Client, "status" | "expiresAt">) {
  if (client.status === "paused") return "paused";
  if (new Date(client.expiresAt).getTime() < Date.now()) return "expired";
  if (client.status === "trial") return "trial";
  if (daysLeft(client.expiresAt) <= 7) return "expiring";
  return "active";
}
