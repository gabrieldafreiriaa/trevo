# Modelo de dados

Banco: **Postgres (Supabase)**. Todas as tabelas ficam no schema `public`, com **RLS ligado**. Valores em dinheiro usam `bigint` em **centavos**. Datas de vencimento e pagamento usam `date`, e as de auditoria `timestamptz`. O fuso de referência é `America/Sao_Paulo`.

## Diagrama

```
auth.users 1──1 profiles
                   │1
     ┌─────────────┼──────────────┬──────────────┬───────────────┐
     │N            │N             │N             │N              │N
 categories  payment_methods   clients      recurrences ──1:N── transactions
     │1            │1             │1            (regra)          (lançamento)
     └─────N───────┴──────N───────┴──────N─────────────────────────┘
```

## Tipos (enums)

| Enum                   | Valores                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `user_role`            | `admin`, `user`                                                         |
| `transaction_type`     | `income` (entrada), `expense` (saída)                                   |
| `transaction_status`   | `paid` (pago/recebido), `pending` (pendente), `partial` (parcial)       |
| `payment_kind`         | `credit_card`, `debit_card`, `pix`, `cash`, `boleto`, `other`           |
| `installment_interval` | `monthly` (mensal), `biweekly` (a cada 15 dias), `days` (a cada N dias) |

O status **`overdue` (atrasado) não é um valor gravado.** Ele é derivado na view `transactions_with_status` (ver abaixo).

## Tabelas

### `profiles`

| Coluna       | Tipo          | Regras                                |
| ------------ | ------------- | ------------------------------------- |
| `id`         | `uuid` PK     | FK `auth.users(id)` on delete cascade |
| `full_name`  | `text`        | not null                              |
| `role`       | `user_role`   | not null, default `'user'`            |
| `created_at` | `timestamptz` | default `now()`                       |

Criada pelo trigger `on_auth_user_created`, que também semeia as categorias e formas de pagamento padrão. Um usuário comum **não pode** alterar o próprio `role`.

### `categories`

| Coluna        | Tipo               | Regras                                                                          |
| ------------- | ------------------ | ------------------------------------------------------------------------------- |
| `id`          | `uuid` PK          | default `gen_random_uuid()`                                                     |
| `user_id`     | `uuid`             | FK `profiles(id)` on delete cascade, not null                                   |
| `type`        | `transaction_type` | not null. Categoria de entrada só vale para entradas, e de saída só para saídas |
| `name`        | `text`             | not null, 1 a 40 caracteres                                                     |
| `color`       | `text`             | hex `#RRGGBB`                                                                   |
| `icon`        | `text`             | nome do ícone Lucide                                                            |
| `archived_at` | `timestamptz`      | null = ativa. Arquivar é a forma de "excluir" sem perder o histórico            |
| `created_at`  | `timestamptz`      | default `now()`                                                                 |

Índices e chaves: `unique (user_id, type, lower(name))` e `unique (id, user_id, type)`. Esta última serve de alvo da FK composta de `transactions`.

### `payment_methods`

| Coluna        | Tipo           | Regras                                        |
| ------------- | -------------- | --------------------------------------------- |
| `id`          | `uuid` PK      |                                               |
| `user_id`     | `uuid`         | FK `profiles(id)` on delete cascade, not null |
| `kind`        | `payment_kind` | not null                                      |
| `name`        | `text`         | not null (ex.: "Pix", "Cartão Nubank")        |
| `archived_at` | `timestamptz`  | null = ativa                                  |
| `created_at`  | `timestamptz`  | default `now()`                               |

Índices e chaves: `unique (user_id, lower(name))` e `unique (id, user_id)`.

### `clients` (clientes de quem o usuário vende)

| Coluna                     | Tipo          | Regras                                        |
| -------------------------- | ------------- | --------------------------------------------- |
| `id`                       | `uuid` PK     |                                               |
| `user_id`                  | `uuid`        | FK `profiles(id)` on delete cascade, not null |
| `name`                     | `text`        | not null, 1 a 80 caracteres                   |
| `phone`                    | `text`        | opcional                                      |
| `notes`                    | `text`        | opcional                                      |
| `archived_at`              | `timestamptz` | null = ativo                                  |
| `created_at`, `updated_at` | `timestamptz` |                                               |

Índices e chaves: `(user_id, lower(name))` e `unique (id, user_id)`. Cada usuário tem os próprios clientes; o admin os vê pelo RLS de leitura.

### `recurrences` (regra de conta fixa)

