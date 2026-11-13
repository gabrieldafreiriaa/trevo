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

- [ ] `create_installments` com intervalo (mensal, a cada 15 dias ou a cada N dias) e a opção "Parcelado" no formulário, com a prévia "10x de R$ X"
- [ ] Editar a data e o valor de uma parcela específica
- [ ] Editar ou excluir parcelas: "só esta" ou "esta e as próximas"
- [ ] Migration de `recurrences`, a tela "Recorrentes" e o CRUD de regras
- [ ] `generate_recurring_transactions` + pg_cron + geração imediata ao salvar uma regra
- [ ] Testes de divisão de centavos, de fim de mês (dia 31) e de idempotência

**Pronto quando:** aluguel, salário e uma compra em 10x aparecem sozinhos nos meses seguintes.

### S5 — Clientes e vendas

- [ ] Migration de `clients` (+ RLS) e de `transactions.client_id` e `interest_cents`, com os checks
- [ ] Tela "Clientes": lista com total vendido, recebido, a receber e em atraso
- [ ] Cadastro de venda: cliente, descrição (ex.: "Moto CG 160"), valor da parcela **ou** total, nº de parcelas (1 a 48), primeira data e intervalo
- [ ] Carnê do cliente: todas as parcelas com situação, ações de receber (total ou parcial) e editar
- [ ] Juros por parcela: campo de valor livre ao editar uma parcela; o valor devido passa a ser parcela + juros
- [ ] Vincular uma entrada comum (sinal) a um cliente
- [ ] Função `client_balances` e testes (valor devido com juros, parcial, atraso)

**Pronto quando:** dá pra cadastrar "Pedro · 5x de R$ 1.300", ver as parcelas nos próximos meses, cobrar juros numa parcela atrasada e acompanhar o saldo dele.

### S6 — Dashboard

- [ ] Funções `dashboard_summary`, `spending_by_category`, `spending_by_payment_method` e `monthly_history`
- [ ] Card do saldo (realizado, previsto, a pagar e a receber), cards de entradas e saídas
- [ ] Bloco "A receber de clientes", com destaque para as parcelas atrasadas
- [ ] Gastos por categoria e por forma de pagamento
- [ ] Gráfico dos últimos 6 meses (Recharts)
- [ ] Próximos vencimentos e últimos lançamentos
- [ ] Estados vazios e de carregamento

**Pronto quando:** o dashboard bate com a lista de lançamentos do mês.

### S7 — Admin, PWA e polimento

- [ ] Tela "Usuários": listar e convidar por e-mail
- [ ] Seletor "Visualizando o painel de", com o modo somente leitura na interface
- [ ] PWA: manifest, ícones e "Adicionar à tela inicial"
- [ ] Playwright: login, criar lançamento, criar parcelado, cadastrar venda e conferir o dashboard
- [ ] Revisão de acessibilidade (contraste, foco, alvos de 44 px) e de desempenho

**Pronto quando:** o admin vê os painéis dos outros sem conseguir alterar nada, e o app instala no celular.

### S8 — Produção

- [ ] Projeto na Vercel conectado ao GitHub, variáveis de ambiente e preview por PR
- [ ] Migrations aplicadas no Supabase de produção e URLs de redirect do Auth configuradas
- [ ] Domínio (opcional)
- [ ] Convites enviados para o pai e a namorada, e acompanhamento do primeiro uso
- [ ] Backup: confirmar a política de backup do plano do Supabase

**Pronto quando:** os 3 usuários estão usando o Trevo de verdade.

## Ideias futuras (sem compromisso)

- Orçamento ou limite por categoria, com alerta ao passar do limite
- Lembrete de vencimento (e-mail ou push)
- Modo escuro
- Busca nos lançamentos
- Relatório anual
