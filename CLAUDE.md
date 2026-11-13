# CLAUDE.md

Este arquivo dá contexto a assistentes de IA (e a pessoas) que vão programar no Trevo. Leia antes de qualquer mudança.

## O projeto

O Trevo é um controle financeiro pessoal para 3 usuários de uma família: Gabriel (admin), o pai e a namorada. Cada um tem login e dados próprios, e o admin pode **visualizar** os dados dos outros, sem editar. Os lançamentos são feitos à mão, com categoria e forma de pagamento.

Leia também o `AGENTS.md`, gerado pelo Next.js: esta versão (16) tem mudanças em relação ao que modelos de IA costumam conhecer. A documentação oficial da versão instalada fica em `node_modules/next/dist/docs/`. Exemplo: o `middleware.ts` agora se chama `proxy.ts`.

Documentação completa:

- `docs/ARCHITECTURE.md`: decisões técnicas, estrutura de pastas e convenções
- `docs/DATA_MODEL.md`: tabelas, regras de negócio e RLS
- `docs/ROADMAP.md`: escopo e sprints (veja qual é a sprint atual antes de começar)
- `docs/DESIGN.md`: tokens e telas

## Stack

Next.js (App Router) + TypeScript strict · Tailwind + shadcn/ui · Supabase (Postgres, Auth, RLS, pg_cron) via `@supabase/ssr` e `supabase-js` · React Hook Form + Zod · date-fns · Recharts · Vitest · Playwright · pnpm.

## Comandos

```bash
pnpm dev            # desenvolvimento
pnpm lint           # ESLint
pnpm typecheck      # tsc --noEmit
pnpm test           # Vitest
pnpm db:types       # regenera src/lib/supabase/database.types.ts
supabase migration new <nome>   # nova migration
supabase db reset               # recria o banco local com migrations + seed
```

Antes de considerar uma tarefa pronta: `pnpm lint && pnpm typecheck && pnpm test`.

## Regras que não podem ser quebradas

1. **Dinheiro é sempre `bigint` em centavos.** Nunca use float para valores. Converta só na borda, com `lib/money.ts`.
2. **Toda tabela tem RLS.** Nenhuma tabela nova sai sem as políticas. Não use a service role para contornar o RLS, exceto no convite de usuários (`features/admin`).
3. **A `SUPABASE_SERVICE_ROLE_KEY` nunca vai para o cliente.** Só pode ser usada em arquivos com `import 'server-only'`.
4. **Sem ORM.** Use `supabase-js` com os tipos gerados. Drizzle e Prisma ignoram o RLS.
5. **"Atrasado" não é gravado.** Use `effective_status` da view `transactions_with_status`.
6. **O fuso é `America/Sao_Paulo`.** Use as funções de `lib/dates.ts` para "hoje" e "mês atual", nunca `new Date()` solto.
7. **O schema só muda por migration.** Nunca altere o banco pelo painel.
8. **O admin não escreve nos dados de outros.** Isso é garantido pelo RLS, e a interface também esconde as ações.

## Convenções

- **Idioma:** código e banco em inglês. Interface e documentação em pt-BR.
- **Estrutura:** a lógica de cada domínio fica em `src/features/<domínio>/` (`schemas.ts`, `queries.ts`, `actions.ts`, `components/`).
- **Leitura** em Server Components (`queries.ts`). **Escrita** em Server Actions (`actions.ts`), que sempre validam com Zod, conferem a sessão e chamam `revalidatePath`.
- **`"use client"`** só em componentes com interação.
- **Estilo:** só os tokens do Tailwind definidos a partir de `docs/DESIGN.md`. Nada de hex solto em componentes.
- **Textos da interface:** pt-BR, frases curtas, sem "por favor" e sem exclamação. Valores formatados como `R$ 1.234,56`.
- **Testes:** toda regra de dinheiro, data ou situação ganha um teste no Vitest.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`).
- **Ao terminar** uma história do roadmap, marque o checkbox correspondente em `docs/ROADMAP.md`.
