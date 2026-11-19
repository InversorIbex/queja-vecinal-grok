# Supabase / PostGIS

Misma base de datos para la **web** (Next.js) y el **móvil** (Flutter en `mobile/`).

1. Crea un proyecto en [Supabase](https://supabase.com).
2. SQL Editor → ejecuta `migrations/001_init.sql` (y opcionalmente `002_seed_demo.sql`).
3. Copia URL + anon key a `mobile/.env` y a `.env.local` de la web.

Habilita Auth: Anonymous, Email y (opcional) Google OAuth.
