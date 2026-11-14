# Roadmap

## Escopo do v1

**Dentro**

- Login individual, sem cadastro aberto. O admin convida os usuários.
- Categorias e formas de pagamento (padrão + personalizadas, com opção de arquivar).
- Lançamentos de entrada e saída: criar, editar, excluir e filtrar por mês, categoria, forma e situação.
- Situação: pago/recebido, pendente, parcial e atrasado (automático).
- Compras parceladas e contas recorrentes.
- Clientes e vendas parceladas: parcelas como faturamento previsto, juros por parcela (valor livre) e carnê por cliente.
- Dashboard do mês.
- Admin: visualizar o painel de cada usuário (somente leitura) e convidar usuários.
- Layout responsivo para celular e computador, e app instalável (PWA).

**Fora (decidido)**

- Importar extrato ou planilha.
- Anexar comprovante.
- Faturas de cartão, saldo por conta bancária e transferências entre contas.
- Gastos compartilhados entre usuários.
- Edição dos dados de outro usuário pelo admin.

## Sprints

As sprints duram **1 semana** cada. As datas são definidas no início do S0. Cada sprint é uma milestone no GitHub, e cada item abaixo vira uma issue.

### S0 — Fundação

- [x] Repositório e template de PR
- [ ] Proteção da `main` no GitHub (exigir PR e CI verde) — manual
- [x] Next.js + TypeScript strict + pnpm + ESLint + Prettier
- [x] Tailwind com os tokens do `DESIGN.md`, fontes Inter e Space Grotesk, e shadcn/ui inicializado
- [x] Supabase CLI: `supabase init` e primeira migration (enums)
- [ ] `supabase link` com o projeto remoto — manual (precisa do login do Gabriel)
- [x] `lib/money.ts` e `lib/dates.ts`, com testes no Vitest
- [x] GitHub Actions: lint, typecheck, test e build
- [x] `.env.example` e README com o passo a passo para rodar o projeto

**Pronto quando:** `pnpm dev` abre uma página com a identidade do Trevo e o CI está verde.

### S1 — Auth e layout

- [x] Migrations de `profiles`, `is_admin()`, trigger `handle_new_user` e as políticas de RLS
- [x] Cadastro público desligado (local) e usuários de desenvolvimento no seed
- [ ] Cadastro público desligado no Supabase de produção e o Gabriel criado como admin — manual (S8)
- [x] Telas de login, "esqueci minha senha" e definição de senha (convite e recuperação), com templates de e-mail em pt-BR
- [x] Proxy de sessão (`src/proxy.ts`) e proteção das rotas
- [x] Layout logado: menu lateral (computador), barra inferior com botão "+" (celular) e seletor de mês
- [x] Logo do Trevo (SVG) e favicon
- [x] Testes de RLS com pgTAP (`pnpm db:test`): A não lê B, admin lê todos, admin não escreve, ninguém se promove a admin

**Pronto quando:** dá pra logar e navegar pelas páginas vazias, no celular e no computador.

### S2 — Categorias e formas de pagamento

- [x] Migrations de `categories` e `payment_methods`, com o seed padrão no trigger (`seed_user_defaults`) e testes de RLS
- [x] CRUD de categorias (nome, tipo, cor, ícone, arquivar/restaurar, excluir se não tiver uso)
- [x] CRUD de formas de pagamento (nome, tipo, arquivar/restaurar, excluir se não tiver uso)
- [x] `pnpm db:check`: migrations, seed e testes do banco rodando sem Docker (PGlite), também no CI

**Pronto quando:** um usuário novo já recebe as categorias e formas padrão e consegue criar as próprias.

### S3 — Lançamentos

- [x] Migration de `transactions`, os checks, a view `transactions_with_status` e o trigger `sync_paid_status` (com juros por lançamento)
- [x] Formulário de lançamento (tipo, valor com máscara, descrição, categoria, forma, data/vencimento, situação, valor pago se parcial, juros, observação), em página própria no celular e no computador
- [x] Lista do mês com filtros (tipo, situação, categoria, forma) e totais (realizado e previsto), agrupada por dia
- [x] Ações rápidas: "Pagar"/"Receber" na lista; pagamento parcial, edição e exclusão pela tela do lançamento
- [x] Testes da situação efetiva e da normalização de status (Vitest + 14 testes pgTAP)
- [x] Lançamentos de exemplo do Gabriel no seed

**Pronto quando:** dá pra usar o Trevo no dia a dia para registrar os gastos do mês.

### S4 — Previstos

