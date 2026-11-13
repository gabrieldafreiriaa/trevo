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
