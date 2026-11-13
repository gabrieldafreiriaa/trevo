# 🍀 Trevo

Controle financeiro pessoal para uso em família. Cada pessoa tem o próprio login e a própria tela. Os lançamentos são feitos à mão, e o dashboard mostra para onde o dinheiro foi e quanto ainda vai sobrar no mês.

> **Status:** S0, S1 e S2 concluídos · S3 (lançamentos) a seguir.

## O que o Trevo faz (v1)

- **Login individual** para 3 usuários. Não há cadastro aberto: o admin convida quem pode entrar.
- **Lançamentos de entrada e saída**, cada um com **categoria** e **forma de pagamento** (cartão de crédito, débito, Pix, dinheiro, boleto ou formas personalizadas).
- **Situação de cada lançamento:** pago/recebido, pendente ou parcial (com o valor já pago). Um lançamento vira **atrasado** sozinho quando passa do vencimento.
- **Previstos:** contas recorrentes (todo mês) e compras parceladas (gera as parcelas futuras).
- **Clientes e vendas:** venda parcelada para um cliente (mensal, quinzenal ou a cada N dias), com as parcelas no faturamento previsto, juros combinados por parcela e o carnê de cada cliente.
- **Dashboard do mês:** saldo realizado e previsto, entradas e saídas, gastos por categoria e por forma de pagamento, últimos 6 meses, próximos vencimentos e últimos lançamentos.
- **Admin:** visualiza o painel de cada usuário em modo somente leitura e gerencia os convites.
- **Funciona no celular e no computador**, e pode ser instalado como app (PWA).

## Stack

| Camada           | Tecnologia                                                        |
| ---------------- | ----------------------------------------------------------------- |
| App              | Next.js (App Router) + TypeScript (strict), rodando em Node       |
| UI               | Tailwind CSS + shadcn/ui (Radix) · Recharts · Lucide              |
| Formulários      | React Hook Form + Zod                                             |
| Datas e dinheiro | date-fns (pt-BR) · valores sempre em centavos (inteiro)           |
| Banco e auth     | Supabase: Postgres, Auth, RLS, pg_cron                            |
| Testes           | Vitest (domínio) · Playwright (fluxos principais, a partir do S6) |
| CI/CD            | GitHub Actions · Vercel                                           |
| Pacotes          | pnpm                                                              |

## Documentação

| Documento                                      | Conteúdo                                                   |
| ---------------------------------------------- | ---------------------------------------------------------- |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Arquitetura, decisões técnicas e convenções                |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md)     | Tabelas, regras de negócio e políticas de RLS              |
| [`docs/ROADMAP.md`](docs/ROADMAP.md)           | Escopo, sprints e backlog                                  |
| [`docs/DESIGN.md`](docs/DESIGN.md)             | Identidade visual, tokens e telas                          |
| [`CLAUDE.md`](CLAUDE.md)                       | Regras do projeto para quem programa com assistentes de IA |

## Rodando localmente

**Pré-requisitos:** Node LTS, pnpm, Docker (para o Supabase local) e Supabase CLI.

```bash
pnpm install
pnpm db:start                   # sobe Postgres, Auth e o Mailpit (Docker)
cp .env.example .env.local      # cole a "Publishable key"/"anon key" que o db:start mostrou
pnpm db:reset                   # aplica as migrations e cria os usuários de teste
pnpm dev                        # http://localhost:3000
```

**Usuários de teste** (senha `trevo123`): `gabriel@trevo.local` (admin), `pai@trevo.local` e `namorada@trevo.local`.

**E-mails locais** (convite e "esqueci minha senha") não saem de verdade: abra o Mailpit em http://127.0.0.1:54324.

### Scripts

| Comando          | O que faz                                                    |
| ---------------- | ------------------------------------------------------------ |
| `pnpm dev`       | Servidor de desenvolvimento                                  |
| `pnpm build`     | Build de produção                                            |
| `pnpm lint`      | ESLint                                                       |
| `pnpm typecheck` | `tsc --noEmit`                                               |
| `pnpm test`      | Vitest                                                       |
| `pnpm test:e2e`  | Playwright (a partir do S6)                                  |
| `pnpm db:test`   | Testes do banco (RLS) com pgTAP, no Supabase local           |
| `pnpm db:check`  | Migrations + seed + testes do banco **sem Docker** (PGlite)  |
| `pnpm db:types`  | Gera `src/lib/supabase/database.types.ts` a partir do schema |

### Variáveis de ambiente

| Variável                        | Onde é usada                                  | Observação                                                   |
| ------------------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Cliente e servidor                            | Pública                                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente e servidor                            | Pública, protegida pelo RLS                                  |
| `SUPABASE_SERVICE_ROLE_KEY`     | **Somente no servidor** (convite de usuários) | **Secreta.** Nunca vai para o cliente nem para o repositório |

## Fluxo de trabalho

- A `main` é protegida e só recebe merge via PR com o CI verde.
- Uma branch por história: `feat/…`, `fix/…`, `chore/…`, `docs/…`.
- Os commits seguem os [Conventional Commits](https://www.conventionalcommits.org/pt-br/).
- As tarefas ficam em GitHub Issues + Projects, com uma milestone por sprint.
