"use client";
import { ArrowRight, Check, Clapperboard, Play, ShieldCheck, Smartphone, Sparkles, Trophy, Tv, Zap } from "lucide-react";
import { Brand } from "@/components/ui";
import { PLANS } from "@/lib/types";

export default function Landing() {
  // Número do WhatsApp configurado: (85) 98742-8553
  const whatsappNumber = "5585987428553";
  const whatsappMessage = encodeURIComponent("Olá! Gostaria de pedir meu teste grátis.");
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="site">
      <header className="site-header">
        <a href="/" className="site-brand" aria-label="D&J UniTV"><Brand /></a>
        <nav className="site-nav" aria-label="Principal">
          <a href="#planos">Planos</a>
          <a href="#como-funciona">Como funciona</a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="button button-primary">Peça seu Teste Grátis</a>
        </nav>
      </header>

      <section className="site-hero">
        <img src="/images/landing-living.jpg" alt="" className="site-hero-photo"/>
        <div className="site-hero-shade"/>
        <div className="site-hero-copy">
          <span className="banner eyebrow"><Sparkles size={12}/> CONEXÃO SEM LIMITES</span>
          <h1>Seu entretenimento na sua TV. Do seu jeito.</h1>
          <p>Peça seu teste grátis de 24 horas agora mesmo pelo WhatsApp, escolha seu plano e curta seus canais com qualidade.</p>
          <div className="site-hero-actions">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="button button-primary"><Play size={16}/>Peça seu Teste Grátis</a>
          </div>
        </div>
        <ul className="site-hero-points">
          <li><Check size={14}/> Teste grátis de 24 horas</li>
          <li><Check size={14}/> Atendimento rápido via WhatsApp</li>
          <li><Check size={14}/> Link individual para a TV</li>
        </ul>
      </section>

      <section className="site-section" id="beneficios">
        <div className="site-kicker">O QUE VOCÊ ENCONTRA</div>
        <h2>Tudo o que importa, em um só lugar.</h2>
        <div className="site-features">
          {[
            { icon: Zap, title: "Teste grátis na hora", text: "Fale connosco no WhatsApp e libere 24 horas para conhecer a experiência D&J UniTV." },
            { icon: Tv, title: "Canais na sua TV", text: "Receba seu link individual e adicione em um aplicativo compatível com lista M3U." },
            { icon: Smartphone, title: "Renove quando quiser", text: "Escolha o plano, combine a renovação e mantenha sua conexão ativa." },
            { icon: ShieldCheck, title: "Qualidade garantida", text: "Suporte dedicado e estabilidade para você curtir sem travamentos." }
          ].map((item) => (
            <article key={item.title} className="site-feature">
              <span><item.icon size={22}/></span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-mosaic">
        <figure><img src="/images/landing-sports.jpg" alt="Transmissão esportiva em uma TV"/><figcaption><Trophy size={16}/>Esportes ao vivo</figcaption></figure>
        <figure><img src="/images/landing-family.jpg" alt="Sala aconchegante pronta para filmes e séries"/><figcaption><Clapperboard size={16}/>Cinema e séries</figcaption></figure>
      </section>

      <section className="site-section" id="planos">
        <div className="site-kicker">PLANOS</div>
        <h2>Escolha o tempo da sua conexão.</h2>
        <p className="site-lead">Valores de referência. A contratação e a renovação são combinadas diretamente pelo WhatsApp da D&J UniTV.</p>
        <div className="site-plans">
          {Object.entries(PLANS).map(([name, info], i) => (
            <article key={name} className={`site-plan ${i === 1 ? "featured" : ""}`}>
              {i === 1 && <span className="plan-tag">Mais escolhido</span>}
              <h3>{name}</h3>
              <p className="description">{info.description}</p>
              <p>
                <strong><span className="currency">R$</span>{info.price}</strong>
                <small>/ {info.months === 1 ? "por mês" : `por ${info.months} meses`}</small>
              </p>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="button button-ghost" style={{ marginTop: '1rem', width: '100%', textAlign: 'center' }}>
                Quero este plano <ArrowRight size={14}/>
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section" id="como-funciona">
        <div className="site-kicker">COMO FUNCIONA</div>
        <h2>Três passos para se conectar.</h2>
        <ol className="site-steps">
          <li><span>1</span><div><h3>Peça seu teste</h3><p>Clique em qualquer botão de teste e fale diretamente no nosso WhatsApp.</p></div></li>
          <li><span>2</span><div><h3>Ative na sua TV</h3><p>Receba as instruções, copie seu link e cole no seu player M3U.</p></div></li>
          <li><span>3</span><div><h3>Curta e renove</h3><p>Aproveite o melhor do entretenimento e renove quando quiser pelo WhatsApp.</p></div></li>
        </ol>
      </section>

      <section className="site-cta">
        <div>
          <h2>Pronto para começar?</h2>
          <p>Peça seu teste grátis de 24 horas agora mesmo pelo WhatsApp.</p>
        </div>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="button button-primary">Peça seu Teste Grátis<ArrowRight size={16}/></a>
      </section>

      <footer className="site-footer">
        <div>
          <Brand /><p>Entretenimento que conecta. Gestão que simplifica.</p>
        </div>
        <small>© {new Date().getFullYear()} D&J UniTV. Conteúdo e fontes de canais dependem de provedores autorizados.</small>
      </footer>
    </div>
  );
}