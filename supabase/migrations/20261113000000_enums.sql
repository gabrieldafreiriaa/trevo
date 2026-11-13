-- S0 · Tipos base do domínio do Trevo.
-- Referência: docs/DATA_MODEL.md, seção "Tipos (enums)".
-- O status "atrasado" (overdue) NÃO é um enum: é derivado na view
-- transactions_with_status (S3).

create type public.user_role as enum ('admin', 'user');

create type public.transaction_type as enum ('income', 'expense');

create type public.transaction_status as enum ('paid', 'pending', 'partial');

create type public.payment_kind as enum (
  'credit_card',
  'debit_card',
  'pix',
  'cash',
  'boleto',
  'other'
);
