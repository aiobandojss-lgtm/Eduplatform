-- Cursos y su visibilidad (spec course-catalog y course-authoring, design D6)

create type public.course_status as enum ('draft', 'published');

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references public.profiles (id) on delete restrict,
  category_id smallint not null references public.categories (id),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 160),
  title text not null check (char_length(title) between 3 and 150),
  short_description text not null check (char_length(short_description) between 1 and 300),
  description text not null default '' check (char_length(description) <= 10000),
  status public.course_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Un curso publicado siempre tiene fecha de publicacion
  constraint courses_published_has_date check (status = 'draft' or published_at is not null)
);

create index courses_catalog_idx on public.courses (status, published_at desc, id desc);
create index courses_instructor_idx on public.courses (instructor_id);
create index courses_category_idx on public.courses (category_id);

alter table public.courses enable row level security;

create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

create function public.owns_course(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.courses
    where id = p_course_id and instructor_id = (select auth.uid())
  );
$$;

-- Visible para el usuario actual: publicado con instructor activo, o propio.
-- La rama de inscritos se agrega con la tabla enrollments (tarea 5.1).
create function public.can_view_course(p_course_id uuid)
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
        (c.status = 'published' and public.is_active_instructor(c.instructor_id))
        or c.instructor_id = (select auth.uid())
      )
  );
$$;

revoke execute on function public.owns_course(uuid) from public;
revoke execute on function public.can_view_course(uuid) from public;
grant execute on function public.owns_course(uuid) to anon, authenticated;
grant execute on function public.can_view_course(uuid) to anon, authenticated;

create policy "courses_select_visible"
  on public.courses for select
  to anon, authenticated
  using (
    (status = 'published' and public.is_active_instructor(instructor_id))
    or instructor_id = (select auth.uid())
  );

-- Las politicas de escritura llegan en la tarea 4.1
revoke insert, update, delete on public.courses from anon;
