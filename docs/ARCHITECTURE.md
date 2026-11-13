# Arquitetura

## Visão geral

O Trevo é **um único projeto Next.js** (App Router) que roda em Node e conversa com o **Supabase** (Postgres + Auth). Não existe um back-end separado: as leituras acontecem nos **Server Components** e as escritas nas **Server Actions**. A segurança dos dados fica no banco, com **Row Level Security (RLS)** em todas as tabelas.

```
Navegador (celular/computador, PWA)
        │
        ▼
Next.js na Vercel (Node)
  ├─ Server Components ── leitura ──┐
  ├─ Server Actions ───── escrita ─┤──► Supabase
  └─ Proxy ────────────── sessão ──┘     ├─ Auth (e-mail/senha, só por convite)
                                         ├─ Postgres + RLS
                                         └─ pg_cron (gera os recorrentes)
```

## Decisões técnicas

| #   | Decisão                                               | Motivo                                                                                                                            |
| --- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Next.js full-stack, sem API separada                  | Um projeto, um deploy, e tipagem do banco até a tela                                                                              |
| D2  | `supabase-js` + tipos gerados, **sem ORM**            | Drizzle e Prisma conectam direto no Postgres e **ignoram o RLS**. Com o supabase-js, toda consulta passa pelas políticas do banco |
| D3  | RLS em 100% das tabelas                               | O isolamento entre usuários não pode depender do front-end                                                                        |
| D4  | Dinheiro como `bigint` em **centavos**                | Evita erros de arredondamento de float. A formatação acontece só na borda (`Intl.NumberFormat('pt-BR')`)                          |
| D5  | **"Atrasado" é calculado**, não gravado               | Pendente ou parcial com vencimento antes de hoje é atrasado. Não precisa de job nem fica dessincronizado                          |
| D6  | Parcelas são **materializadas** na criação            | Cada parcela é um lançamento normal: dá pra editar, marcar como paga e ver no mês certo                                           |
| D7  | Recorrência via `pg_cron`, com janela de 3 meses      | Os previstos aparecem no dashboard sem o usuário fazer nada. A geração é idempotente                                              |
| D8  | Cadastro público **desligado**                        | Só o admin convida usuários, pela API admin do Supabase (service role usada só no servidor)                                       |
| D9  | Admin tem **leitura** dos dados de todos, sem escrita | Requisito do produto. Garantido pelo RLS, não pela interface                                                                      |
| D10 | Fuso fixo `America/Sao_Paulo`                         | "Hoje", "mês atual" e "atrasado" são sempre calculados nesse fuso, no banco e no app                                              |
| D11 | Forma de pagamento é só um **rótulo** do lançamento   | Não há faturas, saldo por conta nem transferências. O usuário lança cada gasto do cartão com categoria e forma                    |

## Estrutura de pastas

```
.
├─ CLAUDE.md
├─ README.md
├─ docs/
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/            # SQL versionado (schema, RLS, funções, cron)
│  └─ seed.sql               # dados de desenvolvimento
├─ src/
│  ├─ app/
│  │  ├─ (auth)/login/       # login e definição de senha do convite
│  │  ├─ (app)/              # área logada, com layout (menu lateral ou barra inferior)
│  │  │  ├─ page.tsx                 # dashboard
│  │  │  ├─ lancamentos/
│  │  │  ├─ recorrentes/
│  │  │  ├─ categorias/
│  │  │  ├─ formas-de-pagamento/
│  │  │  └─ admin/usuarios/
│  │  ├─ manifest.ts         # PWA
│  │  └─ layout.tsx
│  ├─ features/              # um módulo por domínio
│  │  ├─ transactions/       # actions.ts · queries.ts · schemas.ts · components/
│  │  ├─ recurrences/
│  │  ├─ categories/
│  │  ├─ payment-methods/
│  │  ├─ dashboard/
│  │  └─ admin/
│  ├─ components/
│  │  ├─ ui/                 # shadcn/ui (gerado, customizado pelos tokens)
│  │  └─ layout/             # sidebar, bottom nav, header do mês
│  ├─ lib/
│  │  ├─ supabase/           # server.ts · client.ts · proxy.ts · database.types.ts
│  │  ├─ money.ts            # centavos ↔ reais, formatação, divisão de parcelas
│  │  └─ dates.ts            # fuso, mês de referência, intervalos
│  └─ proxy.ts               # renova a sessão e protege as rotas (no Next 16, o antigo middleware.ts)
└─ tests/
   ├─ unit/                  # Vitest (também pode ficar ao lado do código: *.test.ts)
   └─ e2e/                   # Playwright
```

**Regra dos módulos:** cada pasta em `features/` concentra o domínio dela.

