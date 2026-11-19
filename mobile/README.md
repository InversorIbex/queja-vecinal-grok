# QuejasVecinales — cliente Flutter nativo

App **nativa** iOS + Android (no WebView / PWA). Comparte el mismo backend **Supabase** que la web Next.js del monorepo: auth, quejas, votos, comentarios y reputación quedan sincronizados.

UI 100 % en español. Marca: **QuejasVecinales**.

## Requisitos

- Flutter **3.24+** (`flutter doctor`)
- Xcode (iOS) / Android Studio SDK (Android)
- Opcional: proyecto Supabase con las migraciones de `../supabase/migrations/` (rama web) o las del monorepo cuando existan

## Arranque rápido (modo demo)

Sin claves (usa `assets/env/default.env`) la app arranca con datos locales (mismas semillas conceptuales que la web):

```bash
cd mobile
flutter pub get
flutter run
```

Para conectar Supabase: copia `.env.example` → `assets/env/.env` (gitignored) y rellena las claves.

Verás un banner ámbar: **Modo demo**. Ideal para probar onboarding, mapa + círculo 10 km, feed, votos/comentarios geofenceados, perfil y reputación.

## Conectar a Supabase (sync real con la web)

1. Usa el mismo proyecto Supabase que la web (`https://sxvuovnetndhtfrtgenc.supabase.co` u otro).
2. Aplica migraciones: ver [`../supabase/README.md`](../supabase/README.md) (SQL Editor o `supabase db push`). Sin service role en CI no hay push automático.
3. `cp .env.example assets/env/.env` y rellena la **publishable/anon key** (nunca la subas al git):

```env
SUPABASE_URL=https://sxvuovnetndhtfrtgenc.supabase.co
SUPABASE_ANON_KEY=sb_publishable_…   # o legacy anon jwt
```

4. En el dashboard Supabase activa **Anonymous sign-in** (y opcionalmente Email / Google).
5. Redirect OAuth Google: `io.supabase.quejasvecinales://login-callback/`
6. `flutter run` — los datos son los mismos que ve la web.

### Cloudinary (fotos)

```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_UPLOAD_PRESET=...   # unsigned
```

Sin Cloudinary, las fotos se comprimen (≤800 KB) y se guardan como path local / data URL (aviso en UI).

## Funcionalidades

| Área | Detalle |
|------|---------|
| Auth | Anónima + email/password + Google (Supabase). Nick `Vecino_XXXX` local |
| Crear queja | Título, descripción, categoría, destino admin, ≤4 fotos, mapa + círculo 10 km |
| Geofence | Haversine cliente ≤10 km al votar/comentar; servidor PostGIS cuando hay Supabase |
| Feed / Mapa | Lista filtrable + pines OSM (`flutter_map`) |
| Perfil | Reputación Novato→Experto Vecinal, seguir quejas, tema claro/oscuro |
| Push | Stub FCM (`PushService`). Ver abajo |
| Orientación | Portrait + landscape (shell adaptativo ≥900 px) |
| Onboarding | 3 pantallas (voz local, 10 km, reputación) |
| Deep links | `quejasvecinales://quejas/<id>` y `https://quejasvecinales.app/quejas/<id>` |
| Share | `share_plus` con URL de la queja |

## Push nativas (FCM)

Por defecto `FCM_ENABLED=false` y `PushService` opera en **stub** (no crashea sin `google-services.json`).

Para activar:

```bash
dart pub add firebase_core firebase_messaging
flutterfire configure
```

Luego `FCM_ENABLED=true` en `.env` y sustituye el bloque stub en `lib/services/push_service.dart` por la inicialización real de `FirebaseMessaging`.

## Análisis

```bash
flutter analyze
flutter test
```

## Estructura

```
lib/
  main.dart / app.dart
  config/          # env, theme, constants
  models/
  services/        # geo, demo_store, supabase repo, auth, photos, push
  providers/       # AppState
  screens/         # onboarding, feed, map, create, detail, profile, auth
  widgets/         # geofence_map, complaint_card, demo_banner
```

## Relación con la web

- **Misma fuente de verdad:** tablas `complaints`, `votes`, `comments`, `profiles` en Supabase.
- En demo, cada cliente tiene su store en memoria (no hay sync). Con claves, móvil y web ven lo mismo.
- Las migraciones SQL viven en el monorepo (`supabase/migrations/`) junto a la app Next.js.
