"use client";
import { ArrowRight, Check, Clapperboard, LockKeyhole, Play, ShieldCheck, Smartphone, Sparkles, Trophy, Tv, Zap } from "lucide-react";
import { Brand } from "@/components/ui";
import { money, PLANS } from "@/lib/types";

export default function Landing({ signedIn }: { signedIn: boolean }) {
  return <div className="site">
    <header className="site-header">
      <a href="/" className="site-brand" aria-label="D&J UniTV"><Brand/></a>
      <nav className="site-nav" aria-label="Principal">
        <a href="#planos">Planos</a>
        <a href="#como-funciona">Como funciona</a>
        <a href={signedIn ? "/conta" : "/entrar"}>{signedIn ? "Minha conta" : "Entrar"}</a>
        <a className="button button-primary" href="/cadastro">Teste grátis</a>
      </nav>
    </header>

    <section className="site-hero">
      <img src="/images/landing-living.jpg" alt="" className="site-hero-photo"/>
      <div className="site-hero-shade"/>
      <div className="site-hero-copy">
        <span className="banner-eyebrow"><Sparkles size={12}/> CONEXÃO SEM LIMITES</span>
        <h1>Seu entretenimento.<br/>Na sua TV. Do seu jeito.</h1>
        <p>Comece com um teste grátis de 24 horas, renovar seus canais quando quiser e acompanhar tudo em um portal só seu.</p>
        <div className="site-hero-actions">
          <a className="button button-primary" href="/cadastro"><Play size={16}/>Começar teste grátis</a>
          <a className="button button-ghost" href="/entrar">Já tenho conta</a>
        </div>
        <ul className="site-hero-points">
          <li><Check size={14}/> Teste grátis de 24 horas</li>
          <li><Check size={14}/> Renovação pelo celular</li>
          <li><Check size={14}/> Link individual para a TV</li>
        </ul>
      </div>
    </section>

    <section className="site-section" id="beneficios">
      <div className="site-kicker">O QUE VOCÊ ENCONTRA</div>
      <h2>Tudo o que importa, em um só lugar.</h2>
      <div className="site-features">
        {[
          { icon: Zap, title: "Teste grátis na hora", text: "Crie sua conta e libere 24 horas para conhecer a experiência D&J UniTV." },
          { icon: Tv, title: "Canais na sua TV", text: "Copie seu link individual e adicione em um aplicativo compatível com lista M3U." },
          { icon: Smartphone, title: "Renove quando quiser", text: "Escolha o plano, solicite a renovação e acompanhe o status da sua conexão." },
          { icon: ShieldCheck, title: "Sua conta, protegida", text: "Acesso com senha, histórico de pagamentos e dados só seus." },
        ].map(item => <article key={item.title}><span><item.icon size={22}/></span><h3>{item.title}</h3><p>{item.text}</p></article>)}
      </div>
    </section>

    <section className="site-mosaic">
      <figure><img src="/images/landing-sports.jpg" alt="Transmissão esportiva em uma TV"/><figcaption><Trophy size={16}/>Esportes ao vivo</figcaption></figure>
      <figure><img src="/images/landing-family.jpg" alt="Sala aconchegante pronta para filmes e séries"/><figcaption><Clapperboard size={16}/>Cinema e séries</figcaption></figure>
    </section>

    <section className="site-section" id="planos">
      <div className="site-kicker">PLANOS</div>
      <h2>Escolha o tempo da sua conexão.</h2>
      <p className="site-lead">Valores de referência. A renovação é confirmada pela D&J UniTV após o pagamento combinado.</p>
      <div className="site-plans">
        {Object.entries(PLANS).map(([name, info], i) => (
          <article key={name} className={i === 1 ? "featured" : ""}>
            {i === 1 && <span className="plan-tag">Mais escolhido</span>}
            <h3>{name}</h3>
            <p>{info.description}</p>
            <strong>{money(info.price)}</strong>
            <small>{info.months === 1 ? "por mês" : `por ${info.months} meses`}</small>
            <a href="/cadastro">Quero este plano<ArrowRight size={14}/></a>
          </article>
        ))}
      </div>
    </section>

    <section className="site-section" id="como-funciona">
      <div className="site-kicker">COMO FUNCIONA</div>
      <h2>Quatro passos para se conectar.</h2>
      <ol className="site-steps">
        <li><span>1</span><div><h3>Crie sua conta</h3><p>Nome, e-mail e uma senha. É o seu espaço na D&J UniTV.</p></div></li>
        <li><span>2</span><div><h3>Ative o teste grátis</h3><p>24 horas para experimentar. Um teste por conta.</p></div></li>
        <li><span>3</span><div><h3>Leve para a TV</h3><p>No portal, copie o link individual e cole em um player M3U.</p></div></li>
        <li><span>4</span><div><h3>Renove os canais</h3><p>Escolha o plano, combine o pagamento e acompanhe a confirmação.</p></div></li>
      </ol>
    </section>

    <section className="site-cta">
      <div>
        <h2>Pronto para começar?</h2>
        <p>Crie sua conta agora e libere o teste grátis de 24 horas.</p>
      </div>
      <a className="button button-primary" href="/cadastro">Criar minha conta<ArrowRight size={16}/></a>
    </section>

    <footer className="site-footer">
      <div><Brand/><p>Entretenimento que conecta. Gestão que simplifica.</p></div>
      <div>
        <a href="/entrar">Área do cliente</a>
        <a href="/cadastro">Teste grátis</a>
        <a href="/admin/login" className="site-admin-link"><LockKeyhole size={13}/>Administração</a>
      </div>
      <small>© {new Date().getFullYear()} D&J UniTV. Conteúdo e fontes de canais dependem de provedores autorizados. Este painel não é o aplicativo oficial UniTV.</small>
    </footer>
  </div>;
}