- `schemas.ts` (Zod) é a fonte única de validação, usada pelo formulário e pela action.
- `queries.ts` só lê dados, e é chamado pelos Server Components.
- `actions.ts` só escreve. Toda action valida com Zod, confere a sessão, chama o Supabase e faz `revalidatePath`.

## Autenticação e autorização

1. **Login** por e-mail e senha com `@supabase/ssr`, com a sessão em cookies.
2. O **proxy** (`src/proxy.ts`, nome novo do middleware no Next 16) renova a sessão e redireciona para `/login` qualquer acesso a `(app)` sem sessão.
3. **Convite:** em `admin/usuarios`, uma action confere se quem chama tem `profiles.role = 'admin'` e chama `auth.admin.inviteUserByEmail` com a **service role** (cliente criado só no servidor). Um trigger em `auth.users` cria o `profile` e semeia as categorias e formas de pagamento padrão.
4. **Visão do admin:** o seletor "Visualizando o painel de" define o `userId` exibido (parâmetro de URL `?u=<id>`). As queries filtram por esse id. O RLS permite que o admin leia e bloqueia qualquer escrita em dados alheios. Nesse modo, a interface mostra um aviso de "somente leitura" e esconde as ações de editar.

## Fluxos de domínio

### Situação de um lançamento

- Guardada: `paid`, `pending` ou `partial`.
- Exibida: igual à guardada, exceto que **`overdue`** quando a guardada é `pending` ou `partial` e `due_date < hoje (America/Sao_Paulo)`.
- Calculada na view `transactions_with_status` (ver `DATA_MODEL.md`) e espelhada em `lib/` para a interface otimista.

### Parcelamento

- Entrada: valor total, número de parcelas (2 a 48), data da primeira parcela, categoria e forma de pagamento.
- A função SQL `create_installments(...)` cria as N linhas numa **única transação**, com o mesmo `installment_group_id`.
- **Arredondamento:** cada parcela recebe `floor(total / n)` e o resto em centavos vai para a **primeira** parcela. A soma sempre bate com o total.
- Vencimentos mensais. Se o dia não existe no mês (31 em fevereiro, por exemplo), usa o último dia do mês.
- Editar ou excluir oferece duas opções: "só esta parcela" ou "esta e as próximas".

### Recorrência

- Uma `recurrence` é a regra: valor, dia, início, fim opcional, categoria e forma.
- `generate_recurring_transactions()` cria os lançamentos que faltam até **hoje + 3 meses**. É idempotente graças a um índice único em `(recurrence_id, due_date)`.
- É disparada pelo `pg_cron` todo dia às 03:00 (horário de Brasília) e também logo que uma regra é criada ou editada.
- Editar a regra altera só os lançamentos **futuros e pendentes**. Os pagos nunca são reescritos.

### Dashboard (mês de referência)

- **Realizado:** soma do que já foi pago no mês (`paid`, mais `paid_cents` dos `partial`).
- **Previsto:** realizado mais o que ainda falta pagar ou receber dos lançamentos com vencimento no mês.
- Os agregados (por categoria, por forma, últimos 6 meses) vêm de funções SQL (`rpc`), em vez de serem calculados no cliente.

## Convenções

- **Idioma:** código, tabelas e colunas em inglês. Interface, textos e documentação em português (pt-BR).
- **TypeScript strict**, sem `any`. Os tipos do banco vêm sempre de `database.types.ts`, gerado por `pnpm db:types`.
- **Server-first:** `"use client"` só onde há interação (formulários, gráficos, seletores).
- **Validação:** toda entrada externa passa por Zod no servidor, mesmo que o cliente já tenha validado.
- **Mudanças no banco** só por migration (`supabase migration new <nome>`), nunca editando pelo painel em produção.
- **Commits:** Conventional Commits. **Branches:** `feat/`, `fix/`, `chore/`, `docs/`.

## Qualidade

- **CI (GitHub Actions) em todo PR:** `lint`, `typecheck`, `test` e `build`.
- **Vitest** desde o S0 para `lib/money`, `lib/dates`, a divisão de parcelas, a situação efetiva e os agregados do dashboard.
- **Testes de RLS:** um script SQL que confirma que o usuário A não lê o B, que o admin lê todos e que o admin não escreve nos dados de outro.
- **Playwright (S6):** login, criar lançamento, criar parcelado e conferir o dashboard.
- **Acessibilidade:** contraste AA, alvos de toque de 44 px ou mais, navegação por teclado (o Radix já cobre a maior parte).

## Ambientes

| Ambiente | Banco                                                           | App                                   |
| -------- | --------------------------------------------------------------- | ------------------------------------- |
| Local    | Supabase local (Docker)                                         | `pnpm dev`                            |
| Preview  | Projeto Supabase de produção ou um de staging (a decidir no S7) | Vercel Preview, um por PR             |
| Produção | Projeto Supabase do Gabriel                                     | Vercel Production, a partir da `main` |
