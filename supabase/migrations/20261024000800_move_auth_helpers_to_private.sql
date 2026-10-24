-- Mueve las funciones auxiliares de autorizacion a un esquema no expuesto por la API.
-- En public, PostgREST las publicaba como /rest/v1/rpc/* (advisor 0028/0029).
-- Las politicas RLS referencian las funciones por OID, asi que siguen funcionando.

create schema if not exists private;
revoke all on schema private from public;
-- Necesario para que las politicas evaluadas como anon/authenticated puedan invocarlas
grant usage on schema private to anon, authenticated;

alter function public.is_admin() set schema private;
alter function public.is_instructor() set schema private;
alter function public.is_active_instructor(uuid) set schema private;
alter function public.owns_course(uuid) set schema private;
alter function public.can_view_course(uuid) set schema private;

-- Los cuerpos de funcion referencian por nombre: se recrean con el esquema nuevo
create or replace function private.can_view_course(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.courses c
    where c.id = p_course_id
      and (
        (c.status = 'published' and private.is_active_instructor(c.instructor_id))
        or c.instructor_id = (select auth.uid())
      )
  );
$$;

create or replace function public.set_instructor_role(p_target_user uuid, p_enabled boolean)
returns public.user_role
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current public.user_role;
  v_new public.user_role;
begin
  if not private.is_admin() then
    raise exception 'Solo un administrador puede cambiar roles'
      using errcode = '42501';
  end if;

  select role into v_current
  from public.profiles
  where id = p_target_user
  for update;

  if not found then
    raise exception 'Usuario no encontrado' using errcode = 'P0002';
  end if;

  if v_current = 'admin' then
    raise exception 'No se puede cambiar el rol de un administrador'
      using errcode = '42501';
  end if;

  v_new := case when p_enabled then 'instructor' else 'student' end;

  update public.profiles set role = v_new where id = p_target_user;

  return v_new;
end;
$$;

create or replace function public.search_catalog(p_query text default null, p_category_slug text default null)
returns setof public.catalog_courses
language sql
stable
security invoker
set search_path = ''
as $$
  select cc.*
  from public.catalog_courses cc
  where cc.status = 'published'
    and private.is_active_instructor(cc.instructor_id)
    and (p_category_slug is null or cc.category_slug = p_category_slug)
    and (
      coalesce(trim(p_query), '') = ''
      or cc.title ilike '%' || public.escape_like(trim(p_query)) || '%'
      or cc.short_description ilike '%' || public.escape_like(trim(p_query)) || '%'
      or cc.description ilike '%' || public.escape_like(trim(p_query)) || '%'
    );
$$;
