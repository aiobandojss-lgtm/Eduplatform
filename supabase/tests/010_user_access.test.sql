-- Spec user-access: registro con rol forzado, perfil editable sin rol, asignacion de instructor por admin
insert into _tap(line) select plan(17);

create temp table _ids (name text primary key, id uuid) on commit drop;
grant select on _ids to public;

insert into _ids values
  ('ana',   pg_temp.create_user('ana@test.local', '{"display_name":"Ana","role":"admin"}')),
  ('beto',  pg_temp.create_user('beto@test.local')),
  ('admin', pg_temp.create_user('admin@test.local'));

-- El primer admin se crea por SQL (Migration Plan del design)
update public.profiles set role = 'admin' where id = (select id from _ids where name = 'admin');

-- 2.1 Registro: rol forzado a student
insert into _tap(line) select is(
  (select role::text from public.profiles where id = (select id from _ids where name = 'ana')),
  'student', 'registro con role=admin en metadata queda como student');
insert into _tap(line) select is(
  (select display_name from public.profiles where id = (select id from _ids where name = 'ana')),
  'Ana', 'display_name se toma de los metadatos');
insert into _tap(line) select is(
  (select display_name from public.profiles where id = (select id from _ids where name = 'beto')),
  'beto', 'sin display_name se usa la parte local del email');

-- 2.2 Perfil: editar nombre y bio propios, nunca el rol
select pg_temp.login_as((select id from _ids where name = 'ana'));

insert into _tap(line) select lives_ok(
  $$ update public.profiles set display_name = 'Ana Maria', bio = 'Growth marketer'
     where id = (select id from _ids where name = 'ana') $$,
  'usuario edita su nombre y bio');
insert into _tap(line) select is(
  (select display_name from public.profiles where id = (select id from _ids where name = 'ana')),
  'Ana Maria', 'el nombre editado persiste');
insert into _tap(line) select throws_ok(
  $$ update public.profiles set role = 'admin' where id = (select id from _ids where name = 'ana') $$,
  '42501', null, 'usuario no puede cambiar su propio rol');
insert into _tap(line) select throws_ok(
  $$ insert into public.profiles (id, display_name) values (gen_random_uuid(), 'x') $$,
  '42501', null, 'usuario no puede insertar perfiles directamente');

update public.profiles set display_name = 'hackeado' where id = (select id from _ids where name = 'beto');
insert into _tap(line) select is(
  (select display_name from public.profiles where id = (select id from _ids where name = 'beto')),
  'beto', 'usuario no puede editar el perfil de otro');
insert into _tap(line) select is(public.is_admin(), false, 'is_admin() es false para un estudiante');

select pg_temp.login_anon();
insert into _tap(line) select ok(
  (select count(*) from public.profiles where id in (select id from _ids)) = 3,
  'visitante sin sesion puede leer perfiles publicos');

-- 2.3 Solo el admin otorga o retira el rol instructor
select pg_temp.login_as((select id from _ids where name = 'admin'));
insert into _tap(line) select is(public.is_admin(), true, 'is_admin() es true para el admin');
insert into _tap(line) select is(
  public.set_instructor_role((select id from _ids where name = 'ana'), true)::text,
  'instructor', 'admin promueve a instructor');
insert into _tap(line) select is(
  public.set_instructor_role((select id from _ids where name = 'beto'), false)::text,
  'student', 'admin puede dejar como student');
insert into _tap(line) select throws_ok(
  format('select public.set_instructor_role(%L, false)', (select id from _ids where name = 'admin')),
  '42501', null, 'no se puede cambiar el rol de un admin');

select pg_temp.login_as((select id from _ids where name = 'beto'));
insert into _tap(line) select throws_ok(
  format('select public.set_instructor_role(%L, true)', (select id from _ids where name = 'beto')),
  '42501', null, 'estudiante no puede asignar roles');

select pg_temp.login_as((select id from _ids where name = 'ana'));
insert into _tap(line) select throws_ok(
  format('select public.set_instructor_role(%L, true)', (select id from _ids where name = 'beto')),
  '42501', null, 'instructor no puede asignar roles');

select pg_temp.login_anon();
insert into _tap(line) select throws_ok(
  format('select public.set_instructor_role(%L, true)', (select id from _ids where name = 'beto')),
  '42501', null, 'visitante sin sesion no puede invocar la funcion');

insert into _tap(line) select * from finish();
