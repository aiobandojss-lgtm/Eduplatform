-- Helpers comunes que scripts/test-db.mjs antepone a cada archivo *.test.sql.
-- Todo se crea en pg_temp dentro de una transaccion que termina en rollback,
-- por lo que nada persiste en la base.

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, pg_temp;

-- La Management API solo devuelve el resultado de la ultima sentencia,
-- asi que cada linea TAP se acumula aqui y el runner la lee al final.
create temp table _tap (n serial primary key, line text) on commit drop;
grant select, insert on _tap to public;
grant usage on sequence _tap_n_seq to public;

-- Crea un usuario en auth.users (dispara los triggers de perfil) y devuelve su id.
create function pg_temp.create_user(p_email text, p_metadata jsonb default '{}'::jsonb)
returns uuid
language plpgsql
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    p_email, '', now(), '{"provider":"email","providers":["email"]}'::jsonb,
    p_metadata, now(), now()
  );
  return v_id;
end;
$$;

-- Simula una sesion autenticada: auth.uid() devuelve p_user_id y RLS aplica como 'authenticated'.
create function pg_temp.login_as(p_user_id uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

-- Simula un visitante sin sesion.
create function pg_temp.login_anon()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  perform set_config('role', 'anon', true);
end;
$$;
