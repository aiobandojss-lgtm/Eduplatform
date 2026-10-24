-- Funciones auxiliares de autorizacion y politicas RLS de profiles (design D4)
-- SECURITY DEFINER evita la recursion de RLS entre tablas; search_path vacio
-- obliga a calificar cada objeto y evita secuestro de funciones.

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create function public.is_instructor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'instructor'
  );
$$;

-- Un curso solo es visible en el catalogo si su dueno conserva el rol instructor
create function public.is_active_instructor(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = p_user_id and role = 'instructor'
  );
$$;

revoke execute on function public.is_admin() from public;
revoke execute on function public.is_instructor() from public;
revoke execute on function public.is_active_instructor(uuid) from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_instructor() to anon, authenticated;
grant execute on function public.is_active_instructor(uuid) to anon, authenticated;

-- Los perfiles son publicos: el catalogo muestra instructores y las resenas a sus autores
create policy "profiles_select_public"
  on public.profiles for select
  to anon, authenticated
  using (true);

-- Cada usuario edita solo su propia fila (las columnas permitidas las limita el GRANT)
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
