# Design

## Context

Proyecto greenfield: hoy solo existe la carpeta `openspec/`. La motivación y el alcance están en proposal.md, y los requisitos en `specs/`. Las restricciones que más pesan en el diseño:

- La autorización **debe** cumplirse en la base de datos (RLS). La UI solo refleja permisos, no los garantiza. Cualquier usuario autenticado puede llamar a la API de Supabase directamente con la `anon key`.
- RLS filtra **filas**, no columnas. Varios requisitos piden que una misma fila sea pública en parte y privada en parte (por ejemplo, el título de una lección es público y su contenido no), y eso condiciona el modelo de datos.

## Goals / Non-Goals

**Goals:**
- Que cada regla de "quién puede qué" de las specs tenga una política RLS, un constraint o un trigger que la haga cumplir, y una prueba automatizada contra la base.
- Un modelo de datos que soporte después pagos, progreso y certificados sin rediseñar las tablas actuales.
- Migraciones SQL versionadas y reproducibles desde cero.

**Non-Goals:**
- Escala o rendimiento más allá de un MVP (cientos de cursos, miles de usuarios).
- Internacionalización: la UI queda solo en español.
- Panel de admin completo: solo la gestión del rol instructor.

## Decisions

### D1. Next.js App Router con Server Components y Server Actions
Las páginas leen datos en Server Components y las mutaciones van por Server Actions, usando `@supabase/ssr` con la sesión en cookies. Un `middleware.ts` refresca la sesión y protege las rutas `/instructor/*`, `/admin/*`, `/learn/*` y `/my-courses`.
- **Por qué**: el catálogo y la ficha se renderizan en el servidor (SEO para un catálogo público) y no hace falta una API REST propia, porque Supabase ya es la API.
- **Alternativa descartada**: SPA con un backend Express aparte. Agrega una capa por mantener sin aportar valor, porque la autorización ya vive en RLS.
- **Importante**: el middleware solo mejora la UX (redirige antes). La seguridad real está en RLS.

### D2. Un solo rol por usuario en `profiles.role`
Se usa un enum `user_role` con los valores `student | instructor | admin`, en una columna de `profiles` (relación 1:1 con `auth.users`). El instructor es un superconjunto del estudiante: también puede inscribirse en cursos ajenos.
- **Por qué**: los requisitos no piden que alguien tenga varios roles a la vez, y una columna simplifica todas las políticas.
- **Alternativa descartada**: una tabla `user_roles` N:M, que agrega joins en cada política sin que lo pida ningún requisito actual. Si el día de mañana hace falta, la migración es directa.
- **Alternativa descartada**: guardar el rol en los JWT custom claims. Es más rápido de evaluar, pero un cambio de rol no se refleja hasta que se refresca el token, y el spec exige que la degradación sea efectiva en la siguiente navegación.

### D3. El rol solo cambia vía una función del admin
- El trigger `on_auth_user_created` (con `SECURITY DEFINER`) crea el `profile` con `role = 'student'` y **ignora** cualquier rol que venga en `raw_user_meta_data`.
- Privilegios por columna: `REVOKE UPDATE ON profiles FROM authenticated` seguido de `GRANT UPDATE (display_name, bio)`. Así el usuario edita su perfil, pero la columna `role` no es actualizable desde la API aunque la política RLS permita la fila.
- El cambio de rol se hace con la RPC `set_instructor_role(target_user uuid, enabled boolean)` (`SECURITY DEFINER`), que verifica `is_admin()` y solo alterna entre `student` e `instructor`. No existe ninguna ruta en la app para otorgar `admin`.
- **Por qué**: combina dos defensas independientes (privilegios de columna más una RPC con verificación). Una política RLS de UPDATE sola no puede impedir que el usuario cambie *una columna específica* de su propia fila.

