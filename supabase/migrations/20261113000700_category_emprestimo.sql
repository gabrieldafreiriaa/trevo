-- Categoria padrão "Empréstimo", nos dois tipos:
--  · saída: pagar parcela de empréstimo / emprestar dinheiro
--  · entrada: pegar empréstimo / receber de volta o que emprestou
-- Atualiza os padrões de novos usuários e acrescenta nos que já existem.

create or replace function public.seed_user_defaults(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categories (user_id, type, name, icon, color)
  values
    (p_user, 'expense', 'Moradia',      'house',          '#3b82f6'),
    (p_user, 'expense', 'Mercado',      'shopping-cart',  '#22c55e'),
    (p_user, 'expense', 'Restaurantes', 'utensils',       '#f97316'),
    (p_user, 'expense', 'Transporte',   'car',            '#6366f1'),
    (p_user, 'expense', 'Saúde',        'heart-pulse',    '#ef4444'),
    (p_user, 'expense', 'Educação',     'graduation-cap', '#8b5cf6'),
    (p_user, 'expense', 'Lazer',        'party-popper',   '#ec4899'),
    (p_user, 'expense', 'Compras',      'shopping-bag',   '#f59e0b'),
    (p_user, 'expense', 'Assinaturas',  'repeat',         '#14b8a6'),
    (p_user, 'expense', 'Empréstimo',   'landmark',       '#64748b'),
    (p_user, 'expense', 'Outros',       'circle-ellipsis','#64748b'),
    (p_user, 'income',  'Salário',      'briefcase',      '#22c55e'),
    (p_user, 'income',  'Vendas',       'store',          '#14b8a6'),
    (p_user, 'income',  'Freela',       'laptop',         '#6366f1'),
    (p_user, 'income',  'Reembolso',    'undo-2',         '#f59e0b'),
    (p_user, 'income',  'Rendimentos',  'trending-up',    '#3b82f6'),
    (p_user, 'income',  'Empréstimo',   'landmark',       '#64748b'),
    (p_user, 'income',  'Outros',       'circle-ellipsis','#64748b')
  on conflict do nothing;

  insert into public.payment_methods (user_id, kind, name)
  values
    (p_user, 'credit_card', 'Cartão de crédito'),
    (p_user, 'debit_card',  'Cartão de débito'),
    (p_user, 'pix',         'Pix'),
    (p_user, 'cash',        'Dinheiro'),
    (p_user, 'boleto',      'Boleto')
  on conflict do nothing;
end;
$$;

-- Usuários que já existem ganham SÓ o "Empréstimo" (não recria padrões que alguém tenha excluído).
insert into public.categories (user_id, type, name, icon, color)
select p.id, t.type, 'Empréstimo', 'landmark', '#64748b'
from public.profiles p
cross join (values ('expense'::public.transaction_type), ('income'::public.transaction_type)) as t (type)
on conflict do nothing;
