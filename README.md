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

Abre [http://localhost:3000](http://localhost:3000). Sin secretos → **modo demo**. Moderación: `/admin` con secreto `demo-admin` (en demo actúa como SUPER_ADMIN).

## Reglas de negocio

- Geolocalización obligatoria al **crear**, **votar** y **comentar**.
- Distancia máxima **10 km** (Haversine en cliente + PostGIS/`within_10km` en servidor).
- Quejas nuevas en `pending` hasta moderación.
- Nick anónimo tipo `Vecino_4821` si no hay sesión.
- Categorías (web + Flutter sincronizadas): Baches, Mobiliario, Parques, Limpieza, Iluminación, Señales, Agua/alcantarillado, Ruido, Animales/plagas, Transporte, Accesibilidad, Obras, Contenedores, Grafitis, Aparcamiento/semáforos, Contaminación, Seguridad, Playas/costa, Otros.
- Destinos: Ayuntamiento / Provincia / Comunidad / Estado.
- Moderación: rol `super_admin` (panel `/admin`) — aprobar/rechazar, quitar fotos, borrar comentarios, banear.

## Stack

- **Web:** Next.js 15 + TypeScript + Tailwind + Framer Motion  
- **Móvil:** Flutter (iOS + Android)  
- Supabase (Auth, Postgres + PostGIS, Realtime opcional)  
- Cloudinary + compresión de fotos  
- Mapas OSM (Leaflet web / flutter_map móvil)  
- Tipografía: **Fraunces** + **Manrope**

## Aplicar migraciones Supabase

Ver [`supabase/README.md`](supabase/README.md). Sin service role en CI no hay `db push` automático.

1. SQL Editor → `001_init.sql`, opcional `002_seed_demo.sql`, luego `003_categories_super_admin.sql` (categorías + `super_admin` + `banned`).
2. O CLI: `npx supabase link --project-ref sxvuovnetndhtfrtgenc` luego `npx supabase db push`.
3. Auth: Anonymous + Email + Google (opcional). Realtime en `complaints`, `votes`, `comments`.

## Cloudinary (fotos gratis)

Free tier con **unsigned upload preset** (recomendado):

1. Cuenta en [cloudinary.com](https://cloudinary.com) → Settings → Upload → **Add upload preset** (Signing mode: **Unsigned**).
2. En `.env.local` / Cursor Secrets: `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_UPLOAD_PRESET`.
3. Opcional server-side (borrar fotos): `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET`.
4. Flutter: mismas vars en `mobile/assets/env/.env`.

Sin claves → compresión cliente + data URL / placeholder (aviso en UI). Nunca commits claves.

## SUPER_ADMIN

1. Define `ADMIN_SECRET` (panel `/admin`) y opcionalmente `SUPER_ADMIN_EMAIL`.
2. Aplica `supabase/migrations/003_categories_super_admin.sql`.
3. Tras crear tu usuario en Auth:

```sql
SELECT public.promote_super_admin_by_email('tu@email.com');
```

4. En `/admin`, entra con el secreto y el mismo email. Acciones elevadas: quitar fotos, borrar comentarios, banear (`profiles.banned`).

Sin `SUPER_ADMIN_EMAIL` (demo local), el secreto admin tiene permisos de super_admin.

## Web Push

Ver `.env.example`. Sin claves → stubs.

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
