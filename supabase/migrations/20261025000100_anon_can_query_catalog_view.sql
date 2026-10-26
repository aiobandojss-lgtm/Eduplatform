-- catalog_courses (security_invoker) cuenta inscritos con una subconsulta a enrollments.
-- Sin privilegio SELECT, un visitante sin sesion recibia "permission denied" y el catalogo fallaba.
-- No expone datos: ninguna politica RLS de enrollments aplica a anon, asi que ve 0 filas.
grant select on public.enrollments to anon;
