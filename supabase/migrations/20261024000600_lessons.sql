-- Lecciones separadas en temario publico y contenido protegido (design D5)

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 150),
  position integer not null check (position > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Diferible para permitir reordenar dentro de una transaccion
  constraint lessons_course_position_key unique (course_id, position) deferrable initially immediate
);

create table public.lesson_contents (
  lesson_id uuid primary key references public.lessons (id) on delete cascade,
  body_markdown text not null default '' check (char_length(body_markdown) <= 50000),
  -- Solo YouTube o Vimeo (spec course-authoring)
  video_url text check (
    video_url is null
    or video_url ~ '^https://(www\.)?(youtube\.com/watch\?v=|youtu\.be/|vimeo\.com/)[A-Za-z0-9_-]+'
  ),
  updated_at timestamptz not null default now()
);

alter table public.lessons enable row level security;
alter table public.lesson_contents enable row level security;

create trigger lessons_set_updated_at
  before update on public.lessons
  for each row execute function public.set_updated_at();

create trigger lesson_contents_set_updated_at
  before update on public.lesson_contents
  for each row execute function public.set_updated_at();

-- El temario es tan visible como el curso
create policy "lessons_select_visible_course"
  on public.lessons for select
  to anon, authenticated
  using (public.can_view_course(course_id));

-- El contenido solo para el dueno; la rama de inscritos llega en la tarea 5.1
create policy "lesson_contents_select_owner"
  on public.lesson_contents for select
  to authenticated
  using (
    exists (
      select 1 from public.lessons l
      where l.id = lesson_id and public.owns_course(l.course_id)
    )
  );

revoke insert, update, delete on public.lessons from anon;
revoke all on public.lesson_contents from anon;
revoke insert, update, delete on public.lesson_contents from authenticated;
