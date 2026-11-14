-- S5 · Entrada (sinal) da venda dentro do mesmo parcelamento.
-- A entrada usa o mesmo installment_group_id da venda com installment_number = 0,
-- assim o carnê mostra "Entrada + 5x" juntos. installment_total continua sendo
-- o número de parcelas (sem contar a entrada).

alter table public.transactions
  drop constraint transactions_installments_all_or_none;

alter table public.transactions
  add constraint transactions_installments_all_or_none check (
    (installment_group_id is null and installment_number is null and installment_total is null)
    or (
      installment_group_id is not null
      and installment_total between 1 and 48
      and installment_number between 0 and installment_total
    )
  );

comment on column public.transactions.installment_number is
  'Número da parcela (1..N). 0 = entrada/sinal de uma venda, no mesmo grupo das parcelas.';
