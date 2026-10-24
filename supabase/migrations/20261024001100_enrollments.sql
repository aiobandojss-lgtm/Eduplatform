-- Inscripciones y acceso al contenido (spec course-enrollment, design D6 y D7)

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- RESTRICT: un curso con inscritos no se puede eliminar, solo despublicar
  course_id uuid not null references public.courses (id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint enrollments_one_per_user_course unique (user_id, course_id)
);

create index enrollments_course_idx on public.enrollments (course_id);
create index enrollments_user_created_idx on public.enrollments (user_id, created_at desc);

alter table public.enrollments enable row level security;

create function private.is_enrolled(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.enrollments
    where course_id = p_course_id and user_id = (select auth.uid())
  );
$$;

-- Inscribible: publicado, con instructor activo y que no sea propio
create function private.can_enroll(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.courses c
    where c.id = p_course_id
      and c.status = 'published'
      and private.is_active_instructor(c.instructor_id)
      and c.instructor_id <> (select auth.uid())
  );
$$;

revoke execute on function private.is_enrolled(uuid) from public;
revoke execute on function private.can_enroll(uuid) from public;
grant execute on function private.is_enrolled(uuid) to anon, authenticated;
grant execute on function private.can_enroll(uuid) to authenticated;

create policy "enrollments_select_own_or_course_owner"
  on public.enrollments for select
  to authenticated
  using (user_id = (select auth.uid()) or private.owns_course(course_id));

create policy "enrollments_insert_self"
  on public.enrollments for insert
  to authenticated
  with check (user_id = (select auth.uid()) and private.can_enroll(course_id));

revoke all on public.enrollments from anon;
revoke update, delete on public.enrollments from authenticated;

-- Rama de inscritos: siguen viendo el curso y su contenido aunque se despublique
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
        or private.is_enrolled(c.id)
      )
  );
$$;

drop policy "courses_select_visible" on public.courses;
create policy "courses_select_visible"
  on public.courses for select
  to anon, authenticated
  using (
    (status = 'published' and private.is_active_instructor(instructor_id))
    or instructor_id = (select auth.uid())
    or private.is_enrolled(id)
  );

drop policy "lesson_contents_select_owner" on public.lesson_contents;
create policy "lesson_contents_select_owner_or_enrolled"
  on public.lesson_contents for select
  to authenticated
  using (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_id
        and (private.owns_course(l.course_id) or private.is_enrolled(l.course_id))
    )
  );

-- Conteo de inscritos para el panel del instructor (con security_invoker solo
-- el dueno ve todas las inscripciones de su curso; otros ven a lo sumo la propia)
create or replace view public.catalog_courses
with (security_invoker = true)
as
select
  c.id,
  c.slug,
  c.title,
  c.short_description,
  c.description,
  c.status,
  c.published_at,
  c.updated_at,
  c.instructor_id,
  p.display_name as instructor_name,
  p.bio as instructor_bio,
  c.category_id,
  cat.slug as category_slug,
  cat.name as category_name,
  r.rating_avg,
  coalesce(r.reviews_count, 0)::integer as reviews_count,
  (select count(*) from public.lessons l where l.course_id = c.id)::integer as lessons_count,
  (select count(*) from public.enrollments e where e.course_id = c.id)::integer as enrollments_count
from public.courses c
join public.profiles p on p.id = c.instructor_id
join public.categories cat on cat.id = c.category_id
left join lateral (
  select round(avg(rv.rating), 1) as rating_avg, count(*) as reviews_count
  from public.reviews rv
  where rv.course_id = c.id
) r on true;
