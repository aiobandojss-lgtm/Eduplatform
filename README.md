# Plataforma de cursos de marketing digital e IA

Plataforma estilo Udemy con roles estudiante, instructor y admin. Construida con Next.js (App Router) y Supabase, con toda la autorización aplicada mediante Row Level Security.

La planificación vive en `openspec/` (ver `openspec/changes/create-course-platform/`).

## Requisitos

- **Node 24** (fijado en `.node-version`). Con [fnm](https://github.com/Schniz/fnm) se activa solo al entrar a la carpeta del proyecto.
- Una cuenta en [supabase.com](https://supabase.com) con un proyecto de desarrollo.
- El CLI de Supabase **no** se instala globalmente: viene como dependencia del proyecto y se usa con `npx supabase`.

## Puesta en marcha

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Configurar las variables de entorno:
   ```bash
   cp .env.example .env.local
   ```
   Completar `.env.local` con la URL y la **anon key** del proyecto (*Project Settings → API*). Nunca usar la `service_role` key en la app.
3. En el panel de Supabase, desactivar *Authentication → Sign In / Providers → Email → Confirm email* (el MVP inicia sesión inmediatamente al registrarse).
4. Conectar el CLI con el proyecto remoto (comandos interactivos):
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   ```
5. Aplicar las migraciones y los datos semilla:
   ```bash
   npx supabase db push --include-seed
   ```
6. Levantar la app:
   ```bash
   npm run dev
   ```
   Abrir http://localhost:3000

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm run test:db` | Pruebas de seguridad RLS (pgTAP) contra la base vinculada, sin Docker |
