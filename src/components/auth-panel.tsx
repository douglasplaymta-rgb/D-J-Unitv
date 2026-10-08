"use client";
import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, ShieldCheck, Tv, Users, LoaderCircle } from "lucide-react";
import { Brand } from "@/components/ui";

export default function AuthPanel({ configured, needsToken }: { configured: boolean; needsToken: boolean }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [visible, setVisible] = useState(false); const [help, setHelp] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = configured ? { action: "login", email: form.get("email"), password: form.get("password") } : {
      action: "setup",
      accounts: [1, 2].map(i => ({ name: form.get(`name${i}`), email: form.get(`email${i}`), password: form.get(`password${i}`) })),
      setupToken: form.get("setupToken"),
    };
    try {
      const response = await fetch("/api/auth", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      window.location.replace("/admin");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Não foi possível conectar. Tente novamente.");
      setBusy(false);
    }
  }
  return <main className="auth-layout">
    <section className="auth-brand-panel">
      <Brand/>
      <div className="auth-story">
        <span className="eyebrow">PAINEL DOS FUNDADORES</span>
        <h1>Somente você<br/>e seu pai.<br/><span>Ninguém mais.</span></h1>
        <p>O painel administrativo da D&J Entreteniment é exclusivo dos dois fundadores. Clientes entram pelo site, nunca por aqui.</p>
        <div className="auth-features">
          <span><Users size={18}/>Duas contas, acesso completo</span>
          <span><Tv size={18}/>Clientes, testes e listas no controle</span>
          <span><ShieldCheck size={18}/>Ambiente zerado para ir ao ar</span>
        </div>
      </div>
      <div className="auth-brand-foot"><span className="online-dot"/>D&J UniTV · Administração privada</div>
    </section>
    <section className="auth-form-panel">
      <div className="auth-form-wrap">
        <a className="back-link" href="/">Ir para o site dos clientes</a>
        <span className="auth-lock"><LockKeyhole size={25}/></span>
        <h2>{configured ? "Acesso administrativo" : "Ativar o painel zerado"}</h2>
        <p className="auth-intro">{configured ? "Entre com a sua conta de fundador para abrir o painel." : "Cadastre as duas únicas contas: a sua e a do seu pai. O sistema começa vazio, pronto para os dados reais."}</p>
        <form onSubmit={submit} className="auth-form">
          {configured ? <>
            <label>E-mail<input autoFocus name="email" type="email" autoComplete="email" placeholder="seu@email.com" required maxLength={180}/></label>
            <label>Senha
              <div className="password-input">
                <input name="password" type={visible ? "text" : "password"} autoComplete="current-password" placeholder="Digite sua senha" required maxLength={128}/>
                <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
              </div>
            </label>
            <button type="button" className="forgot-link" onClick={() => setHelp(!help)}>Precisa de ajuda para entrar?</button>
            {help && <div className="hint">A senha pode ser alterada em Configurações depois de entrar. Se os dois fundadores perderem o acesso, a recuperação precisa ser feita no servidor, com segurança.</div>}
          </> : <>
            {[1, 2].map(i => (
              <fieldset className="account-fieldset" key={i}>
                <legend><span>{i}</span>{i === 1 ? "Sua conta" : "Conta do seu pai"}</legend>
                <div className="form-grid">
                  <label>Nome<input name={`name${i}`} placeholder={i === 1 ? "Seu nome" : "Nome do seu pai"} required minLength={2} maxLength={100} autoComplete="off"/></label>
                  <label>E-mail<input name={`email${i}`} type="email" placeholder="nome@email.com" required maxLength={180} autoComplete="off"/></label>
                </div>
                <label>Senha<input name={`password${i}`} type="password" placeholder="Pelo menos 10 caracteres" required minLength={10} maxLength={128} autoComplete="new-password"/></label>
              </fieldset>
            ))}
            {needsToken && <label>Chave de instalação<input name="setupToken" type="password" required placeholder="Chave configurada no servidor"/></label>}
            <p className="form-note">Não existe cadastro público para este painel. Depois de ativar, só estas duas contas entram. O ambiente inicia sem clientes, sem listas e sem pagamentos de exemplo.</p>
          </>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary auth-submit" disabled={busy} type="submit">
            {busy ? <LoaderCircle size={18} className="spin"/> : configured ? <LockKeyhole size={17}/> : <ShieldCheck size={17}/>}
            {busy ? "Só um instante..." : configured ? "Entrar no painel" : "Ativar painel zerado"}
            {!busy && <ArrowRight size={17}/>}
          </button>
        </form>
        <div className="auth-trust"><Check size={14}/> Senhas criptografadas <span>·</span> Clientes não entram aqui</div>
      </div>
      <footer>D&J UniTV © {new Date().getFullYear()} · Painel exclusivo dos fundadores.</footer>
    </section>
  </main>;
}