| Coluna                     | Tipo               | Regras                                                                         |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------ |
| `id`                       | `uuid` PK          |                                                                                |
| `user_id`                  | `uuid`             | FK `profiles(id)`, not null                                                    |
| `type`                     | `transaction_type` | not null                                                                       |
| `description`              | `text`             | not null                                                                       |
| `amount_cents`             | `bigint`           | `> 0`                                                                          |
| `category_id`              | `uuid`             | FK composta `(category_id, user_id, type)` → `categories`                      |
| `payment_method_id`        | `uuid`             | null permitido. FK composta `(payment_method_id, user_id)` → `payment_methods` |
| `day_of_month`             | `smallint`         | 1 a 31. Se o dia não existir no mês, usa o último dia                          |
| `starts_on`                | `date`             | not null                                                                       |
| `ends_on`                  | `date`             | null = sem fim. Precisa ser `>= starts_on`                                     |
| `active`                   | `boolean`          | default `true`                                                                 |
| `created_at`, `updated_at` | `timestamptz`      |                                                                                |

### `transactions` (lançamento)

| Coluna                     | Tipo                 | Regras                                                                                                          |
| -------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `id`                       | `uuid` PK            |                                                                                                                 |
| `user_id`                  | `uuid`               | FK `profiles(id)`, not null                                                                                     |
| `type`                     | `transaction_type`   | not null                                                                                                        |
| `description`              | `text`               | not null, 1 a 80 caracteres                                                                                     |
| `amount_cents`             | `bigint`             | `> 0`. Valor **original** (da parcela, da conta, do gasto)                                                      |
| `interest_cents`           | `bigint`             | default 0, `>= 0`. **Juros/multa** combinados à parte, digitados pelo usuário. Nunca calculados automaticamente |
| `paid_cents`               | `bigint`             | default 0. Precisa ser `>= 0` e `<= amount_cents + interest_cents`                                              |
| `status`                   | `transaction_status` | not null, default `'pending'`                                                                                   |
| `due_date`                 | `date`               | not null. Vencimento, ou a data do gasto quando já foi pago na hora                                             |
| `paid_at`                  | `date`               | data em que foi quitado, ou o último pagamento parcial                                                          |
| `category_id`              | `uuid`               | not null. FK composta `(category_id, user_id, type)` → `categories`                                             |
| `payment_method_id`        | `uuid`               | FK composta `(payment_method_id, user_id)` → `payment_methods`. Obrigatório para saídas                         |
| `client_id`                | `uuid`               | opcional, **só para entradas**. FK composta `(client_id, user_id)` → `clients`                                  |
| `recurrence_id`            | `uuid`               | FK `recurrences(id)` on delete set null                                                                         |
| `installment_group_id`     | `uuid`               | mesmo valor para todas as parcelas de uma compra ou venda                                                       |
| `installment_number`       | `smallint`           | 1 a N                                                                                                           |
| `installment_total`        | `smallint`           | N, de 1 a 48 (1 = venda a prazo em uma vez, ex.: "paga em 10 dias")                                             |
| `notes`                    | `text`               | opcional                                                                                                        |
| `created_at`, `updated_at` | `timestamptz`        |                                                                                                                 |

**Valor devido** de um lançamento = `amount_cents + interest_cents`.

**Checks:**

- `status = 'paid'` ⇒ `paid_cents = amount_cents + interest_cents`
- `status = 'pending'` ⇒ `paid_cents = 0`
- `status = 'partial'` ⇒ `0 < paid_cents < amount_cents + interest_cents`
- Os três campos `installment_*` são todos nulos ou todos preenchidos, e `installment_number <= installment_total`
- `type = 'expense'` ⇒ `payment_method_id is not null`
- `client_id is not null` ⇒ `type = 'income'`

**Índices:**

- `(user_id, due_date)`, para as consultas por mês
- `(client_id, due_date)`, para o carnê do cliente
- `unique (recurrence_id, due_date)`, que torna a geração de recorrentes idempotente
- `(installment_group_id)`

As FKs compostas garantem no banco que a categoria, a forma de pagamento e o cliente **pertencem ao mesmo usuário** do lançamento, e que o tipo da categoria bate com o do lançamento.

## View

### `transactions_with_status` (`security_invoker = true`, respeita o RLS)

Todas as colunas de `transactions` e mais:

- `due_cents`: `amount_cents + interest_cents` (valor devido).
- `remaining_cents`: `due_cents - paid_cents`.
- `effective_status`: `'overdue'` quando `status in ('pending','partial')` e `due_date < (now() at time zone 'America/Sao_Paulo')::date`. Caso contrário, o próprio `status`.

## Regras de negócio

