# QuejasVecinales

Plataforma **PWA móvil + web** para reportar problemas del barrio (baches, farolas, basura…).  
UI 100 % en español. Marca: **QuejasVecinales**.

**Una sola fuente de verdad:** Supabase (Auth + Postgres/PostGIS). Lo que haces en el móvil aparece en la web (y al revés) vía API + Realtime / sync.

## Experiencia dual (móvil ↔ web)

| | Móvil (PWA) | Web / escritorio |
|---|---|---|
| Navegación | Bottom nav + FAB «Subir Queja» | Sidebar + CTA |
| Orientación | Portrait y landscape adaptados | Layout ancho (mapa + lista) |
| Datos | Mismo backend Supabase / API | Idem |
| Offline ligero | Service worker (`/sw.js`) | Mismo origen |

Manifest con `"orientation": "any"`. No es un layout móvil estirado: ≥1024 px usa shell de escritorio.

## Reglas de negocio

- Geolocalización obligatoria al **crear**, **votar** y **comentar**.
- Publicar: el punto de la queja puede estar hasta **20 km** de donde estás ahora (lo que viste durante el día, al llegar a casa).
- Votar y comentar: sigues teniendo que estar a **≤10 km** del punto.
- Quejas nuevas en `pending` hasta moderación.
- Nick anónimo tipo `Vecino_4821` si no hay sesión.
- Categorías de calle, diputación, comunidad y Estado, más «Otra cosa».
- Un filtro impide publicar insultos o tacos en la queja y en los comentarios.
- Cada queja tiene un código `QV-······` para seguirla en `/seguimiento`.
- Al aprobar, se envía sola al buzón de la administración competente (SMTP).

## Correo a la administración

En `.env.local`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu@gmail.com
SMTP_PASS=contraseña-de-aplicacion
SMTP_FROM=QuejasVecinales <tu@gmail.com>
ADMIN_NOTIFY_EMAIL=tu@gmail.com
```

Sin SMTP la queja se aprueba y el panel indica que falta el correo de salida.
Si el ayuntamiento, la diputación, la comunidad o el ministerio no están en el directorio, el administrador pega el buzón una vez y las siguientes quejas de ese territorio salen solas.

Buzones ya incluidos (publicados por la propia administración): Comunidad de Madrid, Xunta de Galicia y Diputación de A Coruña.

Ejecuta `supabase/migrations/001_init.sql` solo en un proyecto nuevo. El Supabase ya conectado usa su tabla `complaints` actual y la app se adapta a ella.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS 4 + shadcn-style UI + Framer Motion  
- Supabase (Auth, Postgres + PostGIS, Realtime opcional)  
- Cloudinary + `browser-image-compression`  
- Leaflet + GeoJSON CCAA/provincias/municipios (muestras en `/public/geojson`)  
- Web Push (VAPID; stub si faltan claves)  
- Tipografía: **Fraunces** (display) + **Manrope** (cuerpo)

## Arranque local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

**Sin secretos:** la app corre en **modo demo** (datos en memoria + seed). Verás un banner ámbar. Ideal para probar UI, mapa, votos ≤10 km y admin.

```bash
npm run build   # debe pasar
npm start
```

### Admin

1. Ve a `/admin`
2. Secreto: el valor de `ADMIN_SECRET` (en demo, si no hay `.env.local`: `demo-admin`)

## Supabase + PostGIS

1. Crea un proyecto Supabase.
2. SQL Editor → ejecuta `supabase/migrations/001_init.sql` (extensiones PostGIS, tablas, RLS, triggers).
3. Rellena en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

4. (Opcional) Auth: Anonymous + Email + Google en el dashboard.
5. Realtime: habilita publicación en `complaints`, `votes`, `comments` para sync en vivo móvil↔web.

## Cloudinary

```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
# o CLOUDINARY_UPLOAD_PRESET=...
```

Sin Cloudinary, las fotos se guardan como data URL / placeholder (aviso en UI).

## Web Push

Genera claves VAPID y configura:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

Sin ellas, `/api/push` responde en stub y el perfil lo indica claramente.

## Capas admin del mapa

Muestras simplificadas (no oficiales) en:

- `/public/geojson/ccaa-sample.geojson`
- `/public/geojson/provincias-sample.geojson`
- `/public/geojson/municipios-sample.geojson`

Sustituye por GeoJSON oficiales (IGN / datos abiertos) manteniendo `properties.name`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo |
| `npm run build` | Build producción |
| `npm start` | Servir build |
| `npm run lint` | ESLint |

## Estructura relevante

```
src/app/           # Rutas App Router + API
src/components/    # UI, mapa, quejas, admin, shell adaptativo
src/lib/           # geo, reputation, demo-store, supabase, cloudinary
supabase/migrations/
public/sw.js       # PWA + push
public/manifest.webmanifest
```

## Deploy (Vercel)

Conecta el repo, define las env vars del `.env.example` y despliega.  
La PWA y la web comparten el mismo dominio y el mismo Supabase.
