-- Verifica que el runner y los helpers funcionan contra la base vinculada.
insert into _tap(line) select plan(3);

insert into _tap(line) select ok(true, 'pgtap responde');

select pg_temp.login_as('00000000-0000-0000-0000-000000000001');
insert into _tap(line) select is(auth.uid(), '00000000-0000-0000-0000-000000000001'::uuid, 'login_as simula auth.uid()');

select pg_temp.login_anon();
insert into _tap(line) select is(current_user::text, 'anon', 'login_anon cambia al rol anon');

insert into _tap(line) select * from finish();
