-- Dados de DESENVOLVIMENTO (rodam só no banco local, no `pnpm db:reset`).
-- Nunca rode em produção.
--
-- Usuários (senha de todos: trevo123):
--   gabriel@trevo.local   → admin
--   pai@trevo.local       → user
--   namorada@trevo.local  → user

do $$
declare
  u record;
begin
  for u in
    select *
    from (
      values
        ('00000000-0000-4000-8000-000000000001'::uuid, 'gabriel@trevo.local', 'Gabriel'),
        ('00000000-0000-4000-8000-000000000002'::uuid, 'pai@trevo.local', 'Pai'),
        ('00000000-0000-4000-8000-000000000003'::uuid, 'namorada@trevo.local', 'Namorada')
    ) as t (id, email, full_name)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    )
    values (
      '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated',
      u.email, extensions.crypt('trevo123', extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', u.full_name),
      now(), now(), '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    )
    values (
      gen_random_uuid(), u.id, u.id::text,
      jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
      'email', now(), now(), now()
    );
  end loop;
end;
$$;

update public.profiles
set role = 'admin'
where id = '00000000-0000-4000-8000-000000000001';

-- Lançamentos de exemplo do Gabriel, no mês atual (datas relativas a hoje).
do $$
declare
  g constant uuid := '00000000-0000-4000-8000-000000000001';
  m date := date_trunc('month', public.today_sp())::date;
  pix uuid := (select id from public.payment_methods where user_id = g and kind = 'pix');
  credito uuid := (select id from public.payment_methods where user_id = g and kind = 'credit_card');
  debito uuid := (select id from public.payment_methods where user_id = g and kind = 'debit_card');

begin
  insert into public.transactions (user_id, type, description, amount_cents, status, due_date, category_id, payment_method_id)
  values
    (g, 'expense', 'Mercado do bairro',    31240, 'paid',    m + 10, (select id from public.categories where user_id = g and name = 'Mercado'), debito),
    (g, 'expense', 'Uber',                  3890, 'paid',    m + 9,  (select id from public.categories where user_id = g and name = 'Transporte'), credito),
    (g, 'expense', 'Conta de luz',          18600, 'pending', m + 9,  (select id from public.categories where user_id = g and name = 'Moradia'), pix),
    (g, 'income',  'Freela site',          65000, 'pending', m + 24, (select id from public.categories where user_id = g and name = 'Freela'), null);

  insert into public.transactions (user_id, type, description, amount_cents, paid_cents, status, due_date, category_id, payment_method_id)
  values (g, 'expense', 'Academia', 9900, 5000, 'partial', m + 11,
          (select id from public.categories where user_id = g and name = 'Saúde'), pix);
end;
$$;

-- Contas fixas do Gabriel (geram os lançamentos do mês atual + 3 meses) e um parcelado.
do $$
declare
  g constant uuid := '00000000-0000-4000-8000-000000000001';
  m date := date_trunc('month', public.today_sp())::date;
  pix uuid := (select id from public.payment_methods where user_id = g and kind = 'pix');
  credito uuid := (select id from public.payment_methods where user_id = g and kind = 'credit_card');
  grupo uuid := gen_random_uuid();
begin
  insert into public.recurrences (user_id, type, description, amount_cents, category_id, payment_method_id, day_of_month, starts_on)
  values
    (g, 'income',  'Salário',  620000, (select id from public.categories where user_id = g and name = 'Salário'), pix, 5,  m),
    (g, 'expense', 'Aluguel',  140000, (select id from public.categories where user_id = g and name = 'Moradia'), pix, 6,  m),
    (g, 'expense', 'Internet',  12000, (select id from public.categories where user_id = g and name = 'Moradia'), pix, 18, m);

  perform public.generate_recurring_transactions();

  -- Salário e aluguel deste mês já foram pagos.
  update public.transactions set status = 'paid'
  where user_id = g and due_date in (m + 4, m + 5) and recurrence_id is not null;

  -- TV em 10x no cartão, começando neste mês.
  insert into public.transactions (
    user_id, type, description, amount_cents, status, due_date, category_id, payment_method_id,
    installment_group_id, installment_number, installment_total
  )
  select g, 'expense', 'TV da sala', 21000, case when n = 1 then 'paid' else 'pending' end::public.transaction_status,
         (m + 14 + make_interval(months => n - 1))::date,
         (select id from public.categories where user_id = g and name = 'Compras'), credito,
         grupo, n, 10
  from generate_series(1, 10) as n;
end;
$$;
