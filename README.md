# QuejasVecinales

Plataforma **web + app nativa** para reportar problemas del barrio (baches, farolas, basura…).  
UI 100 % en español. Marca: **QuejasVecinales**.

**Una sola fuente de verdad:** Supabase (Auth + Postgres/PostGIS). Lo que haces en el móvil nativo aparece en la web (y al revés).

## Clientes

| Cliente | Ruta | Notas |
|---------|------|--------|
| **Web / PWA** | raíz (Next.js) | APIs + shell adaptativo |
| **Móvil nativo** | [`mobile/`](mobile/) | Flutter iOS + Android — **no** es WebView/PWA |

## Secretos (no commitear)

Nombres canónicos (Cursor Secrets / hosting / Flutter):

| Variable | Uso |
|----------|-----|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_ANON_KEY` | Clave publishable / anon |

**Nunca** subas claves reales al repo. Solo placeholders en `*.env.example`.

### Web (Next.js) — local

```bash
cp .env.example .env.local
```

Define las canónicas **y** los espejos del navegador:

```env
SUPABASE_URL=https://sxvuovnetndhtfrtgenc.supabase.co
SUPABASE_ANON_KEY=your_publishable_or_anon_key
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
```

`NEXT_PUBLIC_*` **no** se declaran como Cursor App Secrets (reservados); usa `SUPABASE_URL` / `SUPABASE_ANON_KEY` ahí. `next.config.ts` mapea canónicas → `NEXT_PUBLIC_*` en build.

### Móvil (Flutter)

```bash
cd mobile
cp .env.example assets/env/.env   # gitignored
flutter pub get
flutter run
```

Sin claves → **modo demo** (`assets/env/default.env`). Guía: [`mobile/README.md`](mobile/README.md).

### Cursor / deploy

1. Añade `SUPABASE_URL` y `SUPABASE_ANON_KEY` en Cursor Secrets (o Vercel env).
2. En Vercel, define también `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` con los mismos valores.
3. Opcional servidor: `SUPABASE_SERVICE_ROLE_KEY` (solo server; nunca en móvil ni `NEXT_PUBLIC_`).

## Experiencia dual (móvil ↔ web)

| | Móvil nativo (Flutter) | Web / escritorio |
|---|---|---|
| Navegación | Bottom nav + FAB «Subir Queja» | Sidebar + CTA |
| Orientación | Portrait y landscape | Layout ancho (mapa + lista) |
| Datos | Mismo backend Supabase | Idem |
| Offline ligero | — | Service worker (`/sw.js`) |

## Arranque — web

```bash
cp .env.example .env.local
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Sin secretos → **modo demo**. Admin: `/admin` con secreto `demo-admin`.

## Reglas de negocio

- Geolocalización obligatoria al **crear**, **votar** y **comentar**.
- Distancia máxima **10 km** (Haversine en cliente + PostGIS/`within_10km` en servidor).
- Quejas nuevas en `pending` hasta moderación.
- Nick anónimo tipo `Vecino_4821` si no hay sesión.
- Categorías: Baches y carreteras, Mobiliario urbano, Parques y jardines, Limpieza, Iluminación, Señales, Otros.
- Destinos: Ayuntamiento / Provincia / Comunidad / Estado.

## Stack

- **Web:** Next.js 15 + TypeScript + Tailwind + Framer Motion  
- **Móvil:** Flutter (iOS + Android)  
- Supabase (Auth, Postgres + PostGIS, Realtime opcional)  
- Cloudinary + compresión de fotos  
- Mapas OSM (Leaflet web / flutter_map móvil)  
- Tipografía: **Fraunces** + **Manrope**

## Aplicar migraciones Supabase

Ver [`supabase/README.md`](supabase/README.md). Sin service role en CI no hay `db push` automático.

1. SQL Editor → `supabase/migrations/001_init.sql` (y opcional `002_seed_demo.sql`).
2. O CLI: `npx supabase link --project-ref sxvuovnetndhtfrtgenc` luego `npx supabase db push`.
3. Auth: Anonymous + Email + Google (opcional). Realtime en `complaints`, `votes`, `comments`.

## Cloudinary / Web Push

Ver `.env.example`. Sin claves → stubs / placeholders con aviso en UI.

## Scripts (web)

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo |
| `npm run build` | Build producción |
| `npm start` | Servir build |
| `npm run lint` | ESLint |

## Estructura

```
src/               # Next.js App Router + API
mobile/            # Cliente Flutter nativo
supabase/migrations/
public/sw.js       # PWA + push
```

## Deploy (Vercel)

Conecta el repo, define las env vars del `.env.example` (incluidos espejos `NEXT_PUBLIC_*`) y despliega.  
Web y Flutter comparten el mismo Supabase.