### D4. Funciones auxiliares de autorización
Se crean `is_admin()`, `is_instructor()`, `owns_course(course_id)`, `is_enrolled(course_id)` y `is_active_instructor(user_id)`, todas `STABLE`, `SECURITY DEFINER` y con `SET search_path = ''`.
- **Por qué**: las políticas leen mejor (`using (owns_course(course_id))`), se evita la recursión de RLS (una política sobre `courses` que consulta `enrollments`, cuya política consulta `courses`...) y Postgres puede cachear el resultado por sentencia. Dentro de ellas se usa `(select auth.uid())` para que se evalúe una vez y no por fila.

### D5. Separar `lessons` de `lesson_contents`
- `lessons (id, course_id, title, position)`: legible por cualquiera si el curso es visible (temario público de la ficha).
- `lesson_contents (lesson_id PK/FK, body_markdown, video_url)`: legible solo si `owns_course(...)` o `is_enrolled(...)`.
- **Por qué**: es la forma más simple de que RLS proteja el contenido sin dejar de exponer el temario (spec course-catalog, ficha de detalle, y course-enrollment, acceso al contenido).
- **Alternativa descartada**: una vista pública con solo los títulos sobre una tabla privada. Funciona, pero las vistas en Postgres se ejecutan por defecto con los permisos de su dueño y es fácil abrir un hueco por error. Con dos tablas, cada una con su RLS, el modelo queda explícito.

### D6. Visibilidad de cursos en una sola política
La política SELECT de `courses` permite ver una fila cuando se cumple cualquiera de estas condiciones:
1. `status = 'published' AND is_active_instructor(instructor_id)`: catálogo público, que oculta los cursos de un instructor degradado.
2. `owns_course(id)`: el instructor ve sus borradores.
3. `is_enrolled(id)`: un inscrito sigue viendo un curso despublicado en "Mis cursos".

La ficha pública (`/courses/[slug]`) filtra además `status = 'published'` en la consulta, para que un inscrito no vea como "ficha" un curso despublicado (spec course-catalog: un curso no publicado responde como inexistente).

### D7. Invariantes de negocio con constraints y triggers, no solo en la app
| Regla (spec) | Mecanismo |
|---|---|
| Una inscripción por usuario y curso | `UNIQUE (user_id, course_id)` en `enrollments` |
| No inscribirse en borrador ni en un curso propio | `WITH CHECK` de la política INSERT de `enrollments` |
| No eliminar un curso con inscritos | FK `enrollments.course_id ... ON DELETE RESTRICT` |
| Publicar requiere al menos una lección | Trigger `BEFORE UPDATE` en `courses` |
| No borrar la última lección de un curso publicado | Trigger `BEFORE DELETE` en `lessons` |
| Una reseña por usuario y curso, rating 1 a 5, comentario de 2000 caracteres o menos | `UNIQUE` y `CHECK` en `reviews` |
| URL de video solo de YouTube o Vimeo | `CHECK` con regex en `lesson_contents.video_url` y validación Zod en el formulario |
| `updated_at` del curso cambia al editar el curso o sus lecciones | Triggers en `courses`, `lessons` y `lesson_contents` |

- **Por qué**: si una regla vive solo en un Server Action, cualquiera puede saltársela llamando a la API de Supabase. En la app solo se repite la validación para dar mejores mensajes de error.

### D8. Promedio de reseñas con una vista `security_invoker`
`catalog_courses` es una vista con `security_invoker = true` que une `courses` con `profiles` y `categories`, y agrega `round(avg(rating), 1)` y `count(*)` desde `reviews`. El catálogo, la ficha y el panel del instructor la consultan.
- **Por qué**: el promedio siempre queda consistente con las reseñas existentes (lo exige el spec course-reviews) sin lógica de sincronización. Con `security_invoker` la vista respeta el RLS de quien consulta.
- **Alternativa descartada**: columnas `rating_avg` y `reviews_count` desnormalizadas, mantenidas por trigger. Son más rápidas a gran escala, pero introducen riesgo de inconsistencia. Queda como optimización futura si el catálogo crece.

