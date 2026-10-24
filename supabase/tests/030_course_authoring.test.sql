-- Spec course-authoring: creacion, propiedad, lecciones, publicacion, eliminacion y reordenamiento
insert into _tap(line) select plan(28);

create temp table _ids (name text primary key, id uuid) on commit drop;
grant select, insert on _ids to public;

insert into _ids values
  ('inst',    pg_temp.create_user('a-inst@test.local')),
  ('inst2',   pg_temp.create_user('a-inst2@test.local')),
  ('stu',     pg_temp.create_user('a-stu@test.local'));
update public.profiles set role = 'instructor' where id in (select id from _ids where name in ('inst', 'inst2'));

-- 4.1 Crear cursos
select pg_temp.login_as((select id from _ids where name = 'stu'));
insert into _tap(line) select throws_ok(
  format($$ insert into public.courses (instructor_id, category_id, slug, title, short_description)
            values (%L, 1, 'a-stu-course', 'Curso de estudiante', 'x') $$, (select id from _ids where name = 'stu')),
  '42501', null, 'estudiante no puede crear cursos');

select pg_temp.login_as((select id from _ids where name = 'inst'));
insert into _tap(line) select lives_ok(
  format($$ insert into public.courses (instructor_id, category_id, slug, title, short_description)
            values (%L, 1, 'a-course', 'Curso de prueba', 'Descripcion corta') $$, (select id from _ids where name = 'inst')),
  'instructor crea un curso');
insert into _ids select 'course', id from public.courses where slug = 'a-course';

insert into _tap(line) select is(
  (select status::text from public.courses where slug = 'a-course'), 'draft', 'el curso nuevo queda en borrador');
insert into _tap(line) select throws_ok(
  format($$ insert into public.courses (instructor_id, category_id, slug, title, short_description, status, published_at)
            values (%L, 1, 'a-pub', 'Publicado directo', 'x', 'published', now()) $$, (select id from _ids where name = 'inst')),
  '42501', null, 'no se puede crear un curso ya publicado');
insert into _tap(line) select throws_ok(
  format($$ insert into public.courses (instructor_id, category_id, slug, title, short_description)
            values (%L, 1, 'a-ajeno', 'A nombre de otro', 'x') $$, (select id from _ids where name = 'inst2')),
  '42501', null, 'no se puede crear un curso a nombre de otro instructor');
insert into _tap(line) select throws_ok(
  format($$ insert into public.courses (instructor_id, category_id, slug, title, short_description)
            values (%L, 1, 'a-sin-titulo', '', 'x') $$, (select id from _ids where name = 'inst')),
  '23514', null, 'el titulo es obligatorio');

-- Propiedad
reset role;
update public.courses set updated_at = now() - interval '1 day' where slug = 'a-course';
select pg_temp.login_as((select id from _ids where name = 'inst'));
update public.courses set title = 'Curso editado' where slug = 'a-course';
insert into _tap(line) select is(
  (select title from public.courses where slug = 'a-course'), 'Curso editado', 'el dueno edita su curso');
insert into _tap(line) select ok(
  (select updated_at > now() - interval '1 hour' from public.courses where slug = 'a-course'),
  'editar el curso actualiza updated_at');

select pg_temp.login_as((select id from _ids where name = 'inst2'));
update public.courses set title = 'Hackeado' where slug = 'a-course';
delete from public.courses where slug = 'a-course';
reset role;
insert into _tap(line) select is(
  (select title from public.courses where slug = 'a-course'), 'Curso editado',
  'otro instructor no puede editar ni eliminar un curso ajeno');

-- 4.2 Lecciones y contenido
select pg_temp.login_as((select id from _ids where name = 'inst2'));
insert into _tap(line) select throws_ok(
  format($$ insert into public.lessons (course_id, title) values (%L, 'Intrusa') $$, (select id from _ids where name = 'course')),
  '42501', null, 'usuario ajeno no puede agregar lecciones');

reset role;
update public.courses set updated_at = now() - interval '1 day' where slug = 'a-course';
select pg_temp.login_as((select id from _ids where name = 'inst'));
insert into public.lessons (course_id, title) values ((select id from _ids where name = 'course'), 'Leccion A');
insert into public.lessons (course_id, title) values ((select id from _ids where name = 'course'), 'Leccion B');
insert into _ids select 'la', id from public.lessons where title = 'Leccion A' and course_id = (select id from _ids where name = 'course');
insert into _ids select 'lb', id from public.lessons where title = 'Leccion B' and course_id = (select id from _ids where name = 'course');

insert into _tap(line) select results_eq(
  format($$ select title, position from public.lessons where course_id = %L order by position $$, (select id from _ids where name = 'course')),
  $$ values ('Leccion A'::text, 1), ('Leccion B'::text, 2) $$,
  'las lecciones nuevas se agregan al final del orden');
insert into _tap(line) select ok(
  (select updated_at > now() - interval '1 hour' from public.courses where slug = 'a-course'),
  'agregar una leccion actualiza updated_at del curso');

