"use client";
import { useMemo, useState, useId } from "react";
import { TrendingUp } from "lucide-react";
import { money, type Payment } from "@/lib/types";

export function RevenueChart({ payments, large = false }: { payments: Payment[]; large?: boolean }) {
  const [months, setMonths] = useState(6);
  const [hover, setHover] = useState<number | null>(null);
  const gradient = useId().replace(/:/g, "");
  const points = useMemo(() => {
    const today = new Date();
    return Array.from({ length: months }, (_, i) => {
      const d = new Date(today.getFullYear(), today.getMonth() - months + 1 + i, 1);
      return { label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""), full: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }), amount: payments.filter(p => { const date = new Date(p.createdAt); return date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear(); }).reduce((sum, p) => sum + p.amount, 0) };
    });
  }, [payments, months]);
  const max = Math.max(100000, Math.ceil(Math.max(...points.map(p => p.amount)) / 100000) * 100000);
  const coords = points.map((p, i) => ({ x: 58 + i * (566 / (points.length - 1)), y: 162 - p.amount / max * 140 }));
  let line = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) { const before = coords[i - 1]; const next = coords[i]; const mid = (before.x + next.x) / 2; line += ` C ${mid} ${before.y}, ${mid} ${next.y}, ${next.x} ${next.y}`; }
  const last = points.at(-1)?.amount || 0; const previous = points.at(-2)?.amount || 0;
  const growth = previous ? Math.round((last - previous) / previous * 1000) / 10 : 0;
  return <section className={`card chart-card ${large ? "chart-large" : ""}`}><div className="card-heading"><div><h2>Visão financeira</h2><p>Acompanhe a evolução da sua receita</p></div><select aria-label="Período do gráfico" className="small-select" value={months} onChange={e => { setMonths(Number(e.target.value)); setHover(null); }}><option value={6}>Últimos 6 meses</option><option value={3}>Últimos 3 meses</option><option value={12}>Últimos 12 meses</option></select></div><div className="chart-summary"><span><i className="legend-dot"/>Receita recebida</span><span className="chart-growth"><TrendingUp size={13}/>{growth >= 0 ? "+" : ""}{growth.toLocaleString("pt-BR")}% <small>vs. mês anterior</small></span></div><div className="chart-container" onMouseLeave={() => setHover(null)}><svg viewBox="0 0 650 192" role="img" aria-label="Gráfico da receita recebida por mês" preserveAspectRatio="none"><defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9c60ef" stopOpacity=".24"/><stop offset="100%" stopColor="#a268f1" stopOpacity=".015"/></linearGradient></defs>{[0, 1, 2, 3, 4].map(i => <g key={i}><line x1="58" y1={22 + i * 35} x2="624" y2={22 + i * 35} stroke="#eeecf2" strokeDasharray="4 4"/><text x="43" y={26 + i * 35} textAnchor="end" className="chart-label">{max * (4 - i) / 4 === 0 ? "R$ 0" : `R$ ${(max * (4 - i) / 4 / 100000).toLocaleString("pt-BR")} mil`}</text></g>)}<path d={`${line} L 624 162 L 58 162 Z`} fill={`url(#${gradient})`}/><path d={line} fill="none" stroke="#8c48e5" strokeWidth="2.7" strokeLinecap="round"/>{points.map((p, i) => <g key={p.full}><text x={coords[i].x} y="187" textAnchor="middle" className="chart-label month-label">{p.label}</text><circle cx={coords[i].x} cy={coords[i].y} r={hover === i ? 5 : 3.5} fill="white" stroke="#8c48e5" strokeWidth="2"/><rect x={coords[i].x - 25} y="0" width="50" height="166" fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} onClick={() => setHover(i)} tabIndex={0} aria-label={`${p.full}: ${money(p.amount)}`}/></g>)}</svg>{hover !== null && <div className="chart-tooltip" style={{ left: `${Math.min(82, Math.max(15, coords[hover].x / 650 * 100))}%` }}><span>{points[hover].full}</span><strong>{money(points[hover].amount)}</strong></div>}</div></section>;
}
