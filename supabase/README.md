# Supabase / PostGIS

Misma base de datos para la **web** (Next.js) y el **móvil** (Flutter en `mobile/`).

Proyecto de referencia (URL pública, no es secreto):

`https://sxvuovnetndhtfrtgenc.supabase.co`

## Variables de entorno

| Nombre | Dónde |
|--------|--------|
| `SUPABASE_URL` | Cursor Secrets, Flutter `mobile/assets/env/.env`, server |
| `SUPABASE_ANON_KEY` | Idem (clave publishable / anon) |
| `NEXT_PUBLIC_SUPABASE_URL` | Solo Next local / Vercel (espejo para el navegador) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Idem |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo server (admin / bypass RLS). Nunca en móvil ni git. |

No commitees claves. Placeholders en `.env.example` y `mobile/.env.example`.

## Aplicar migraciones

Sin service role en CI no hay `db push` automático. Aplícalas en el proyecto real:

### SQL Editor (sin CLI)

1. Dashboard Supabase → proyecto → **SQL Editor**.
2. Ejecuta en orden:
   - [`migrations/001_init.sql`](migrations/001_init.sql) — extensiones PostGIS, tablas, RLS, triggers, `within_10km`.
   - [`migrations/002_seed_demo.sql`](migrations/002_seed_demo.sql) — opcional.
3. **Authentication → Providers**: Anonymous, Email, (opcional) Google.
4. (Opcional) Realtime: publica `complaints`, `votes`, `comments`.

### CLI

```bash
npx supabase login
npx supabase link --project-ref sxvuovnetndhtfrtgenc
npx supabase db push
```

El access token y la service role **no** van al repositorio.

## Clientes

- Web: `cp .env.example .env.local` y rellena canónicas + espejos `NEXT_PUBLIC_*`.
- Flutter: `cp mobile/.env.example mobile/assets/env/.env` con las mismas `SUPABASE_URL` / `SUPABASE_ANON_KEY`.