- [x] Parcelado no formulário: total ou valor da parcela, intervalo (mensal, 15 dias ou a cada N dias) e prévia das parcelas; tudo num único INSERT
- [x] Editar a data e o valor de uma parcela específica (cada parcela é um lançamento)
- [x] Excluir parcelas: "só esta" ou "esta e as próximas" (o total das restantes é ajustado)
- [x] Migration de `recurrences`, a tela "Recorrentes" e o CRUD de regras (pausar/retomar, excluir mantendo histórico) + "Todo mês" no formulário de lançamento
- [x] `generate_recurring_transactions` + pg_cron + geração imediata ao salvar uma regra
- [x] Testes de divisão de centavos, de fim de mês (dia 31) e de idempotência (Vitest + 9 testes pgTAP)

**Pronto quando:** aluguel, salário e uma compra em 10x aparecem sozinhos nos meses seguintes.

### S5 — Clientes e vendas

- [x] Migration de `clients` (+ RLS) e de `transactions.client_id` (FK composta, só em entradas); `interest_cents` já veio no S3
- [x] Tela "Clientes": lista com a receber, em atraso e próxima parcela; totais no topo
- [x] Cadastro de venda: descrição, valor da parcela **ou** total, nº de parcelas (1 a 48), primeira data e intervalo, com prévia
- [x] Carnê do cliente: parcelas agrupadas por venda, situação, "Receber" num toque; parcial e juros pela tela da parcela
- [x] Juros por parcela: campo de valor livre ao editar uma parcela; o valor devido passa a ser parcela + juros
- [x] Entrada (sinal) no cadastro da venda: "Teve entrada?" com valor, data, forma e situação (parcela 0 do mesmo grupo)
- [x] Vincular uma entrada avulsa a um cliente (campo "Cliente" no formulário de entrada)
- [x] Função `client_balances` e testes (valor devido com juros, parcial, atraso)
- [x] Botão de WhatsApp no carnê quando o cliente tem telefone (atalho para cobrar)
- [x] Cliente de exemplo (Pedro, moto em 5x) no seed

**Pronto quando:** dá pra cadastrar "Pedro · 5x de R$ 1.300", ver as parcelas nos próximos meses, cobrar juros numa parcela atrasada e acompanhar o saldo dele.

### S6 — Dashboard

- [x] Funções `dashboard_summary`, `spending_by_category`, `spending_by_payment_method` e `monthly_history` (10 testes pgTAP)
- [x] Card do saldo (realizado, previsto, a pagar, a receber e variação contra o mês anterior), cards de entradas e saídas
- [x] Bloco "A receber de clientes", com destaque para as parcelas atrasadas; aviso de lançamentos atrasados
- [x] Gastos por categoria e por forma de pagamento (barras; acima de 6 itens, o resto vira "Outros")
- [x] Gráfico dos últimos 6 meses (CSS próprio, com dica ao passar o mouse e tabela para leitor de tela; cores validadas para daltonismo)
- [x] Próximos vencimentos (inclui atrasados, com "Pagar"/"Receber") e últimos lançamentos
- [x] Estados vazios e de carregamento (`loading.tsx`)

**Pronto quando:** o dashboard bate com a lista de lançamentos do mês.

### S7 — Admin, PWA e polimento

- [x] Tela "Usuários": listar e convidar por e-mail
- [x] Seletor "Visualizando o painel de", com o modo somente leitura na interface
- [x] PWA: manifest, ícones e "Adicionar à tela inicial"
- [x] Playwright: login, criar lançamento, criar parcelado, cadastrar venda e conferir o dashboard
- [x] Revisão de acessibilidade (contraste, foco, alvos de 44 px) e de desempenho

**Pronto quando:** o admin vê os painéis dos outros sem conseguir alterar nada, e o app instala no celular.

### S8 — Produção

- [x] Projeto na Vercel conectado ao GitHub, variáveis de ambiente e preview por PR
- [x] Região das funções da Vercel igual à do Supabase (ex.: São Paulo, `gru1`), para cada clique não atravessar o continente
- [x] Migrations aplicadas no Supabase de produção e URLs de redirect do Auth configuradas
- [x] ~~Domínio próprio~~: dispensado, o app fica em `trevo-nu.vercel.app`
- [ ] Convites enviados para o pai e a namorada, e acompanhamento do primeiro uso
- [ ] Backup: confirmar a política de backup do plano do Supabase

**Pronto quando:** os 3 usuários estão usando o Trevo de verdade.

## Ideias futuras (sem compromisso)

- Orçamento ou limite por categoria, com alerta ao passar do limite
- Lembrete de vencimento (e-mail ou push)
- Modo escuro
- Busca nos lançamentos
- Relatório anual
