-- Escritura de cursos, lecciones y contenido solo por su instructor dueno (spec course-authoring, D7)
-- Exigir is_instructor() ademas de la propiedad hace que un instructor degradado pierda la edicion.

-- 4.1 Cursos
create policy "courses_insert_instructor"
  on public.courses for insert
  to authenticated
  with check (
    private.is_instructor()
    and instructor_id = (select auth.uid())
    and status = 'draft'
    and published_at is null
  );

create policy "courses_update_owner"
  on public.courses for update
  to authenticated
  using (instructor_id = (select auth.uid()) and private.is_instructor())
  with check (instructor_id = (select auth.uid()));

create policy "courses_delete_owner"
  on public.courses for delete
  to authenticated
  using (instructor_id = (select auth.uid()) and private.is_instructor());

-- 4.2 Lecciones
create policy "lessons_insert_owner"
  on public.lessons for insert
  to authenticated
  with check (private.owns_course(course_id) and private.is_instructor());

create policy "lessons_update_owner"
  on public.lessons for update
  to authenticated
  using (private.owns_course(course_id) and private.is_instructor())
  with check (private.owns_course(course_id));

create policy "lessons_delete_owner"
  on public.lessons for delete
  to authenticated
  using (private.owns_course(course_id) and private.is_instructor());

grant insert, update, delete on public.lesson_contents to authenticated;

create policy "lesson_contents_insert_owner"
  on public.lesson_contents for insert
  to authenticated
  with check (
    private.is_instructor()
    and exists (select 1 from public.lessons l where l.id = lesson_id and private.owns_course(l.course_id))
  );

create policy "lesson_contents_update_owner"
  on public.lesson_contents for update
  to authenticated
  using (
    private.is_instructor()
    and exists (select 1 from public.lessons l where l.id = lesson_id and private.owns_course(l.course_id))
  );

create policy "lesson_contents_delete_owner"
  on public.lesson_contents for delete
  to authenticated
  using (
    private.is_instructor()
    and exists (select 1 from public.lessons l where l.id = lesson_id and private.owns_course(l.course_id))
  );

-- Posicion automatica al final del temario cuando el cliente no la envia.
-- El default 0 la vuelve opcional en la API; el trigger corre antes del CHECK (position > 0).
alter table public.lessons alter column position set default 0;

create function private.lessons_default_position()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.position, 0) <= 0 then
    select coalesce(max(position), 0) + 1 into new.position
    from public.lessons
    where course_id = new.course_id;
  end if;
  return new;
end;
$$;

create trigger lessons_default_position
  before insert on public.lessons
  for each row execute function private.lessons_default_position();

-- Editar lecciones o su contenido actualiza la fecha de ultima actualizacion del curso
create function private.touch_course_from_lesson()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_course_id uuid;
begin
  if tg_table_name = 'lessons' then
    v_course_id := coalesce(new.course_id, old.course_id);
  else
    select course_id into v_course_id
    from public.lessons
    where id = coalesce(new.lesson_id, old.lesson_id);
  end if;

  update public.courses set updated_at = now() where id = v_course_id;
  return null;
end;
$$;

create trigger lessons_touch_course
  after insert or update or delete on public.lessons
  for each row execute function private.touch_course_from_lesson();

create trigger lesson_contents_touch_course
  after insert or update on public.lesson_contents
  for each row execute function private.touch_course_from_lesson();
