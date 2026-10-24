-- Spec course-catalog: categorias, visibilidad de cursos, temario publico, contenido protegido,
-- promedio de resenas y busqueda
insert into _tap(line) select plan(20);

create temp table _ids (name text primary key, id uuid) on commit drop;
grant select on _ids to public;

insert into _ids values
  ('inst',    pg_temp.create_user('inst@test.local')),
  ('inst2',   pg_temp.create_user('inst2@test.local')),
  ('demoted', pg_temp.create_user('demoted@test.local')),
  ('stu1',    pg_temp.create_user('stu1@test.local')),
  ('stu2',    pg_temp.create_user('stu2@test.local')),
  ('stu3',    pg_temp.create_user('stu3@test.local'));

update public.profiles set role = 'instructor'
where id in (select id from _ids where name in ('inst', 'inst2', 'demoted'));

-- Datos de prueba creados con el rol de conexion (las politicas de escritura llegan en el grupo 4)
with x as (
  insert into public.courses (instructor_id, category_id, slug, title, short_description, status, published_at)
  values ((select id from _ids where name = 'inst'), (select id from public.categories where slug = 'paid-ads'),
          'test-prompts-ads', 'Prompts para Ads', 'Escribe anuncios con IA', 'published', now() - interval '1 day')
  returning id)
insert into _ids select 'pub', id from x;
with x as (
  insert into public.courses (instructor_id, category_id, slug, title, short_description)
  values ((select id from _ids where name = 'inst'), (select id from public.categories where slug = 'seo'),
          'test-borrador', 'Curso en borrador', 'Aun no publicado')
  returning id)
insert into _ids select 'draft', id from x;
with x as (
  insert into public.courses (instructor_id, category_id, slug, title, short_description, status, published_at)
  values ((select id from _ids where name = 'demoted'), (select id from public.categories where slug = 'seo'),
          'test-degradado', 'Curso de instructor degradado', 'Publicado pero oculto', 'published', now())
  returning id)
insert into _ids select 'orphan', id from x;

update public.profiles set role = 'student' where id = (select id from _ids where name = 'demoted');

with x as (
  insert into public.lessons (course_id, title, position)
  values ((select id from _ids where name = 'pub'), 'Introduccion', 1)
  returning id)
insert into _ids select 'lesson_pub', id from x;
with x as (
  insert into public.lessons (course_id, title, position)
  values ((select id from _ids where name = 'draft'), 'Borrador 1', 1)
  returning id)
insert into _ids select 'lesson_draft', id from x;
insert into public.lesson_contents (lesson_id, body_markdown)
values ((select id from _ids where name = 'lesson_pub'), 'Contenido privado');

insert into public.reviews (course_id, user_id, rating)
select (select id from _ids where name = 'pub'), id, r
from (values ('stu1', 5), ('stu2', 4), ('stu3', 4)) v(n, r)
join _ids on _ids.name = v.n;

-- 3.1 Categorias
select pg_temp.login_anon();
insert into _tap(line) select ok((select count(*) from public.categories) >= 7, 'visitante lee las categorias');
insert into _tap(line) select throws_ok(
  $$ insert into public.categories (slug, name) values ('x', 'X') $$, '42501', null,
  'visitante no puede crear categorias');
select pg_temp.login_as((select id from _ids where name = 'inst'));
insert into _tap(line) select throws_ok(
  $$ insert into public.categories (slug, name) values ('x', 'X') $$, '42501', null,
  'instructor no puede crear categorias');

-- 3.2 Visibilidad de cursos
select pg_temp.login_anon();
insert into _tap(line) select results_eq(
  $$ select slug from public.courses where slug like 'test-%' order by slug $$,
  $$ values ('test-prompts-ads') $$,
  'visitante ve solo el curso publicado de un instructor activo');

select pg_temp.login_as((select id from _ids where name = 'stu1'));
insert into _tap(line) select results_eq(
  $$ select slug from public.courses where slug like 'test-%' order by slug $$,
  $$ values ('test-prompts-ads') $$,
  'estudiante no ve borradores ni cursos de instructores degradados');

select pg_temp.login_as((select id from _ids where name = 'inst'));
insert into _tap(line) select results_eq(
  $$ select slug from public.courses where slug like 'test-%' order by slug $$,
  $$ values ('test-borrador'), ('test-prompts-ads') $$,
  'el dueno ve sus borradores');

select pg_temp.login_as((select id from _ids where name = 'inst2'));
insert into _tap(line) select is(
  (select count(*)::int from public.courses where slug = 'test-borrador'), 0,
  'otro instructor no ve borradores ajenos');

-- 3.3 Temario publico, contenido protegido
select pg_temp.login_anon();
insert into _tap(line) select is(
  (select title from public.lessons where id = (select id from _ids where name = 'lesson_pub')),
  'Introduccion', 'visitante lee el titulo de una leccion de curso publicado');
insert into _tap(line) select is(
  (select count(*)::int from public.lessons where id = (select id from _ids where name = 'lesson_draft')), 0,
  'visitante no ve lecciones de un borrador');
insert into _tap(line) select throws_ok(
  $$ select * from public.lesson_contents $$, '42501', null,
  'visitante no tiene acceso a lesson_contents');

select pg_temp.login_as((select id from _ids where name = 'stu1'));
insert into _tap(line) select is(
  (select count(*)::int from public.lesson_contents
   where lesson_id = (select id from _ids where name = 'lesson_pub')), 0,
  'estudiante no inscrito no lee el contenido');

select pg_temp.login_as((select id from _ids where name = 'inst'));
insert into _tap(line) select is(
  (select body_markdown from public.lesson_contents
   where lesson_id = (select id from _ids where name = 'lesson_pub')),
  'Contenido privado', 'el dueno lee el contenido de sus lecciones');

-- 3.4 Promedio y conteo en la vista
select pg_temp.login_anon();
insert into _tap(line) select is(
  (select rating_avg from public.catalog_courses where slug = 'test-prompts-ads'), 4.3::numeric,
  'promedio de 5, 4 y 4 es 4.3');
insert into _tap(line) select is(
  (select reviews_count from public.catalog_courses where slug = 'test-prompts-ads'), 3,
  'conteo de resenas es 3');
insert into _tap(line) select is(
  (select lessons_count from public.catalog_courses where slug = 'test-prompts-ads'), 1,
  'la vista cuenta las lecciones');
insert into _tap(line) select is(
  (select count(*)::int from public.catalog_courses where slug in ('test-borrador', 'test-degradado')), 0,
  'la vista respeta el RLS del visitante');

select pg_temp.login_as((select id from _ids where name = 'inst'));
insert into _tap(line) select ok(
  (select reviews_count = 0 and rating_avg is null from public.catalog_courses where slug = 'test-borrador'),
  'curso sin resenas: conteo 0 y promedio null');

-- 3.5 Busqueda (como el dueno, para comprobar que search_catalog excluye su borrador)
insert into _tap(line) select results_eq(
  $$ select slug from public.search_catalog('PROMPTS', null) where slug like 'test-%' $$,
  $$ values ('test-prompts-ads') $$,
  'busqueda sin distinguir mayusculas y solo publicados');
insert into _tap(line) select is(
  (select count(*)::int from public.search_catalog('%', null) where slug like 'test-%'), 0,
  'el comodin % se busca de forma literal');
insert into _tap(line) select is(
  (select count(*)::int from public.search_catalog('prompts', 'seo') where slug like 'test-%'), 0,
  'filtro por categoria combinado con busqueda');

insert into _tap(line) select * from finish();