### D9. Búsqueda con `ILIKE` sobre título y descripción corta
- **Por qué**: cumple el spec (sin distinguir mayúsculas y por coincidencia de texto) con cero configuración.
- **Alternativa para después**: full-text search de Postgres con configuración `spanish` (maneja plurales y tildes) e índice GIN. Se puede cambiar sin modificar el spec.

### D10. Paginación por offset, ordenada por `published_at DESC, id DESC`
El desempate por `id` evita que se repitan u omitan cursos entre páginas cuando dos comparten fecha (spec course-catalog, paginación). El tamaño de página es 12.

### D11. Categorías como tabla semilla de solo lectura
La tabla `categories (id, slug, name)` se llena en `supabase/seed.sql` con SEO, Paid Ads, Social Media, Email Marketing, IA Generativa, Automatización y Analítica. La política SELECT es pública y no hay políticas de escritura, así que solo se modifica por migración.

### D12. Pruebas de seguridad con pgTAP
`supabase test db` ejecuta pruebas pgTAP que simulan cada rol (`set local role authenticated` con un `request.jwt.claims` distinto) y verifican cada escenario de "intenta... y el sistema rechaza" de las specs.
- **Por qué**: las políticas RLS son el código más crítico del sistema y el más difícil de probar desde la UI. Probarlas en la base es lo estándar en proyectos con Supabase.
- La UI se valida con Vitest (esquemas Zod y utilidades) y con un recorrido manual de punta a punta descrito en tasks.md.

### D13. Estructura del proyecto
```
app/
  (public)/            catálogo, ficha de curso, login, registro
  my-courses/          mis cursos
  learn/[courseId]/[lessonId]/   visor de lecciones
  instructor/          panel, editor de curso y lecciones
  admin/users/         gestión del rol instructor
lib/supabase/          clientes server/browser y middleware
lib/validation/        esquemas Zod
supabase/migrations/   SQL versionado
supabase/tests/        pruebas pgTAP
supabase/seed.sql      categorías y datos de demo
```
Estilos con Tailwind CSS. Los slugs de curso se generan a partir del título y son únicos.

## Risks / Trade-offs

- [Error en una política RLS que expone contenido privado] → pgTAP con un caso por cada escenario de acceso negado, y ejecutar `supabase db lint` y el Security Advisor de Supabase antes de cada despliegue.
- [Una función `SECURITY DEFINER` mal escrita escala privilegios] → `SET search_path = ''`, nombres calificados con esquema (`public.profiles`), `REVOKE EXECUTE ... FROM public` y `GRANT` solo a `authenticated`.
- [El promedio vía vista se vuelve lento con muchas reseñas] → índice en `reviews(course_id)`. Si hace falta, migrar a columnas desnormalizadas (D8) sin cambiar el spec.
- [Supabase CLI local requiere Docker Desktop en Windows] → usar un proyecto Supabase remoto de desarrollo con `supabase link` y `supabase db push`. Las pruebas pgTAP también corren contra él.
- [Confirmación de email: el spec asume sesión inmediata al registrarse] → se deshabilita la confirmación de email en el MVP y se revisa antes de producción.
- [Offset pagination degrada en páginas muy profundas] → aceptable a escala de MVP. Se puede cambiar a paginación por keyset sin cambiar el spec.

## Migration Plan

1. Crear el proyecto Supabase (local o remoto de desarrollo) y aplicar las migraciones en orden.
2. Cargar `seed.sql` (categorías).
3. Crear tu usuario desde la app y promoverte a admin una única vez con SQL en el editor de Supabase: `update public.profiles set role = 'admin' where id = '<tu-uuid>';`.
4. Desplegar Next.js (Vercel u otro) con las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Rollback: al ser un despliegue inicial, se revierte el despliegue de la app y se recrea la base desde las migraciones.

## Open Questions

- ¿Hosting definitivo (Vercel o self-hosted)? No afecta los specs ni las tareas del MVP.
- ¿Lista final de categorías? Se ajusta en `seed.sql` sin cambiar el diseño.
