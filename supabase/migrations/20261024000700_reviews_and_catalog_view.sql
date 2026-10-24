-- Resenas (estructura y lectura) y vista del catalogo con promedio (design D8, D9)
-- Las reglas de escritura de resenas llegan en la tarea 6.1.

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_one_per_user_course unique (course_id, user_id)
);

create index reviews_course_idx on public.reviews (course_id, created_at desc);

alter table public.reviews enable row level security;

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

create policy "reviews_select_visible_course"
  on public.reviews for select
  to anon, authenticated
  using (public.can_view_course(course_id));

revoke insert, update, delete on public.reviews from anon;

-- security_invoker: la vista respeta el RLS de quien consulta (no el del dueno de la vista)
create view public.catalog_courses
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
  (select count(*) from public.lessons l where l.course_id = c.id)::integer as lessons_count
from public.courses c
join public.profiles p on p.id = c.instructor_id
join public.categories cat on cat.id = c.category_id
left join lateral (
  select round(avg(rv.rating), 1) as rating_avg, count(*) as reviews_count
  from public.reviews rv
  where rv.course_id = c.id
) r on true;

grant select on public.catalog_courses to anon, authenticated;

-- Escapa los comodines de LIKE para buscar el texto del usuario de forma literal
create function public.escape_like(p_text text)
returns text
language sql
immutable
set search_path = ''
as $$
  select replace(replace(replace(p_text, '\', '\\'), '%', '\%'), '_', '\_');
$$;

-- Busqueda del catalogo: solo cursos publicados de instructores activos.
-- El orden y la paginacion los aplica el cliente (order + range).
create function public.search_catalog(p_query text default null, p_category_slug text default null)
returns setof public.catalog_courses
language sql
stable
security invoker
set search_path = ''
as $$
  select cc.*
  from public.catalog_courses cc
  where cc.status = 'published'
    and public.is_active_instructor(cc.instructor_id)
    and (p_category_slug is null or cc.category_slug = p_category_slug)
    and (
      coalesce(trim(p_query), '') = ''
      or cc.title ilike '%' || public.escape_like(trim(p_query)) || '%'
      or cc.short_description ilike '%' || public.escape_like(trim(p_query)) || '%'
      or cc.description ilike '%' || public.escape_like(trim(p_query)) || '%'
    );
$$;
