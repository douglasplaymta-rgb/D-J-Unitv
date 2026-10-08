# D&J UniTV

Sistema em português com três camadas:

- **Site e portal do cliente** (`/`, `/entrar`, `/cadastro`, `/conta`): teste grátis, renovação de canais e link da TV.
- **Login administrativo** (`/admin/login`): exclusivo para você e seu pai.
- **Painel administrativo** (`/admin`): clientes, testes, solicitações, listas, financeiro e configurações.

## Portal do cliente

1. O visitante cria uma conta em `/cadastro`.
2. Pode iniciar **um teste grátis de 24 horas** por conta.
3. Copia o link individual para um player M3U.
4. Escolhe um plano e **solicita a renovação**. A equipe confirma o pagamento no painel, em **Solicitações**.

Não há cobrança automática. O portal registra o pedido; a liberação acontece após a confirmação administrativa.

## Primeiro acesso (administração)

O painel administrativo **não é para clientes**. Só os dois fundadores entram em `/admin/login`.

Na primeira vez, cadastre **sua conta** e a **conta do seu pai**, com e-mails diferentes e senhas de pelo menos dez caracteres. O sistema inicia **zerado**: sem clientes, sem listas e sem pagamentos de exemplo.

Depois disso:
- Todas as consultas e alterações administrativas exigem sessão de um dos dois fundadores.
- Não há cadastro público nem senha padrão.
- Clientes usam `/cadastro`, `/entrar` e `/conta`.
- As senhas são derivadas com scrypt e salt individual.
- As sessões usam tokens aleatórios, armazenados como hash, e cookies HttpOnly, Secure em produção e SameSite=Lax.
- Tentativas de login são limitadas. Trocar a senha encerra as sessões anteriores daquela conta.

Para uma implantação pública, configure `SETUP_TOKEN` como um segredo forte no servidor **antes de expor o primeiro acesso**. A instalação então exigirá essa chave para criar as duas contas. `DATABASE_URL` permanece exclusivamente no servidor. Use HTTPS em produção.

## Funcionalidades

- Visão geral, receita mensal e gráfico de receitas dos últimos 3, 6 ou 12 meses.
- Cadastro, edição, busca, filtros, pausa, reativação e exclusão de clientes.
- Renovações mensais, trimestrais, semestrais e anuais, com registro financeiro e histórico.
- Testes de 6, 12, 24 ou 48 horas e conversão em assinatura.
- Listas de canais com fonte M3U, categorias e vínculo por cliente.
- Histórico financeiro, distribuição de planos, atividades e exportações CSV.
- Configurações da empresa, antecedência dos lembretes e troca de senha.
- Interface responsiva com navegação por teclado e atalhos de busca.

O financeiro **registra pagamentos recebidos e confirmados pelo administrador**; não realiza cobranças nem confirma pagamentos em bancos ou gateways. Os lembretes são internos ao painel, sem disparo automático de mensagens.

## Conectar uma TV

1. Ative o acesso privado.
2. Crie uma lista e cadastre a URL M3U de uma fonte que você tenha autorização para utilizar e distribuir.
3. Vincule essa lista a um cliente ou teste ativo.
4. Nos detalhes do cliente, copie o link individual para a TV.
5. Adicione o link como lista por URL em um player compatível com M3U.

O endpoint `/api/tv/[token]` valida o acesso e redireciona para a fonte cadastrada. A validade do cliente, a pausa do acesso e a ativação da lista são verificadas a cada nova solicitação ao painel. O painel não fornece canais, não retransmite conteúdo e não testa automaticamente a disponibilidade de URLs externas.

**Não existe integração automática com a API ou o aplicativo oficial UniTV.** O aplicativo oficial pode não aceitar listas externas. A compatibilidade e a reprodução dependem do player e do provedor. Credenciais, limites de dispositivos e renovações exigidas pelo provedor devem ser administrados também nele. Depois que um player recebe a URL da fonte, seu uso direto e a reprodução em andamento dependem dos controles do próprio provedor.

## Banco e validação

As tabelas estão em `src/db/schema.ts`; a conexão usa `src/db/index.ts` e a variável `DATABASE_URL`. O ambiente precisa estar inicializado antes de aplicar o schema com Drizzle.

Validação do projeto:
- `npx next typegen`
- `npm exec tsc -- --noEmit --pretty false`
- `npm run build`

Testes de navegação, persistência, renovação, listas, responsividade, dois administradores e controle de acesso:
- `npx playwright install --with-deps chromium`
- `npx playwright test tests/unitv.spec.ts --workers=1`

Os testes de navegador requerem uma instância em execução, usam `TEST_BASE_URL` (padrão: localhost na porta 3000) e devem ser executados **somente em banco de teste no modo demonstração**. O teste de instalação não é executado em uma instalação já configurada. Os registros temporários são removidos ao final.

A rota `/api/health` verifica a conexão com PostgreSQL. O selo “Sistema online” refere-se ao painel, não à disponibilidade de provedores externos de canais.
