# Magic TCG Tracker

Catálogo de cartas de Magic com filtros, preços diários em USD, histórico, maiores variações do mercado, favoritos por usuário e painel administrativo. Interface em português e inglês, com tema escuro e layout responsivo.

## Requisitos

- Node.js 22.12+ (recomendado: Node 24 LTS)
- PostgreSQL 16+; opcionalmente Docker Compose para iniciar o banco local
- Acesso à API e aos arquivos bulk do Scryfall para importar cartas e preços

## Executar localmente

Na raiz do repositório:

```bash
npm ci --prefix server
npm ci --prefix tcg-project
cp server/.env.example server/.env
cp tcg-project/.env.example tcg-project/.env
docker compose up -d db
```

Em `server/.env`, substitua `JWT_SECRET` por um segredo aleatório de pelo menos 32 caracteres, por exemplo o resultado de `openssl rand -hex 32`. Se usar outro PostgreSQL, ajuste `DATABASE_URL`.

```bash
cd server
npm run db:migrate
npm run db:generate
npm run sync
npm run dev
```

A primeira importação baixa o catálogo bulk completo do Scryfall e pode demorar. O processamento usa streaming e lotes. Não é necessário importar para abrir a interface, mas o catálogo ficará vazio.

Em outro terminal, na raiz:

```bash
npm run dev --prefix tcg-project
```

Abra http://localhost:5173, crie sua conta e entre no catálogo. A API usa http://localhost:8000. Configure `VITE_SERVER_URL` no frontend e `CORS_ORIGIN` no backend ao usar outros endereços; `CORS_ORIGIN` aceita origens separadas por vírgula. Reinicie os processos depois de alterar os arquivos `.env`.

## Administrador e sincronização

Crie uma conta pela interface, depois conceda acesso no terminal do servidor:

```bash
npm run admin -- seu-email@example.com
```

Acesse `/admin` para importar cartas, atualizar preços e acompanhar o status das tarefas. A autorização consulta a função atual do usuário no banco. Os endpoints administrativos não permitem trabalhos simultâneos no mesmo processo.

Para sincronizar cartas e preços diariamente, configure `SYNC_ENABLED=true` e `SYNC_HOUR_UTC=11` em `server/.env`. Isso executa às 08:00 de Brasília enquanto o servidor estiver ativo. Também é possível executar `npm run sync` por um agendador externo. Use somente um agendador; em múltiplas réplicas, desative o agendador interno e execute o CLI em um único worker. O agendador interno não recupera execuções perdidas enquanto o servidor esteve desligado.

Cada carta tem no máximo um registro por dia UTC. Repetir a importação no mesmo dia preserva esse registro e atualiza o preço atual do catálogo. As maiores variações comparam os dois últimos dias disponíveis; são necessários dois registros. Os valores exibidos representam USD **nonfoil** do Scryfall; o filtro foil indica disponibilidade da carta nesse acabamento, não um histórico separado de preços foil.

## Banco existente

As migrations incluem a correção de `quality_score` e dos IDs obrigatórios que faltavam na migration inicial, além da tabela de favoritos. Faça backup antes de aplicar em um banco existente. IDs nulos em dados antigos impedem a migration; corrija esses registros antes de continuar. Se o banco foi criado manualmente ou com `db push`, reconcilie o histórico de migrations antes de usar `migrate deploy`; não use `migrate reset` no banco com seus dados.

## Verificação

```bash
npm run build --prefix server
npm test --prefix server
npm run lint --prefix tcg-project
npm run build --prefix tcg-project
```

O teste de integração exige um **banco de testes separado**, com as migrations aplicadas:

```bash
cd server
DATABASE_URL=postgresql://tcg:tcg@localhost:5432/tcg_test npm run db:migrate
TEST_DATABASE_URL=postgresql://tcg:tcg@localhost:5432/tcg_test npm test
```

Sem `TEST_DATABASE_URL`, apenas os testes unitários executam. A integração cria e remove seus próprios registros. Ela cobre autenticação, validação, perfil, autorização, filtros, favoritos isolados por conta, imagens de cartas dupla face, idempotência dos preços diários e variações de mercado. As respostas bulk externas são simuladas nesses testes; não há download do catálogo real.

Testes de navegador com API simulada, em desktop e mobile:

```bash
cd tcg-project
npx playwright install chromium
npm run test:e2e
```

O workflow de CI executa migrations em PostgreSQL 16, testes da API, lint, builds e testes de navegador.

## Produção

```bash
cd server
npm run db:migrate
npm run build
npm start
```

Compile o frontend com `npm run build --prefix tcg-project` e hospede `tcg-project/dist` em um servidor estático com fallback das rotas para `index.html`. Defina `VITE_SERVER_URL` **antes** de compilar. Use HTTPS e um segredo JWT próprio no ambiente de produção. `PORT` controla a porta da API; `/health` indica que o processo está ativo. O servidor verifica a conexão ao banco antes de iniciar.

## Estrutura

- `server/`: Express, TypeScript, Prisma 7, PostgreSQL, JWT e jobs Scryfall.
- `tcg-project/`: React 19, Vite, Tailwind e gráficos ApexCharts carregados sob demanda.
- `compose.yaml`: PostgreSQL para desenvolvimento local.
- `.github/workflows/ci.yml`: verificações automatizadas.

Os dados e imagens são fornecidos pelo [Scryfall](https://scryfall.com/). Este projeto não é afiliado à Wizards of the Coast.