- **Mês de referência:** um lançamento pertence ao mês do seu `due_date`. Um gasto no cartão em 28/11 é lançado com data 28/11 e conta em novembro. O Trevo não modela faturas.
- **Realizado do mês:** soma de `paid_cents` dos lançamentos do mês (entradas menos saídas).
- **Previsto do mês:** soma de `due_cents` dos lançamentos do mês (entradas menos saídas). As parcelas de vendas a clientes entram aqui como **faturamento previsto**.
- **A pagar / a receber:** soma de `remaining_cents` dos lançamentos do mês com `status <> 'paid'`.
- **Pagamento parcial:** o usuário informa quanto já pagou. Se `paid_cents` chegar ao valor devido, o status vira `paid` automaticamente (trigger).
- **Juros:** o usuário edita a parcela de um mês específico e informa os juros combinados (valor livre). O valor original da parcela não muda, e as outras parcelas não são afetadas. Os juros recebidos somam em "Juros recebidos" no relatório do cliente.
- **Venda parcelada:** é uma entrada parcelada com `client_id`. A entrada (sinal) é lançada como uma entrada comum, já recebida, e pode ser vinculada ao mesmo cliente.
- **Vencimentos de parcelas:** gerados a partir da data da primeira parcela e do intervalo (mensal, a cada 15 dias ou a cada N dias). Depois de criadas, a data e o valor de **cada parcela** podem ser editados individualmente.
- **Arquivar** categoria, forma de pagamento ou cliente: some dos seletores, mas continua no histórico. Excluir de vez só é permitido quando não há lançamentos ligados.

## Funções

| Função                                                            | Tipo                                             | O que faz                                                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `is_admin()`                                                      | `stable`, `security definer`                     | `true` se `auth.uid()` tem `role = 'admin'`. Usada nas políticas                                                                               |
| `handle_new_user()`                                               | trigger em `auth.users`                          | Cria o `profile` e chama `seed_user_defaults`                                                                                                  |
| `seed_user_defaults(p_user uuid)`                                 | `security definer`, só uso interno               | Cria as categorias (com ícone e cor) e as formas de pagamento padrão. Idempotente                                                              |
| `sync_paid_status()`                                              | trigger `before insert/update` em `transactions` | Normaliza `status` e `paid_cents` (ex.: parcial que chegou ao valor devido vira pago; marcado pago preenche `paid_cents` e `paid_at`)          |
| `create_installments(...)`                                        | `security invoker`                               | Cria as N parcelas numa transação, com o resto dos centavos na primeira e vencimentos pelo intervalo escolhido. Aceita `client_id` para vendas |
| `generate_recurring_transactions(p_recurrence uuid default null)` | `security definer`                               | Cria os lançamentos que faltam até hoje + 3 meses (de uma regra ou de todas). Idempotente                                                      |
| `dashboard_summary(p_user uuid, p_month date)`                    | `security invoker`                               | Realizado, previsto, entradas, saídas, a pagar, a receber, a receber de clientes e variação contra o mês anterior                              |
| `spending_by_category(p_user, p_month)`                           | `security invoker`                               | Saídas do mês por categoria                                                                                                                    |
| `spending_by_payment_method(p_user, p_month)`                     | `security invoker`                               | Saídas do mês por forma de pagamento                                                                                                           |
| `monthly_history(p_user, p_months int default 6)`                 | `security invoker`                               | Entradas e saídas por mês                                                                                                                      |
| `client_balances(p_user)`                                         | `security invoker`                               | Por cliente: total vendido, recebido, a receber, em atraso e juros recebidos                                                                   |

**Cron:** `select cron.schedule('trevo-recurrences', '0 6 * * *', 'select generate_recurring_transactions()');` roda às 06:00 UTC, que são 03:00 em Brasília.

## Políticas de RLS

O padrão de todas as tabelas com `user_id` (`categories`, `payment_methods`, `clients`, `recurrences`, `transactions`) é este:

| Operação | Regra                                                            |
| -------- | ---------------------------------------------------------------- |
| `select` | `user_id = auth.uid() or is_admin()`                             |
| `insert` | `with check (user_id = auth.uid())`                              |
| `update` | `using (user_id = auth.uid()) with check (user_id = auth.uid())` |
| `delete` | `using (user_id = auth.uid())`                                   |

Em `profiles`:

- `select`: `id = auth.uid() or is_admin()`.
- `update`: só o próprio perfil, e só o `full_name` (privilégio de coluna: `grant update (full_name)`). Mudar o `role` dá erro de permissão; só a service role ou o SQL editor conseguem.
- Não há `insert` nem `delete` pelo cliente: o perfil é criado pelo trigger e removido em cascata.

**Resultado:** cada usuário vê e altera só o que é dele, e o admin **vê tudo e altera só o que é dele**.

## Dados padrão (criados para cada novo usuário)

**Categorias de saída:** Moradia, Mercado, Restaurantes, Transporte, Saúde, Educação, Lazer, Compras, Assinaturas, Outros.

**Categorias de entrada:** Salário, Vendas, Freela, Reembolso, Rendimentos, Outros.

**Formas de pagamento:** Cartão de crédito (`credit_card`), Cartão de débito (`debit_card`), Pix (`pix`), Dinheiro (`cash`), Boleto (`boleto`).
