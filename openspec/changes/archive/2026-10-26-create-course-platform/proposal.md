# Proposal

## Why

Queremos lanzar una plataforma de cursos estilo Udemy enfocada en marketing digital e IA, donde la calidad del contenido esté controlada desde el origen: el administrador de la plataforma decide quién enseña. El proyecto parte de cero, así que este cambio establece la base funcional mínima de punta a punta: un instructor publica un curso, un estudiante lo encuentra, se inscribe, lo consume y lo reseña.

## What Changes

- Registro e inicio de sesión de usuarios con email y contraseña. Todo usuario nuevo es **estudiante** por defecto.
- Rol **admin** que es el único que puede otorgar o retirar el rol **instructor** (academia curada, no marketplace abierto).
- Catálogo público de cursos **publicados**, con búsqueda por texto, filtro por categoría y ficha de detalle (temario, instructor, calificación promedio).
- Panel del instructor para crear, editar, publicar y despublicar sus propios cursos, y gestionar sus lecciones (crear, editar, reordenar, eliminar).
- Inscripción gratuita de estudiantes a cursos publicados y acceso al contenido de las lecciones solo para inscritos.
- Reseñas: un estudiante inscrito puede dejar una calificación (1 a 5) y un comentario por curso, y editarla o borrarla.
- Toda la autorización se hace cumplir en la base de datos con Row Level Security (RLS) de Supabase, no solo en la UI.

Fuera de alcance en este cambio (cambios futuros): pagos y precios, video subido a storage propio (solo URL embebida), progreso por lección, certificados, cupones, preguntas al instructor y pagos a instructores.

## Capabilities

### New Capabilities
- `user-access`: registro, inicio/cierre de sesión, perfil y modelo de roles (estudiante, instructor, admin), incluida la asignación del rol instructor por el admin.
- `course-catalog`: listado público de cursos publicados, búsqueda, filtro por categoría y ficha de detalle del curso.
- `course-authoring`: creación y gestión de cursos y lecciones por su instructor dueño, incluido el ciclo borrador / publicado.
- `course-enrollment`: inscripción de estudiantes a cursos publicados y control de acceso al contenido de las lecciones.
- `course-reviews`: calificaciones y comentarios de estudiantes inscritos, y cálculo del promedio por curso.

### Modified Capabilities
<!-- Proyecto nuevo: no hay specs existentes. -->

## Impact

- **Código nuevo**: aplicación Next.js (App Router, TypeScript) en la raíz del proyecto.
- **Base de datos**: proyecto Supabase con tablas `profiles`, `categories`, `courses`, `lessons`, `enrollments`, `reviews`, políticas RLS, triggers y migraciones SQL versionadas.
- **Dependencias**: `next`, `react`, `@supabase/supabase-js`, `@supabase/ssr`, Supabase CLI para migraciones locales.
- **Configuración**: variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (sin credenciales en el código). La `service_role` key no se usa en el cliente.
- **Operación**: el primer admin se crea manualmente (SQL en Supabase) porque nadie puede autoasignarse ese rol.
