# Arcana — TCG Store Intelligence

Workspace para lojas de Magic com radar de preços, catálogo, favoritos e estoque compartilhado entre administradores. Interface em português e inglês, com visual claro, tons naturais e navegação responsiva. Preços de mercado Scryfall em USD; custos e preços da loja em BRL.

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

## Erro ECONNREFUSED ao iniciar ou sincronizar

Esse erro indica que não há PostgreSQL acessível no endereço de `DATABASE_URL`. O banco precisa estar disponível antes de executar `sync` ou `dev`. Na raiz do projeto:

```bash
docker compose up -d --wait db
npm run db:migrate --prefix server
npm run db:generate --prefix server
npm run sync --prefix server
npm run dev --prefix server
```

Se o Docker retornar `permission denied` ao acessar `/var/run/docker.sock`, execute o primeiro comando no seu terminal com `sudo docker compose up -d --wait db`. O terminal solicitará sua senha de sistema. Depois, execute os comandos npm normalmente, sem sudo. Não é necessário apagar containers ou volumes para resolver esse erro.

Se o banco estiver em outro servidor, confirme o endereço, porta e disponibilidade em `DATABASE_URL`. O servidor e o sincronizador agora exibem instruções de recuperação para falhas de conexão, credenciais ou schema, sem imprimir a URL com a senha. O container local usa reinício automático após a inicialização do Docker.

## Administrador e sincronização

Crie uma conta pela interface, depois conceda acesso no terminal do servidor:

```bash
npm run admin -- seu-email@example.com
```

Acesse `/admin` para importar cartas, atualizar preços e acompanhar o status das tarefas. A autorização consulta a função atual do usuário no banco. Os endpoints administrativos não permitem trabalhos simultâneos no mesmo processo.

Para sincronizar cartas e preços diariamente, configure `SYNC_ENABLED=true` e `SYNC_HOUR_UTC=11` em `server/.env`. Isso executa às 08:00 de Brasília enquanto o servidor estiver ativo. Também é possível executar `npm run sync` por um agendador externo. Use somente um agendador; em múltiplas réplicas, desative o agendador interno e execute o CLI em um único worker. O agendador interno não recupera execuções perdidas enquanto o servidor esteve desligado.

Cada carta tem no máximo um registro por dia UTC. Repetir a importação no mesmo dia preserva esse registro e atualiza o preço atual do catálogo. As maiores variações comparam os dois últimos dias disponíveis; são necessários dois registros. Os valores exibidos representam USD **nonfoil** do Scryfall; o filtro foil indica disponibilidade da carta nesse acabamento, não um histórico separado de preços foil.

## Radar de preços e oportunidades

Depois de entrar, `/insights` é a página inicial. Selecione 30, 90 ou 180 dias e filtre os sinais:

- **Perto da mínima:** preço até 5% acima da menor observação do período e ao menos 5% abaixo da média.
- **Lista de compras:** ao menos 15% abaixo da média e última variação diária entre −5% e +10%.
- **Altas e quedas repentinas:** variação de pelo menos 20% entre registros de dias consecutivos.

O radar exige ao menos sete observações abrangendo sete dias, último preço de até três dias atrás e valor de pelo menos US$ 1. Não inventa histórico: novas instalações precisam acumular registros diários. Cada sinal mostra mínima, desconto sobre a média, número de observações e histórico recente. São exibidas até 500 edições candidatas ordenadas pelo desconto; as contagens de sinais se referem a esse conjunto. Cartas acompanhadas inclui todas com preços no período.

A lista é uma ferramenta de pesquisa, sem previsão de retorno. Não mede liquidez, volume de vendas, taxas, demanda brasileira ou risco de reimpressão. USD não é convertido em BRL. A API `/market/insights?days=90` calcula os agregados no PostgreSQL.

## Estoque da loja e LigaMagic

Aplique as migrations e gere o cliente Prisma antes de usar o novo estoque:

```bash
npm run db:migrate --prefix server
npm run db:generate --prefix server
```

