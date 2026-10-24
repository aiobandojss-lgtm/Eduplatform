-- Taxonomia cerrada de categorias (spec course-catalog, design D11)

create table public.categories (
  id smallint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null unique,
  sort_order smallint not null default 0
);

alter table public.categories enable row level security;

create policy "categories_select_public"
  on public.categories for select
  to anon, authenticated
  using (true);

-- Sin politicas de escritura: solo se modifican por migracion
revoke insert, update, delete on public.categories from anon, authenticated;

insert into public.categories (slug, name, sort_order) values
  ('seo', 'SEO', 1),
  ('paid-ads', 'Paid Ads', 2),
  ('social-media', 'Social Media', 3),
  ('email-marketing', 'Email Marketing', 4),
  ('ia-generativa', 'IA Generativa', 5),
  ('automatizacion', 'Automatización', 6),
  ('analitica', 'Analítica', 7);
