-- Unica via para cambiar roles: solo un admin otorga o retira el rol instructor (design D3).
-- No existe ninguna funcion que otorgue 'admin'; el primer admin se crea por SQL.

create function public.set_instructor_role(p_target_user uuid, p_enabled boolean)
returns public.user_role
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current public.user_role;
  v_new public.user_role;
begin
  if not public.is_admin() then
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

revoke execute on function public.set_instructor_role(uuid, boolean) from public, anon;
grant execute on function public.set_instructor_role(uuid, boolean) to authenticated;
