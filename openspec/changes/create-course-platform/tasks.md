# Tasks

## 1. Setup del proyecto

- [x] 1.1 Inicializar el repositorio git con un `.gitignore` de Next.js que excluya `.env*.local`, y verificar con `git status` que no aparecen archivos de entorno
- [x] 1.2 Crear la app Next.js (App Router, TypeScript estricto, Tailwind, ESLint) en la raíz sin borrar `openspec/` ni `.claude/`, y verificar que `npm run build` y `npm run lint` pasan
- [x] 1.3 Instalar `@supabase/supabase-js`, `@supabase/ssr` y `zod`, y Vitest como dependencia de desarrollo; verificar que `npx vitest run` ejecuta sin errores
- [x] 1.4 Inicializar Supabase CLI (`supabase init`) y conectar un entorno local (Docker) o un proyecto remoto de desarrollo (`supabase link`), según la sección Riesgos de design.md; verificar con `supabase status` (local) o `supabase migration list` (remoto)
- [ ] 1.5 Crear `.env.example` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` sin valores, y documentar en `README.md` cómo levantar el proyecto; verificar que los pasos del README funcionan desde cero
- [x] 1.6 Crear los clientes Supabase server/browser en `lib/supabase/` y el `middleware.ts` que refresca la sesión; verificar que `npm run build` compila
- [x] 1.7 Crear el runner de pruebas pgTAP sin Docker (`scripts/test-db.mjs`, `supabase/tests/_helpers.sql`, `npm run test:db`) según D12; verificar que una prueba que pasa da código 0 y una que falla da código distinto de 0 indicando cuál falló

## 2. Identidad y roles (user-access)

- [x] 2.1 Migración: enum `user_role`, tabla `profiles`, trigger `on_auth_user_created` que fuerza `role = 'student'`, y privilegios de columna (D2, D3); verificar con pgTAP que un registro con `role: 'admin'` en metadata queda como `student`
- [x] 2.2 Migración: funciones `is_admin()`, `is_instructor()` e `is_active_instructor()` con `SECURITY DEFINER` y `search_path = ''` (D4), y políticas RLS de `profiles`; verificar con pgTAP que un usuario edita su `display_name` pero recibe error al actualizar `role`
- [x] 2.3 Migración: RPC `set_instructor_role(target_user, enabled)` (D3); verificar con pgTAP que un admin promueve y degrada, y que un estudiante o instructor que la invoca recibe error
- [x] 2.4 Páginas de registro, login y logout con Server Actions y validación Zod (contraseña de al menos 8 caracteres); verificar con Vitest el esquema, y a mano los escenarios de registro exitoso, email duplicado y credenciales inválidas
- [ ] 2.5 Página de perfil para editar nombre y biografía; verificar a mano que el cambio persiste tras recargar
- [x] 2.6 Protección de rutas en el middleware: `/instructor/*` solo instructor, `/admin/*` solo admin, `/my-courses` y `/learn/*` con sesión; verificar a mano que un estudiante es redirigido al abrir `/instructor`

## 3. Cursos y catálogo (course-catalog)

- [x] 3.1 Migración: tabla `categories` con política de solo lectura, y `seed.sql` con las categorías de D11; verificar con pgTAP que `authenticated` y `anon` leen las categorías pero no pueden insertar
- [x] 3.2 Migración: tabla `courses` (slug único, estado `draft | published`, `published_at`, `updated_at`), función `owns_course()` y política SELECT de D6, por ahora sin la rama de inscritos; verificar con pgTAP que `anon` ve solo cursos publicados de instructores activos y que el dueño ve sus borradores
- [x] 3.3 Migración: tablas `lessons` y `lesson_contents` separadas (D5) con sus políticas SELECT; verificar con pgTAP que `anon` lee el título de una lección de un curso publicado pero no su `lesson_contents`
- [x] 3.4 Migración: tabla `reviews` (necesaria para la vista) y vista `catalog_courses` con `security_invoker = true` (D8); verificar con pgTAP que el promedio de calificaciones 5, 4 y 4 es 4.3 y que un curso sin reseñas devuelve conteo 0
- [ ] 3.5 Página de catálogo con búsqueda `ILIKE`, filtro por categoría y paginación de 12 ordenada por `published_at DESC, id DESC` (D9, D10); verificar a mano con datos de demo cada escenario del spec course-catalog, incluidos catálogo vacío y búsqueda sin resultados
- [ ] 3.6 Ficha del curso `/courses/[slug]` con temario sin contenido, instructor con biografía, fecha de actualización y promedio; verificar a mano que un borrador devuelve 404 para quien no es dueño

## 4. Gestión de cursos por el instructor (course-authoring)

- [x] 4.1 Migración: políticas INSERT, UPDATE y DELETE de `courses` (solo instructor, solo dueño) y trigger de `updated_at`; verificar con pgTAP que un estudiante no puede insertar y que un instructor no puede modificar un curso ajeno
- [x] 4.2 Migración: políticas de escritura de `lessons` y `lesson_contents` solo para el dueño, `CHECK` de URL de YouTube o Vimeo, y triggers que actualizan `courses.updated_at`; verificar con pgTAP la escritura ajena rechazada y una URL inválida rechazada
- [x] 4.3 Migración: trigger que impide publicar sin lecciones y trigger que impide borrar la última lección de un curso publicado (D7); verificar con pgTAP ambos rechazos y una publicación válida que registra `published_at`
- [x] 4.4 Migración: RPC `reorder_lessons(course_id, lesson_ids[])` atómica que respeta RLS; verificar con pgTAP que las posiciones quedan sin repetir y que un usuario ajeno no puede reordenar
- [ ] 4.5 Panel `/instructor` con los cursos propios, su estado, número de lecciones, inscritos y promedio; verificar a mano que un instructor no ve cursos de otro
- [x] 4.6 Formulario de crear y editar curso con validación Zod (título y categoría obligatorios) y generación de slug único; verificar con Vitest el esquema y el generador de slug, incluido el caso de colisión
- [ ] 4.7 Editor de lecciones: crear, editar (markdown y URL de video), reordenar y eliminar; verificar con Vitest el validador de URL de video, y a mano el flujo completo
- [ ] 4.8 Acciones de publicar y despublicar con mensajes de error del trigger traducidos a texto legible; verificar a mano el escenario de publicar sin lecciones

## 5. Inscripción y acceso al contenido (course-enrollment)

- [x] 5.1 Migración: tabla `enrollments` con `UNIQUE (user_id, course_id)` y FK `ON DELETE RESTRICT`, función `is_enrolled()`, política INSERT que exige curso publicado y no propio, y la rama de inscritos en la política SELECT de `courses` y `lesson_contents`; verificar con pgTAP inscripción duplicada, borrador, curso propio y borrado de curso con inscritos, todos rechazados
- [ ] 5.2 Botón "Inscribirme" / "Ir al curso" en la ficha, con redirección al login y regreso a la ficha (`?next=`); verificar a mano los escenarios de visitante sin sesión e inscripción exitosa
- [ ] 5.3 Visor `/learn/[courseId]/[lessonId]` con temario lateral, contenido markdown, video embebido y navegación anterior/siguiente; verificar a mano que un no inscrito es redirigido a la ficha
- [ ] 5.4 Página "Mis cursos" ordenada por fecha de inscripción, con estado vacío; verificar a mano, y con pgTAP que un inscrito sigue leyendo `lesson_contents` después de que el curso se despublica

## 6. Reseñas (course-reviews)

- [x] 6.1 Migración: `UNIQUE (course_id, user_id)` y `CHECK` (rating de 1 a 5, comentario de 2000 caracteres o menos) en `reviews`, con políticas SELECT pública para cursos visibles, INSERT solo inscrito no dueño, y UPDATE y DELETE solo el autor; verificar con pgTAP cada escenario de rechazo del spec course-reviews
- [ ] 6.2 Formulario de reseña en la ficha (visible solo para inscritos no dueños) que se convierte en edición si ya existe una; verificar con Vitest el esquema, y a mano crear, editar y eliminar
- [ ] 6.3 Listado de reseñas en la ficha, de la más reciente a la más antigua, y "Sin reseñas" en catálogo y ficha cuando el conteo es 0; verificar a mano que el promedio se recalcula al editar una reseña

## 7. Administración de instructores

- [ ] 7.1 Página `/admin/users` con búsqueda por nombre o email y botón para otorgar o retirar el rol instructor vía `set_instructor_role`; verificar a mano la promoción, el acceso al panel en la siguiente navegación y que los cursos de un degradado desaparecen del catálogo
- [ ] 7.2 Documentar en `README.md` cómo crear el primer admin por SQL (Migration Plan de design.md); verificar siguiendo el paso en una base recién creada

## 8. Verificación integral

- [ ] 8.1 Ejecutar `npx supabase db push` (sin migraciones pendientes) seguido de `npm run test:db` y verificar que todas las pruebas pgTAP pasan
- [ ] 8.2 Ejecutar `npm run lint`, `npx tsc --noEmit`, `npx vitest run` y `npm run build`, y verificar que todos terminan sin errores
- [ ] 8.3 Recorrido de punta a punta con tres usuarios (admin, instructor, estudiante): promover, crear curso con 2 lecciones, publicar, buscarlo en el catálogo, inscribirse, ver lecciones y reseñar; verificar que el promedio aparece en el catálogo
- [ ] 8.4 Revisar `npx supabase db advisors --linked` (Security Advisor), y verificar que no reportan tablas sin RLS ni funciones `SECURITY DEFINER` con `search_path` mutable

## Workflow follow-up

- Archivar el cambio con `/opsx:archive` cuando todas las tareas estén completas y revisadas.
- Verificar que las 5 specs quedaron en `openspec/specs/` con su `## Purpose`.
