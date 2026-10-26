-- Spec course-enrollment: inscripcion, acceso al contenido y acceso tras despublicar
insert into _tap(line) select plan(20);

create temp table _ids (name text primary key, id uuid) on commit drop;
grant select, insert on _ids to public;

insert into _ids values
  ('inst', pg_temp.create_user('e-inst@test.local')),
  ('stu',  pg_temp.create_user('e-stu@test.local')),
  ('stu2', pg_temp.create_user('e-stu2@test.local'));
update public.profiles set role = 'instructor' where id = (select id from _ids where name = 'inst');

with x as (
  insert into public.courses (instructor_id, category_id, slug, title, short_description)
  values ((select id from _ids where name = 'inst'), 1, 'e-pub', 'Curso publicado', 'x')
  returning id)
insert into _ids select 'pub', id from x;
with x as (
  insert into public.courses (instructor_id, category_id, slug, title, short_description)
  values ((select id from _ids where name = 'inst'), 1, 'e-draft', 'Curso borrador', 'x')
  returning id)
insert into _ids select 'draft', id from x;
with x as (
  insert into public.lessons (course_id, title) values ((select id from _ids where name = 'pub'), 'L1')
  returning id)
insert into _ids select 'lesson', id from x;
insert into public.lesson_contents (lesson_id, body_markdown) values ((select id from _ids where name = 'lesson'), 'Secreto');
update public.courses set status = 'published' where id = (select id from _ids where name = 'pub');

-- Inscripcion
select pg_temp.login_as((select id from _ids where name = 'stu'));
insert into _tap(line) select lives_ok(
  format('insert into public.enrollments (user_id, course_id) values (%L, %L)',
         (select id from _ids where name = 'stu'), (select id from _ids where name = 'pub')),
  'estudiante se inscribe en un curso publicado');
insert into _tap(line) select throws_ok(
  format('insert into public.enrollments (user_id, course_id) values (%L, %L)',
         (select id from _ids where name = 'stu'), (select id from _ids where name = 'pub')),
  '23505', null, 'no se crea una inscripcion duplicada');
insert into _tap(line) select throws_ok(
  format('insert into public.enrollments (user_id, course_id) values (%L, %L)',
         (select id from _ids where name = 'stu'), (select id from _ids where name = 'draft')),
  '42501', null, 'no se puede inscribir en un borrador');
insert into _tap(line) select throws_ok(
  format('insert into public.enrollments (user_id, course_id) values (%L, %L)',
         (select id from _ids where name = 'stu2'), (select id from _ids where name = 'pub')),
  '42501', null, 'no se puede inscribir a otro usuario');

select pg_temp.login_as((select id from _ids where name = 'inst'));
insert into _tap(line) select throws_ok(
  format('insert into public.enrollments (user_id, course_id) values (%L, %L)',
         (select id from _ids where name = 'inst'), (select id from _ids where name = 'pub')),
  '42501', null, 'el dueno no puede inscribirse en su propio curso');

select pg_temp.login_anon();
insert into _tap(line) select throws_ok(
  format('insert into public.enrollments (user_id, course_id) values (%L, %L)',
         (select id from _ids where name = 'stu'), (select id from _ids where name = 'pub')),
  '42501', null, 'visitante sin sesion no puede inscribirse');

-- Acceso al contenido
select pg_temp.login_as((select id from _ids where name = 'stu'));
insert into _tap(line) select is(
  (select body_markdown from public.lesson_contents where lesson_id = (select id from _ids where name = 'lesson')),
  'Secreto', 'el inscrito lee el contenido de las lecciones');

select pg_temp.login_as((select id from _ids where name = 'stu2'));
insert into _tap(line) select is(
  (select count(*)::int from public.lesson_contents where lesson_id = (select id from _ids where name = 'lesson')), 0,
  'un usuario no inscrito no lee el contenido');
insert into _tap(line) select is(
  (select count(*)::int from public.enrollments where course_id = (select id from _ids where name = 'pub')), 0,
  'un usuario no ve inscripciones ajenas');

-- Conteo para el instructor y regla de eliminacion
select pg_temp.login_as((select id from _ids where name = 'inst'));
insert into _tap(line) select is(
  (select enrollments_count from public.catalog_courses where id = (select id from _ids where name = 'pub')), 1,
  'el instructor ve el numero de inscritos de su curso');
insert into _tap(line) select throws_ok(
  format('delete from public.courses where id = %L', (select id from _ids where name = 'pub')),
  '23503', null, 'no se puede eliminar un curso con inscritos');

-- Acceso tras despublicar
update public.courses set status = 'draft' where id = (select id from _ids where name = 'pub');

select pg_temp.login_as((select id from _ids where name = 'stu'));
insert into _tap(line) select is(
  (select count(*)::int from public.courses where id = (select id from _ids where name = 'pub')), 1,
  'el inscrito sigue viendo el curso despublicado');
insert into _tap(line) select is(
  (select count(*)::int from public.lessons where course_id = (select id from _ids where name = 'pub')), 1,
  'el inscrito sigue viendo el temario');
insert into _tap(line) select is(
  (select body_markdown from public.lesson_contents where lesson_id = (select id from _ids where name = 'lesson')),
  'Secreto', 'el inscrito sigue leyendo el contenido tras despublicar');
insert into _tap(line) select is(
  (select count(*)::int from public.search_catalog(null, null) where id = (select id from _ids where name = 'pub')), 0,
  'el curso despublicado no aparece en el catalogo ni para el inscrito');

select pg_temp.login_as((select id from _ids where name = 'stu2'));
insert into _tap(line) select is(
  (select count(*)::int from public.courses where id = (select id from _ids where name = 'pub')), 0,
  'un no inscrito no ve el curso despublicado');
insert into _tap(line) select throws_ok(
  format('insert into public.enrollments (user_id, course_id) values (%L, %L)',
         (select id from _ids where name = 'stu2'), (select id from _ids where name = 'pub')),
  '42501', null, 'no se admiten inscripciones nuevas mientras siga en borrador');

-- Regresion: el catalogo debe funcionar para visitantes sin sesion aunque existan inscripciones
reset role;
update public.courses set status = 'published' where id = (select id from _ids where name = 'pub');
select pg_temp.login_anon();
insert into _tap(line) select lives_ok(
  $$ select * from public.search_catalog(null, null) $$,
  'un visitante puede consultar el catalogo (la vista cuenta inscritos)');
insert into _tap(line) select is(
  (select enrollments_count from public.catalog_courses where id = (select id from _ids where name = 'pub')), 0,
  'un visitante no ve el numero real de inscritos');
insert into _tap(line) select is(
  (select count(*)::int from public.enrollments), 0,
  'un visitante no ve ninguna inscripcion');

insert into _tap(line) select * from finish();
