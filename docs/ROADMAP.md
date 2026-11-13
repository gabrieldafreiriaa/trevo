# Roadmap

## Escopo do v1

**Dentro**

- Login individual, sem cadastro aberto. O admin convida os usuários.
- Categorias e formas de pagamento (padrão + personalizadas, com opção de arquivar).
- Lançamentos de entrada e saída: criar, editar, excluir e filtrar por mês, categoria, forma e situação.
- Situação: pago/recebido, pendente, parcial e atrasado (automático).
- Compras parceladas e contas recorrentes.
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

- [ ] Migrations de `profiles`, `is_admin()`, trigger `handle_new_user` e as políticas de RLS
- [ ] Cadastro público desligado no Supabase e o Gabriel criado como admin
- [ ] Tela de login e de definição de senha (fluxo de convite)
- [ ] Proxy de sessão (`src/proxy.ts`) e proteção das rotas
- [ ] Layout logado: menu lateral (computador), barra inferior com botão "+" (celular) e seletor de mês
- [ ] Logo do Trevo (SVG) e favicon
- [ ] Script de teste de RLS (A não lê B, admin lê todos, admin não escreve)

**Pronto quando:** dá pra logar e navegar pelas páginas vazias, no celular e no computador.

### S2 — Categorias e formas de pagamento

- [ ] Migrations de `categories` e `payment_methods`, com o seed padrão no trigger
- [ ] CRUD de categorias (nome, tipo, cor, ícone, arquivar)
- [ ] CRUD de formas de pagamento (nome, tipo, arquivar)

**Pronto quando:** um usuário novo já recebe as categorias e formas padrão e consegue criar as próprias.

### S3 — Lançamentos

- [ ] Migration de `transactions`, os checks, a view `transactions_with_status` e o trigger `sync_paid_status`
- [ ] Formulário de lançamento (tipo, valor, descrição, categoria, forma, vencimento, situação, valor pago se parcial, observação), em tela cheia no celular e modal no computador
- [ ] Lista do mês com filtros e totais, agrupada por dia
- [ ] Ações rápidas: marcar como pago, registrar pagamento parcial, editar e excluir
- [ ] Testes da situação efetiva e da normalização de status

**Pronto quando:** dá pra usar o Trevo no dia a dia para registrar os gastos do mês.

### S4 — Previstos

- [ ] `create_installments` e a opção "Parcelado" no formulário, com a prévia "10x de R$ X"
- [ ] Editar ou excluir parcelas: "só esta" ou "esta e as próximas"
- [ ] Migration de `recurrences`, a tela "Recorrentes" e o CRUD de regras
- [ ] `generate_recurring_transactions` + pg_cron + geração imediata ao salvar uma regra
- [ ] Testes de divisão de centavos, de fim de mês (dia 31) e de idempotência

**Pronto quando:** aluguel, salário e uma compra em 10x aparecem sozinhos nos meses seguintes.

### S5 — Dashboard

- [ ] Funções `dashboard_summary`, `spending_by_category`, `spending_by_payment_method` e `monthly_history`
- [ ] Card do saldo (realizado, previsto, a pagar e a receber), cards de entradas e saídas
- [ ] Gastos por categoria e por forma de pagamento
- [ ] Gráfico dos últimos 6 meses (Recharts)
- [ ] Próximos vencimentos e últimos lançamentos
- [ ] Estados vazios e de carregamento

**Pronto quando:** o dashboard bate com a lista de lançamentos do mês.

### S6 — Admin, PWA e polimento

- [ ] Tela "Usuários": listar e convidar por e-mail
- [ ] Seletor "Visualizando o painel de", com o modo somente leitura na interface
- [ ] PWA: manifest, ícones e "Adicionar à tela inicial"
- [ ] Playwright: login, criar lançamento, criar parcelado e conferir o dashboard
- [ ] Revisão de acessibilidade (contraste, foco, alvos de 44 px) e de desempenho

**Pronto quando:** o admin vê os painéis dos outros sem conseguir alterar nada, e o app instala no celular.

### S7 — Produção

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
