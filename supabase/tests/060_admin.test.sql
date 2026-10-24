-- Spec user-access: listado de usuarios solo para el admin
insert into _tap(line) select plan(5);

create temp table _ids (name text primary key, id uuid) on commit drop;
grant select on _ids to public;

insert into _ids values
  ('admin', pg_temp.create_user('m-admin@test.local')),
  ('stu',   pg_temp.create_user('m-buscado@test.local', '{"display_name":"Persona Buscada"}'));
update public.profiles set role = 'admin' where id = (select id from _ids where name = 'admin');

select pg_temp.login_as((select id from _ids where name = 'admin'));
insert into _tap(line) select results_eq(
  $$ select email, role::text from public.admin_list_users('M-BUSCADO@') $$,
  $$ values ('m-buscado@test.local'::text, 'student'::text) $$,
  'el admin busca por parte del email sin distinguir mayusculas');
insert into _tap(line) select is(
  (select count(*)::int from public.admin_list_users('Persona Busc')), 1,
  'el admin busca por nombre');
insert into _tap(line) select is(
  (select count(*)::int from public.admin_list_users('%')), 0,
  'el comodin % se busca de forma literal');

select pg_temp.login_as((select id from _ids where name = 'stu'));
insert into _tap(line) select throws_ok(
  $$ select * from public.admin_list_users(null) $$, '42501', null,
  'un estudiante no puede listar usuarios');

select pg_temp.login_anon();
insert into _tap(line) select throws_ok(
  $$ select * from public.admin_list_users(null) $$, '42501', null,
  'un visitante sin sesion no puede listar usuarios');

insert into _tap(line) select * from finish();