`/inventory` é restrito a administradores, com autorização verificada no backend. **Uma instalação representa uma loja**, com estoque compartilhado entre seus administradores; não há isolamento de múltiplas lojas na mesma base.

- Cada SKU identifica uma edição, condição (`NM`, `LP`, `MP`, `HP`, `DMG`), idioma e acabamento (`nonfoil`, `foil`, `etched`). O vínculo por Scryfall ID é opcional; itens sem correspondência no catálogo podem ser cadastrados.
- Cadastro com saldo inicial, custo e preço em BRL, estoque mínimo e localização. Valores do painel representam quantidade física × custo/preço unitário atual; não são apuração contábil ou de lucro realizado.
- Entradas, vendas, ajustes com sinal, reservas e liberações, sempre com motivo e registro de autor e saldo final. Disponível = físico − reservado. Libere uma reserva antes de registrar a venda correspondente.
- Saldos negativos e vendas acima do disponível são bloqueados. Edições simultâneas usam versão otimista; importações também usam transação serializável. Em caso de conflito, recarregue os dados e revise novamente.

### Importar um relatório

A integração disponível é **por arquivo CSV com mapeamento**, sem sincronização automática ou envio de alterações à LigaMagic. Não há endpoints ou credenciais LigaMagic presumidos. Para adaptar o formato exato do seu relatório ou implementar acesso direto, ainda são necessários um exemplo do arquivo da loja ou documentação oficial da API e acesso autorizado.

1. Em **Importar CSV**, selecione um arquivo UTF-8 com `;` ou `,` (até 500 linhas e 1 MB). Há um modelo para baixar na própria tela.
2. Mapeie obrigatoriamente SKU, nome e quantidade. Cabeçalhos comuns em português e inglês são sugeridos automaticamente. Mapeie também os demais campos quando existirem. Valores de condição, idioma e acabamento devem usar os códigos indicados na tela.
3. Confira a prévia de saldos, custos e preços. Erros bloqueiam a importação inteira. Um SKU existente não pode mudar de variante; use outro SKU.
4. Aplique o saldo. A quantidade importada **substitui** a quantidade física dos SKUs do arquivo; não soma unidades. SKUs ausentes permanecem iguais. Colunas opcionais sem mapeamento preservam valores de itens existentes. Para novos itens, padrões: `NM`, `EN`, `nonfoil`, custo/preço zero e mínimo 2.

Reimportar o mesmo conteúdo normalizado com os mesmos campos mapeados não altera os saldos, mesmo após vendas posteriores. Mudanças após a prévia exigem uma nova revisão. Cada linha aplicada gera um movimento `IMPORT`. Arquivos com saldo abaixo da quantidade reservada são rejeitados. A exportação CSV usa o formato Arcana, em BRL, e protege células que poderiam executar fórmulas ao abrir em planilhas; não é um formato de upload LigaMagic certificado.

Rotas administrativas: `GET/POST /inventory`, `PATCH /inventory/:id`, `POST /inventory/:id/movements`, `GET /inventory/movements`, `GET /inventory/export`, `POST /inventory/import/columns`, `POST /inventory/import/preview` e `POST /inventory/import/commit`.

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

Sem `TEST_DATABASE_URL`, apenas os testes unitários executam. A integração cria e remove seus próprios registros. Ela cobre autenticação, validação, perfil, autorização, filtros, favoritos isolados por conta, imagens de cartas dupla face, idempotência dos preços diários, variações de mercado, agregação dos sinais, movimentos de estoque, reservas, concorrência, rollback e idempotência de importações. As respostas bulk externas são simuladas nesses testes; não há download do catálogo real.

Testes de navegador com API simulada, em desktop e mobile:

```bash
cd tcg-project
npx playwright install chromium
npm run test:e2e
```

Os testes de navegador também cobrem o radar, filtros, idioma, cadastro de SKU, venda e prévia/importação CSV, usando uma API simulada.

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
