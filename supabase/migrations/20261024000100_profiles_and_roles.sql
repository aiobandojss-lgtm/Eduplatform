-- Perfiles de usuario y modelo de roles (spec user-access, design D2 y D3)

create type public.user_role as enum ('student', 'instructor', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  bio text check (char_length(bio) <= 2000),
  role public.user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Trigger generico para mantener updated_at; lo reutilizan otras tablas
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crea el perfil al registrarse. El rol se fuerza a 'student' e ignora
-- cualquier rol enviado en los metadatos del registro (nadie se autoasigna roles).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1)
    ),
    'student'
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Privilegios por columna: el usuario puede editar nombre y biografia pero nunca el rol.
-- Los perfiles solo se crean via trigger y se eliminan en cascada con auth.users.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (display_name, bio) on public.profiles to authenticated;
