-- Escritura de resenas (spec course-reviews): solo inscritos no duenos, una por curso,
-- y solo el autor edita o elimina. La unicidad y los rangos ya son constraints de la tabla.

create policy "reviews_insert_enrolled"
  on public.reviews for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and private.is_enrolled(course_id)
    and not private.owns_course(course_id)
  );

create policy "reviews_update_author"
  on public.reviews for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "reviews_delete_author"
  on public.reviews for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- El autor solo puede cambiar calificacion y comentario, no moverla a otro curso o usuario
revoke update on public.reviews from authenticated;
grant update (rating, comment) on public.reviews to authenticated;