insert into _tap(line) select lives_ok(
  format($$ insert into public.lesson_contents (lesson_id, body_markdown, video_url)
            values (%L, '# Hola', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ') $$, (select id from _ids where name = 'la')),
  'el dueno guarda contenido con video de YouTube');
insert into _tap(line) select lives_ok(
  format($$ insert into public.lesson_contents (lesson_id, video_url) values (%L, 'https://vimeo.com/123456') $$,
         (select id from _ids where name = 'lb')),
  'acepta videos de Vimeo');
insert into _tap(line) select throws_ok(
  format($$ update public.lesson_contents set video_url = 'https://evil.com/video' where lesson_id = %L $$,
         (select id from _ids where name = 'la')),
  '23514', null, 'rechaza URLs de video de otros proveedores');

select pg_temp.login_as((select id from _ids where name = 'inst2'));
update public.lessons set title = 'Hackeada' where id = (select id from _ids where name = 'la');
update public.lesson_contents set body_markdown = 'hackeado' where lesson_id = (select id from _ids where name = 'la');
reset role;
insert into _tap(line) select ok(
  (select l.title = 'Leccion A' and c.body_markdown = '# Hola'
   from public.lessons l join public.lesson_contents c on c.lesson_id = l.id
   where l.id = (select id from _ids where name = 'la')),
  'usuario ajeno no puede editar lecciones ni contenido');

-- 4.4 Reordenar
select pg_temp.login_as((select id from _ids where name = 'inst2'));
insert into _tap(line) select throws_ok(
  format('select public.reorder_lessons(%L, array[%L, %L]::uuid[])',
         (select id from _ids where name = 'course'), (select id from _ids where name = 'lb'), (select id from _ids where name = 'la')),
  '42501', null, 'usuario ajeno no puede reordenar');

select pg_temp.login_as((select id from _ids where name = 'inst'));
insert into _tap(line) select throws_ok(
  format('select public.reorder_lessons(%L, array[%L]::uuid[])',
         (select id from _ids where name = 'course'), (select id from _ids where name = 'lb')),
  'CP003', null, 'reordenar exige todas las lecciones del curso');
insert into _tap(line) select lives_ok(
  format('select public.reorder_lessons(%L, array[%L, %L]::uuid[])',
         (select id from _ids where name = 'course'), (select id from _ids where name = 'lb'), (select id from _ids where name = 'la')),
  'el dueno reordena sus lecciones');
insert into _tap(line) select results_eq(
  format($$ select title from public.lessons where course_id = %L order by position $$, (select id from _ids where name = 'course')),
  $$ values ('Leccion B'::text), ('Leccion A'::text) $$,
  'el temario refleja el nuevo orden sin posiciones repetidas');

-- 4.3 Publicacion
insert into public.courses (instructor_id, category_id, slug, title, short_description)
values ((select id from _ids where name = 'inst'), 1, 'a-vacio', 'Curso vacio', 'x');
insert into _tap(line) select throws_ok(
  $$ update public.courses set status = 'published' where slug = 'a-vacio' $$,
  'CP001', null, 'no se puede publicar un curso sin lecciones');

update public.courses set published_at = '2000-01-01' where slug = 'a-vacio';
insert into _tap(line) select is(
  (select published_at from public.courses where slug = 'a-vacio'), null,
  'el cliente no puede fijar published_at');

update public.courses set status = 'published' where slug = 'a-course';
insert into _tap(line) select ok(
  (select status = 'published' and published_at is not null from public.courses where slug = 'a-course'),
  'publicar registra la fecha de publicacion');

delete from public.lessons where id = (select id from _ids where name = 'la');
insert into _tap(line) select throws_ok(
  format($$ delete from public.lessons where id = %L $$, (select id from _ids where name = 'lb')),
  'CP002', null, 'no se puede borrar la ultima leccion de un curso publicado');

update public.courses set status = 'draft' where slug = 'a-course';
insert into _tap(line) select is(
  (select status::text from public.courses where slug = 'a-course'), 'draft', 'despublicar vuelve a borrador');

-- Eliminar curso sin inscritos (la restriccion con inscritos se prueba en el grupo 5)
insert into _tap(line) select lives_ok(
  $$ delete from public.courses where slug = 'a-course' $$, 'el dueno elimina un curso sin inscritos');
reset role;
insert into _tap(line) select is(
  (select count(*)::int from public.lessons where id = (select id from _ids where name = 'lb')), 0,
  'eliminar el curso elimina sus lecciones');

-- Un instructor degradado pierde la edicion de sus cursos
insert into public.courses (instructor_id, category_id, slug, title, short_description)
values ((select id from _ids where name = 'inst2'), 1, 'a-degradado', 'Curso de inst2', 'x');
update public.profiles set role = 'student' where id = (select id from _ids where name = 'inst2');
select pg_temp.login_as((select id from _ids where name = 'inst2'));
update public.courses set title = 'Editado tras degradar' where slug = 'a-degradado';
reset role;
insert into _tap(line) select is(
  (select title from public.courses where slug = 'a-degradado'), 'Curso de inst2',
  'un instructor degradado no puede editar sus cursos');

insert into _tap(line) select * from finish();
