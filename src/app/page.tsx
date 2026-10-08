export const dynamic = "force-dynamic";

export const metadata = {
  title: "D&J UniTV | Entretenimento sem limites",
  description: "Teste grátis, renovação de canais e acesso à TV em um só lugar. D&J UniTV.",
};

export default function HomePage() {
  const numeroWhatsApp = "5585987428853";
  const mensagemWhatsApp = encodeURIComponent("Quero fazer meu teste Gratis");
  const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagemWhatsApp}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      {/* Menu Superior Limpo */}
      <header className="w-full py-6 px-6 lg:px-20 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-wider text-purple-400">D&J UniTV</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-300">
          <a href="#planos" className="hover:text-purple-400 transition">Planos</a>
          <a href="#como-funciona" className="hover:text-purple-400 transition">Como funciona</a>
        </nav>
        <div>
          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg"
          >
            Peça seu Teste Grátis
          </a>
        </div>
      </header>

      {/* Hero Section Focado em Vendas */}
      <section className="flex-1 flex items-center px-6 lg:px-20 py-12">
        <div className="max-w-2xl">
          <span className="text-purple-400 font-semibold tracking-wider uppercase text-sm">
            CONEXÃO SEM LIMITES
          </span>
          <h1 className="text-4xl lg:text-6xl font-bold mt-2 mb-6 leading-tight">
            Seu entretenimento. Na sua TV. Do seu jeito.
          </h1>
          <p className="text-gray-300 text-lg mb-8">
            Comece agora com um teste grátis de 24 horas. Sem burocracia, atendimento direto pelo WhatsApp com o nosso suporte.
          </p>

          {/* Botão Gigante de Teste Grátis */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <a
              href={linkWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xl px-10 py-5 rounded-2xl shadow-xl transition-all transform hover:scale-105 flex items-center gap-3 w-full sm:w-auto justify-center"
            >
              🚀 Peça seu Teste Grátis Agora
            </a>
          </div>

          {/* Número de Contato Direto */}
          <div className="mt-6 flex items-center gap-2 text-gray-400 text-sm">
            <span>📞 WhatsApp Direto:</span>
            <a href={linkWhatsApp} target="_blank" rel="noopener noreferrer" className="text-purple-400 font-semibold hover:underline text-base">
              (85) 98742-8853
            </a>
          </div>

          {/* Vantagens */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-900 pt-6 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <span className="text-purple-400">✓</span> Teste grátis de 24 horas
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400">✓</span> Renovação facilitada pelo celular
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400">✓</span> Link individual para a TV
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé Simples */}
      <footer className="py-6 px-6 lg:px-20 border-t border-slate-900 text-center text-gray-500 text-xs">
        © 2026 D&J UniTV. Todos os direitos reservados.
      </footer>
    </div>
  );
}