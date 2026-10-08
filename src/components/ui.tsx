"use client";
import { useId } from "react";
import { CircleHelp, Inbox, X } from "lucide-react";
import type { ReactNode } from "react";
import { clientStatus, initials, type Client } from "@/lib/types";

export function Brand({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  const id = useId().replace(/:/g, "");
  return <div className={`brand ${dark ? "brand-dark" : ""}`}><svg width="43" height="45" viewBox="0 0 80 80" fill="none" aria-hidden="true"><defs><linearGradient id={id} x1="24" y1="6" x2="58" y2="74" gradientUnits="userSpaceOnUse"><stop stopColor="#ffae23"/><stop offset=".35" stopColor="#ff3f72"/><stop offset=".68" stopColor="#c138fd"/><stop offset="1" stopColor="#692dfa"/></linearGradient></defs><path d="M51 68a30 30 0 1 1 17-22" stroke={`url(#${id})`} strokeWidth="7.4" strokeLinecap="round"/><path d="M32 54V23l29 31-15-14-14 14Z" stroke={`url(#${id})`} strokeWidth="7" strokeLinejoin="round" strokeLinecap="round"/></svg>{!compact && <span><strong>D<span className="brand-amp">&</span>J <i>UniTV</i></strong><small>CONEXÃO SEM LIMITES</small></span>}</div>;
}
export function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  const color = ["purple", "blue", "pink", "orange", "green"][Array.from(name).reduce((n, c) => n + c.charCodeAt(0), 0) % 5];
  return <span className={`avatar avatar-${color} ${small ? "avatar-small" : ""}`}>{initials(name)}</span>;
}
export function Status({ client }: { client: Client }) {
  const status = clientStatus(client);
  const labels: Record<string, string> = { active: "Ativo", expiring: "A vencer", expired: "Vencido", trial: "Em teste", paused: "Pausado" };
  return <span className={`status status-${status}`}><i/>{labels[status]}</span>;
}
export function EmptyState({ title = "Nada por aqui, por enquanto", description = "Seus registros aparecerão aqui.", action }: { title?: string; description?: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><Inbox size={27}/></span><h3>{title}</h3><p>{description}</p>{action}</div>;
}
export function Dialog({ title, subtitle, children, onClose, wide = false }: { title: string; subtitle?: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><section className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}><div className="modal-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Fechar janela"><X size={20}/></button></div>{children}</section></div>;
}
export function Hint({ children }: { children: ReactNode }) { return <div className="hint"><CircleHelp size={17}/><span>{children}</span></div>; }
export function timeAgo(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `Há ${minutes} min`;
  if (minutes < 1440) return `Há ${Math.floor(minutes / 60)} h`;
  return `Há ${Math.floor(minutes / 1440)} d`;
}
export function exportCsv(filename: string, headings: string[], rows: (string | number)[][]) {
  const escape = (value: string | number) => { const string = String(value); return `"${(/^[=+@\-\t\r]/.test(string) ? "'" : "") + string.replace(/"/g, '""')}"`; };
  const csv = "\uFEFF" + [headings, ...rows].map(row => row.map(escape).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
