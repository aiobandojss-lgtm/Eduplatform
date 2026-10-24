-- Spec course-reviews: quien puede resenar, unicidad, rangos, edicion por el autor y promedio
insert into _tap(line) select plan(14);

create temp table _ids (name text primary key, id uuid) on commit drop;
grant select, insert on _ids to public;

insert into _ids values
  ('inst', pg_temp.create_user('r-inst@test.local')),
  ('stu',  pg_temp.create_user('r-stu@test.local')),
  ('stu2', pg_temp.create_user('r-stu2@test.local')),
  ('out',  pg_temp.create_user('r-out@test.local'));
update public.profiles set role = 'instructor' where id = (select id from _ids where name = 'inst');

with x as (
  insert into public.courses (instructor_id, category_id, slug, title, short_description)
  values ((select id from _ids where name = 'inst'), 1, 'r-course', 'Curso a resenar', 'x')
  returning id)
insert into _ids select 'course', id from x;
insert into public.lessons (course_id, title) values ((select id from _ids where name = 'course'), 'L1');
update public.courses set status = 'published' where id = (select id from _ids where name = 'course');
insert into public.enrollments (user_id, course_id)
select id, (select id from _ids where name = 'course') from _ids where name in ('stu', 'stu2');

-- Crear
select pg_temp.login_as((select id from _ids where name = 'stu'));
insert into _tap(line) select lives_ok(
  format($$ insert into public.reviews (course_id, user_id, rating, comment) values (%L, %L, 5, 'Excelente') $$,
         (select id from _ids where name = 'course'), (select id from _ids where name = 'stu')),
  'un inscrito deja una resena');
insert into _tap(line) select throws_ok(
  format($$ insert into public.reviews (course_id, user_id, rating) values (%L, %L, 3) $$,
         (select id from _ids where name = 'course'), (select id from _ids where name = 'stu')),
  '23505', null, 'no se crea una segunda resena del mismo estudiante');

select pg_temp.login_as((select id from _ids where name = 'stu2'));
insert into _tap(line) select throws_ok(
  format($$ insert into public.reviews (course_id, user_id, rating) values (%L, %L, 0) $$,
         (select id from _ids where name = 'course'), (select id from _ids where name = 'stu2')),
  '23514', null, 'calificacion 0 rechazada');
insert into _tap(line) select throws_ok(
  format($$ insert into public.reviews (course_id, user_id, rating) values (%L, %L, 6) $$,
         (select id from _ids where name = 'course'), (select id from _ids where name = 'stu2')),
  '23514', null, 'calificacion 6 rechazada');
insert into _tap(line) select throws_ok(
  format($$ insert into public.reviews (course_id, user_id, rating, comment) values (%L, %L, 4, repeat('x', 2001)) $$,
         (select id from _ids where name = 'course'), (select id from _ids where name = 'stu2')),
  '23514', null, 'comentario de mas de 2000 caracteres rechazado');
insert into public.reviews (course_id, user_id, rating) values ((select id from _ids where name = 'course'), (select id from _ids where name = 'stu2'), 4);

select pg_temp.login_as((select id from _ids where name = 'out'));
insert into _tap(line) select throws_ok(
  format($$ insert into public.reviews (course_id, user_id, rating) values (%L, %L, 1) $$,
         (select id from _ids where name = 'course'), (select id from _ids where name = 'out')),
  '42501', null, 'un no inscrito no puede resenar');

select pg_temp.login_as((select id from _ids where name = 'inst'));
insert into _tap(line) select throws_ok(
  format($$ insert into public.reviews (course_id, user_id, rating) values (%L, %L, 5) $$,
         (select id from _ids where name = 'course'), (select id from _ids where name = 'inst')),
  '42501', null, 'el dueno no puede resenar su propio curso');

-- Promedio y lectura publica
select pg_temp.login_anon();
insert into _tap(line) select results_eq(
  format($$ select rating_avg, reviews_count from public.catalog_courses where id = %L $$, (select id from _ids where name = 'course')),
  $$ values (4.5::numeric, 2) $$,
  'el promedio de 5 y 4 es 4.5 con 2 resenas');
insert into _tap(line) select is(
  (select count(*)::int from public.reviews where course_id = (select id from _ids where name = 'course')), 2,
  'un visitante lee las resenas');

-- Edicion por el autor
select pg_temp.login_as((select id from _ids where name = 'stu'));
update public.reviews set rating = 3 where user_id = (select id from _ids where name = 'stu');
insert into _tap(line) select is(
  (select rating_avg from public.catalog_courses where id = (select id from _ids where name = 'course')), 3.5::numeric,
  'editar la resena recalcula el promedio');
insert into _tap(line) select throws_ok(
  format($$ update public.reviews set user_id = %L where user_id = %L $$,
         (select id from _ids where name = 'out'), (select id from _ids where name = 'stu')),
  '42501', null, 'el autor no puede reasignar su resena a otro usuario');

select pg_temp.login_as((select id from _ids where name = 'stu2'));
update public.reviews set rating = 1 where user_id = (select id from _ids where name = 'stu');
delete from public.reviews where user_id = (select id from _ids where name = 'stu');
reset role;
insert into _tap(line) select is(
  (select rating from public.reviews where user_id = (select id from _ids where name = 'stu')), 3::smallint,
  'otro usuario no puede editar ni eliminar una resena ajena');

select pg_temp.login_as((select id from _ids where name = 'stu'));
delete from public.reviews where user_id = (select id from _ids where name = 'stu');
insert into _tap(line) select is(
  (select count(*)::int from public.reviews where user_id = (select id from _ids where name = 'stu')), 0,
  'el autor elimina su resena');
insert into _tap(line) select is(
  (select reviews_count from public.catalog_courses where id = (select id from _ids where name = 'course')), 1,
  'el conteo se actualiza al eliminar');

insert into _tap(line) select * from finish();
