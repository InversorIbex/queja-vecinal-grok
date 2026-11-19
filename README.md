# QuejasVecinales

Plataforma **web + app nativa** para reportar problemas del barrio (baches, farolas, basura…).  
UI 100 % en español. Marca: **QuejasVecinales**.

**Una sola fuente de verdad:** Supabase (Auth + Postgres/PostGIS). Lo que haces en el móvil nativo aparece en la web (y al revés).

## Clientes

| Cliente | Ruta | Notas |
|---------|------|--------|
| **Web / PWA** | raíz (Next.js) | APIs + shell adaptativo |
| **Móvil nativo** | [`mobile/`](mobile/) | Flutter iOS + Android — **no** es WebView/PWA |

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

## Arranque — Flutter

```bash
cd mobile
cp .env.example .env
flutter pub get
flutter run
```

Sin `SUPABASE_URL` / `SUPABASE_ANON_KEY` → **modo demo**. Guía: [`mobile/README.md`](mobile/README.md).

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

## Supabase + PostGIS

1. Crea un proyecto Supabase.
2. SQL Editor → ejecuta `supabase/migrations/001_init.sql`.
3. Web (`.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

4. Flutter (`mobile/.env`):

```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

5. Auth: Anonymous + Email + Google (opcional). Realtime en `complaints`, `votes`, `comments`.

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

Conecta el repo, define las env vars del `.env.example` y despliega.  
Web y Flutter comparten el mismo Supabase.
