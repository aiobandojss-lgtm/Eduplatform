-- Reglas de publicacion (4.3) y reordenamiento atomico de lecciones (4.4)
-- Codigos de error propios para que la app los traduzca:
--   CP001 publicar un curso sin lecciones
--   CP002 borrar la ultima leccion de un curso publicado
--   CP003 lista de lecciones invalida al reordenar

create function private.courses_guard_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'published' and old.status = 'draft' then
    if not exists (select 1 from public.lessons where course_id = new.id) then
      raise exception 'Un curso necesita al menos una lección para publicarse'
        using errcode = 'CP001';
    end if;
    new.published_at := now();
  else
    -- published_at solo lo fija la base al publicar; se ignora lo que envie el cliente
    new.published_at := old.published_at;
  end if;
  return new;
end;
$$;

create trigger courses_guard_publication
  before update on public.courses
  for each row execute function private.courses_guard_publication();

create function private.lessons_guard_last_published()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Bloquea el curso para que dos borrados simultaneos no dejen el curso sin lecciones.
  -- Si el curso se esta eliminando (cascada) ya no es visible y el borrado se permite.
  perform 1 from public.courses
  where id = old.course_id and status = 'published'
  for update;

  if found and (select count(*) from public.lessons where course_id = old.course_id) <= 1 then
    raise exception 'No se puede eliminar la única lección de un curso publicado; despublícalo primero'
      using errcode = 'CP002';
  end if;
  return old;
end;
$$;

create trigger lessons_guard_last_published
  before delete on public.lessons
  for each row execute function private.lessons_guard_last_published();

-- Reordena en una sola transaccion: la restriccion unica diferida tolera
-- posiciones repetidas transitorias y se valida al final.
create function public.reorder_lessons(p_course_id uuid, p_lesson_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not private.owns_course(p_course_id) or not private.is_instructor() then
    raise exception 'Solo el dueño del curso puede reordenar sus lecciones'
      using errcode = '42501';
  end if;

  if p_lesson_ids is null
     or cardinality(p_lesson_ids) <> (select count(distinct x) from unnest(p_lesson_ids) x)
     or (select array_agg(id order by id) from public.lessons where course_id = p_course_id)
        is distinct from (select array_agg(x order by x) from unnest(p_lesson_ids) x)
  then
    raise exception 'La lista debe contener exactamente todas las lecciones del curso'
      using errcode = 'CP003';
  end if;

  set constraints public.lessons_course_position_key deferred;

  update public.lessons l
  set position = o.ord
  from unnest(p_lesson_ids) with ordinality as o(id, ord)
  where l.id = o.id and l.course_id = p_course_id;
end;
$$;

revoke execute on function public.reorder_lessons(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_lessons(uuid, uuid[]) to authenticated;
