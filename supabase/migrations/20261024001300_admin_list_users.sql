-- Listado de usuarios para el admin (spec user-access). Los emails viven en auth.users,
-- que no se expone por la API; esta funcion los entrega solo si quien llama es admin.

create function public.admin_list_users(p_search text default null)
returns table (id uuid, email text, display_name text, role public.user_role, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not private.is_admin() then
    raise exception 'Solo un administrador puede listar usuarios' using errcode = '42501';
  end if;

  return query
  select p.id, u.email::text, p.display_name, p.role, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where coalesce(trim(p_search), '') = ''
     or p.display_name ilike '%' || public.escape_like(trim(p_search)) || '%'
     or u.email ilike '%' || public.escape_like(trim(p_search)) || '%'
  order by p.created_at desc
  limit 50;
end;
$$;

revoke execute on function public.admin_list_users(text) from public, anon;
grant execute on function public.admin_list_users(text) to authenticated;
