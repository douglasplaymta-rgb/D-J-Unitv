"use client";
import { useState, type FormEvent } from "react";
import { ArrowRight, CalendarDays, Check, Copy, ExternalLink, FlaskConical, Info, Link2, LoaderCircle, LogOut, MonitorPlay, RefreshCw, ShieldCheck, Tv, Wallet } from "lucide-react";
import { Brand, Status, Hint } from "@/components/ui";
import { clientStatus, date, money, PLANS, type ClientAccount } from "@/lib/types";

export default function ClientPortal({ initial }: { initial: ClientAccount }) {
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(null);
  const [plan, setPlan] = useState("Mensal");
  const client = data.client;
  const status = clientStatus(client);
  const active = ["active", "expiring", "trial"].includes(status);
  const pending = data.requests.find(r => r.status === "pending" && r.kind === "renewal");
  const tvLink = typeof window !== "undefined" ? `${window.location.origin}/api/tv/${client.token}` : `/api/tv/${client.token}`;
  const available = data.configured && active && Boolean(data.playlist?.enabled && data.playlist?.hasSource);
  const whatsapp = data.settings.phone.replace(/\D/g, "");

  function notify(message: string, error = false) { setToast({ message, error }); setTimeout(() => setToast(null), 4500); }
  async function act(action: string, extra: Record<string, unknown> = {}) {
    if (busy) return; setBusy(true);
    try {
      const response = await fetch("/api/client/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...extra }) });
      const result = await response.json();
      if (response.status === 401) { window.location.assign("/entrar"); return; }
      if (!response.ok) throw new Error(result.error);
      setData(result);
      notify(action === "trial" ? "Teste grátis liberado por 24 horas!" : action === "renew" ? "Renovação enviada. Aguarde a confirmação." : "Dados atualizados.");
    } catch (error) { notify(error instanceof Error ? error.message : "Não foi possível concluir.", true); }
    finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(tvLink); notify("Link da TV copiado."); }
    catch { notify("Não foi possível copiar. Selecione o link e copie.", true); }
  }
  async function logout() {
    await fetch("/api/client/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
    window.location.assign("/");
  }
  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await act("profile", { name: form.get("name"), phone: form.get("phone") });
  }

  return <div className="portal">
    <header className="portal-top">
      <a href="/" className="site-brand" aria-label="D&J UniTV"><Brand/></a>
      <div className="portal-user">
        <span>{client.name.split(" ")[0]}</span>
        <button className="text-button" onClick={logout}><LogOut size={15}/>Sair</button>
      </div>
    </header>

    <main className="portal-main">
      <section className={`portal-hero status-${status}`}>
        <div>
          <p>Olá, {client.name.split(" ")[0]}.</p>
          <h1>{status === "trial" ? "Seu teste está no ar." : status === "expired" ? "Sua conexão precisa ser renovada." : status === "paused" ? "Seu acesso está pausado." : status === "expiring" ? "Seu plano está perto de vencer." : "Sua TV está conectada."}</h1>
          <p className="portal-hero-sub">{client.plan === "Teste" || client.plan === "Avulso" ? "Acompanhe o tempo restante e, quando quiser, escolha um plano." : `Plano ${client.plan} · válido até ${date(client.expiresAt)}.`}</p>
        </div>
        <Status client={client}/>
      </section>

      <section className="portal-grid">
        <article className="card portal-card">
          <div className="card-heading"><div><h2>Meu acesso</h2><p>Resumo da sua conexão</p></div><Tv size={18}/></div>
          <dl className="portal-dl">
            <div><dt>Plano</dt><dd>{client.plan}</dd></div>
            <div><dt>Vencimento</dt><dd>{date(client.expiresAt)}{client.plan === "Teste" ? ` às ${new Date(client.expiresAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}</dd></div>
            <div><dt>Lista</dt><dd>{data.playlist?.name || "Aguardando vinculação"}</dd></div>
            <div><dt>Fonte</dt><dd>{data.playlist?.hasSource ? "Cadastrada" : "Pendente"}</dd></div>
          </dl>
        </article>

        <article className="card portal-card">
          <div className="card-heading"><div><h2>Teste grátis</h2><p>24 horas para conhecer a D&J</p></div><FlaskConical size={18}/></div>
          {client.trialUsed ? <p className="portal-note">O teste desta conta já foi utilizado. Para continuar, escolha um plano e solicite a renovação.</p>
            : <><p className="portal-note">Libere 24 horas agora. Disponível uma vez por conta, quando você estiver sem acesso ativo.</p>
              <button className="button button-primary" disabled={busy || active} onClick={() => act("trial")}>{busy ? <LoaderCircle className="spin" size={16}/> : <FlaskConical size={16}/>}Começar teste grátis</button>
              {active && <small>Seu acesso já está ativo.</small>}</>}
        </article>

        <article className="card portal-card portal-renew">
          <div className="card-heading"><div><h2>Renovar canais</h2><p>Escolha o plano e envie o pedido</p></div><RefreshCw size={18}/></div>
          {pending ? <div className="pending-box"><CalendarDays size={18}/><div><strong>Pedido em análise</strong><p>Plano {pending.plan} · {money(pending.amount)}. A D&J UniTV confirma após o pagamento combinado.</p></div></div>
            : <form onSubmit={e => { e.preventDefault(); act("renew", { plan, message: new FormData(e.currentTarget).get("message") }); }}>
              <div className="plan-options">{Object.entries(PLANS).map(([name, info]) => (
                <label key={name} className={plan === name ? "plan-option selected" : "plan-option"}>
                  <input type="radio" name="plan" value={name} checked={plan === name} onChange={() => setPlan(name)}/>
                  <span className="plan-option-top"><strong>{name}</strong><span className="custom-radio">{plan === name && <i/>}</span></span>
                  <b>{money(info.price)}</b><small>{info.description}</small>
                </label>
              ))}</div>
              <label>Mensagem <span className="optional">opcional</span><textarea name="message" rows={2} maxLength={500} placeholder="Ex.: Paguei no Pix hoje às 14h."/></label>
              {whatsapp && <a className="text-button" href={`https://wa.me/55${whatsapp}`} target="_blank" rel="noopener noreferrer">Falar no WhatsApp para pagar<ArrowRight size={13}/></a>}
              <Hint>O pedido não cobra automaticamente. A equipe confirma o pagamento e libera a renovação no painel.</Hint>
              <button className="button button-primary" disabled={busy} type="submit">{busy ? <LoaderCircle className="spin" size={16}/> : <Wallet size={16}/>}Solicitar renovação</button>
            </form>}
        </article>

        <article className="card portal-card">
          <div className="card-heading"><div><h2>Conectar à TV</h2><p>Seu link individual</p></div><MonitorPlay size={18}/></div>
          {available ? <>
            <p className="portal-note">Cole este link em um aplicativo compatível com listas M3U. Não compartilhe com outras pessoas.</p>
            <div className="copy-input"><input readOnly aria-label="Link para a TV" value={tvLink} onFocus={e => e.target.select()}/><button className="button button-primary" onClick={copy}><Copy size={15}/>Copiar</button></div>
            <a className="text-button" href={tvLink} target="_blank" rel="noopener noreferrer">Testar link<ExternalLink size={13}/></a>
          </> : <p className="portal-note">{!data.configured ? "A D&J Entreteniment ainda está concluindo a ativação do painel. Em breve o link da TV é liberado." : !active ? "Renove ou inicie o teste para liberar o link." : !data.playlist?.hasSource ? "Sua lista ainda não tem uma fonte de canais cadastrada. A equipe D&J faz essa vinculação." : "Seu acesso está indisponível no momento."}</p>}
        </article>
      </section>

      <section className="portal-split">
        <article className="card portal-card">
          <div className="card-heading"><div><h2>Meus dados</h2><p>Como entramos em contato</p></div></div>
          <form className="form-stack" onSubmit={saveProfile}>
            <label>Nome<input name="name" defaultValue={client.name} required minLength={2} maxLength={100}/></label>
            <label>E-mail<input value={client.email} disabled readOnly/></label>
            <label>WhatsApp<input name="phone" defaultValue={client.phone} maxLength={30}/></label>
            <button className="button button-secondary" disabled={busy} type="submit">Salvar dados</button>
          </form>
        </article>
        <article className="card portal-card">
          <div className="card-heading"><div><h2>Histórico</h2><p>Pagamentos e pedidos</p></div></div>
          {!data.payments.length && !data.requests.length ? <p className="portal-note">Nada por aqui ainda. Seu teste e suas renovações aparecerão nesta lista.</p>
            : <ul className="portal-history">
              {data.requests.slice(0, 6).map(r => <li key={r.id}><span className={`status status-${r.status === "approved" ? "active" : r.status === "rejected" ? "expired" : "expiring"}`}><i/>{r.status === "pending" ? "Em análise" : r.status === "approved" ? "Confirmado" : "Recusado"}</span><div><strong>{r.kind === "renewal" ? `Renovação ${r.plan}` : r.kind}</strong><small>{date(r.createdAt)} · {money(r.amount)}</small></div></li>)}
              {data.payments.slice(0, 6).map(p => <li key={p.id}><span className="status status-active"><i/>Recebido</span><div><strong>{p.plan}</strong><small>{date(p.createdAt)} · {money(p.amount)}</small></div></li>)}
            </ul>}
        </article>
      </section>
      <p className="portal-disclaimer"><Info size={14}/> A D&J Entreteniment organiza o seu acesso. Canais, disponibilidade e regras do provedor não são operados por este portal.</p>
    </main>
    {toast && <div className={`toast ${toast.error ? "toast-error" : ""}`} role="status"><span>{toast.error ? "!" : <Check size={17}/>}</span>{toast.message}</div>}
  </div>;
}
