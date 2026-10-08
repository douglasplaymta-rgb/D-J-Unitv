"use client";
import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Eye, EyeOff, LoaderCircle, LockKeyhole, Sparkles, Tv } from "lucide-react";
import { Brand } from "@/components/ui";

export default function ClientAuth({ mode }: { mode: "login" | "register" }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [visible, setVisible] = useState(false);
  const register = mode === "register";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = register
      ? { action: "register", name: form.get("name"), email: form.get("email"), phone: form.get("phone"), password: form.get("password"), startTrial: form.get("startTrial") === "on" }
      : { action: "login", email: form.get("email"), password: form.get("password") };
    try {
      const response = await fetch("/api/client/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      window.location.assign("/conta");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível continuar. Tente novamente.");
      setBusy(false);
    }
  }
  return <main className="auth-layout client-auth">
    <section className="auth-brand-panel">
      <a href="/" aria-label="Voltar ao início"><Brand/></a>
      <div className="auth-story">
        <span className="eyebrow">ÁREA DO CLIENTE</span>
        <h1>{register ? <>Sua conta.<br/><span>Seu teste grátis.</span></> : <>Bem-vindo<br/>de volta.</>}</h1>
        <p>{register ? "Crie seu acesso, experimente 24 horas e depois renove seus canais quando quiser." : "Entre para ver seu plano, renovar e copiar o link da sua TV."}</p>
        <div className="auth-features">
          <span><Sparkles size={18}/>Teste grátis de 24 horas</span>
          <span><Tv size={18}/>Link individual para a TV</span>
          <span><LockKeyhole size={18}/>Renovação acompanhada por você</span>
        </div>
      </div>
      <div className="auth-brand-foot"><span className="online-dot"/>D&J Entreteniment · Conexão sem limites</div>
    </section>
    <section className="auth-form-panel">
      <div className="auth-form-wrap">
        <a className="back-link" href="/">Voltar ao início</a>
        <span className="auth-lock"><LockKeyhole size={25}/></span>
        <h2>{register ? "Criar minha conta" : "Entrar na minha conta"}</h2>
        <p className="auth-intro">{register ? "Preencha seus dados para acessar o portal do cliente." : "Use o e-mail e a senha cadastrados no portal."}</p>
        <form onSubmit={submit} className="auth-form">
          {register && <label>Nome completo<input autoFocus name="name" required minLength={2} maxLength={100} placeholder="Seu nome" autoComplete="name"/></label>}
          <label>E-mail<input name="email" type="email" required maxLength={180} placeholder="voce@email.com" autoComplete="email" autoFocus={!register}/></label>
          {register && <label>WhatsApp <span className="optional">opcional</span><input name="phone" type="tel" maxLength={30} placeholder="(11) 99999-9999" autoComplete="tel"/></label>}
          <label>Senha
            <div className="password-input">
              <input name="password" type={visible ? "text" : "password"} required minLength={register ? 8 : 1} maxLength={128} placeholder={register ? "No mínimo 8 caracteres" : "Sua senha"} autoComplete={register ? "new-password" : "current-password"}/>
              <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
            </div>
          </label>
          {register && <label className="check-label"><input type="checkbox" name="startTrial" defaultChecked/><span>Quero começar meu teste grátis de 24 horas agora</span></label>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary auth-submit" disabled={busy} type="submit">
            {busy ? <LoaderCircle size={18} className="spin"/> : <LockKeyhole size={17}/>}
            {busy ? "Só um instante..." : register ? "Criar conta" : "Entrar"}
            {!busy && <ArrowRight size={17}/>}
          </button>
        </form>
        <p className="auth-switch">{register ? <>Já tem conta? <a href="/entrar">Entrar</a></> : <>Novo por aqui? <a href="/cadastro">Criar conta e testar grátis</a></>}</p>
        <div className="auth-trust"><Check size={14}/> Senha protegida <span>·</span> Um teste por conta</div>
      </div>
      <footer>D&J Entreteniment © {new Date().getFullYear()}</footer>
    </section>
  </main>;
}
