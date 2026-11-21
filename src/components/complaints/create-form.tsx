"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { motion } from "framer-motion";
import { MapPin, Upload, AlertTriangle, Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  ADMIN_LEVEL_HINTS,
  ADMIN_LEVELS,
  CATEGORIES,
  CATEGORY_GROUPS,
  MAX_PHOTO_BYTES,
  MAX_PHOTOS,
} from "@/lib/constants";
import { haversineMeters, mapsUrl } from "@/lib/geo";
import { inspectTone } from "@/lib/moderation";
import { formatDistance, getOrCreateNickname, rememberTracking } from "@/lib/utils";
import { useGeolocation } from "@/hooks/use-geolocation";
import type { AdminLevel, ComplaintCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const MiniMap = dynamic(() => import("@/components/map/mini-map"), { ssr: false });

interface RoutePreview {
  territory?: {
    municipio?: string;
    provincia?: string;
    comunidad?: string;
    calle?: string;
    barrio?: string;
  };
  road?: { ref?: string; name?: string; owner?: AdminLevel; pk?: string | null } | null;
  recipient?: { name?: string; known?: boolean; web?: string | null };
  hint?: string;
}

export function CreateComplaintForm() {
  const router = useRouter();
  const { position, error: geoError, loading: geoLoading, usingDemo, refresh } =
    useGeolocation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ComplaintCategory>("baches_carreteras");
  const [categoryDetail, setCategoryDetail] = useState("");
  const [adminLevel, setAdminLevel] = useState<AdminLevel>("ayuntamiento");
  const [levelTouched, setLevelTouched] = useState(false);
  const [reporterEmail, setReporterEmail] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [nickname, setNickname] = useState("Vecino");
  const [submitting, setSubmitting] = useState(false);
  const [routePreview, setRoutePreview] = useState<RoutePreview | null>(null);
  const [checkingLand, setCheckingLand] = useState(false);
  const pinReq = useRef(0);

  const tone = inspectTone([title, description, categoryDetail].filter(Boolean).join("\n"));
  const meta = CATEGORIES[category];

  useEffect(() => {
    setNickname(getOrCreateNickname());
  }, []);

  const spot = pin;
  const pinDistance = position && spot ? haversineMeters(position, spot) : null;

  useEffect(() => {
    if (!spot) {
      setRoutePreview(null);
      return;
    }
    const timer = setTimeout(() => {
      const qs = new URLSearchParams({
        lat: String(spot.lat),
        lng: String(spot.lng),
        level: adminLevel,
        category,
        manual: levelTouched ? "1" : "0",
      });
      void fetch(`/api/geo/resolve?${qs}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: RoutePreview | null) => {
          setRoutePreview(data);
          if (!levelTouched && data?.road?.owner) setAdminLevel(data.road.owner);
        })
        .catch(() => setRoutePreview(null));
    }, 350);
    return () => clearTimeout(timer);
  }, [spot, adminLevel, category, levelTouched]);

  async function placePin(lat: number, lng: number) {
    const req = ++pinReq.current;
    setCheckingLand(true);
    try {
      const res = await fetch(`/api/geo/land?lat=${lat}&lng=${lng}`);
      const data = (await res.json().catch(() => null)) as { onLand?: boolean; error?: string } | null;
      if (req !== pinReq.current) return;
      if (data?.onLand === false) {
        toast.error(data.error ?? "Ese punto está en el agua. La queja tiene que ir en tierra.");
        return;
      }
      setLevelTouched(false);
      setPin({ lat, lng });
    } catch {
      if (req === pinReq.current) {
        setLevelTouched(false);
        setPin({ lat, lng });
      }
    } finally {
      if (req === pinReq.current) setCheckingLand(false);
    }
  }

  function chooseCategory(next: ComplaintCategory) {
    setCategory(next);
    if (!levelTouched && !routePreview?.road?.owner) setAdminLevel(CATEGORIES[next].defaultLevel);
  }

  async function onFiles(files: FileList | null) {
    if (!files) return;
    const remaining = MAX_PHOTOS - photos.length;
    const slice = Array.from(files).slice(0, remaining);
    const uploaded: string[] = [];
    for (const file of slice) {
      const compressed = await imageCompression(file, {
        maxSizeMB: MAX_PHOTO_BYTES / (1024 * 1024),
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      });
      const dataUrl = await imageCompression.getDataUrlFromFile(compressed);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al subir foto");
        continue;
      }
      if (data.demo) toast.message(data.message ?? "La foto se queda con la queja.");
      uploaded.push(data.url);
    }
    setPhotos((current) => [...current, ...uploaded]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!position || !spot) {
      toast.error("Necesitamos tu ubicación y el punto de la queja en el mapa.");
      return;
    }
    if (!tone.ok) {
      toast.error(tone.message);
      return;
    }
    if (photos.length < 1) {
      toast.error("La queja necesita al menos una foto.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          category_detail: categoryDetail,
          admin_level: adminLevel,
          level_manual: levelTouched,
          lat: spot.lat,
          lng: spot.lng,
          user_lat: position.lat,
          user_lng: position.lng,
          photos,
          anonymous_nickname: nickname,
          reporter_email: reporterEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo enviar");
        return;
      }
      rememberTracking({
        code: data.complaint.tracking_code,
        title: data.complaint.title,
        at: data.complaint.created_at,
      });
      try {
        new BroadcastChannel("qv-sync").postMessage({ t: Date.now() });
      } catch {
        /* ignore */
      }
      toast.success(data.message ?? "Queja enviada a revisión");
      router.push(`/seguimiento/${data.complaint.tracking_code}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-6xl gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.9fr)] lg:items-start"
      )}
    >
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="order-2 space-y-5 lg:order-1"
      >
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-sky-700 to-orange-500 p-6 text-white shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
            Dos minutos. Tu calle.
          </p>
          <h1 className="font-display mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Cuéntalo y lo llevamos a quien puede arreglarlo
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-sky-50">
            Sin registro. Marca el punto en el mapa, aunque te lo haya contado alguien que está lejos.
            Un administrador lo lee y, si procede, se envía a quien puede arreglarlo.
          </p>
        </section>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              {geoLoading && <p>Obteniendo ubicación…</p>}
              {!geoLoading && position && (
                <div className="space-y-1">
                  <p>
                    El mapa se abre donde está el teléfono
                    {usingDemo ? " (sin GPS, sale un ejemplo en Madrid)" : ""}. Tu sitio no se marca.
                    Aleja y toca el problema en tierra, esté donde esté.
                    {pinDistance != null && pinDistance > 30 && (
                      <> Va a {formatDistance(pinDistance)}.</>
                    )}
                  </p>
                </div>
              )}
              {geoError && (
                <p className="flex items-center gap-1 text-orange-700 dark:text-orange-300">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {geoError}
                </p>
              )}
              <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => void refresh()}>
                Actualizar ubicación
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label>¿Qué pasa?</Label>
          {CATEGORY_GROUPS.map((group) => (
            <div key={group}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {group}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {Object.entries(CATEGORIES)
                  .filter(([, item]) => item.group === group)
                  .map(([key, item]) => {
                    const active = category === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => chooseCategory(key as ComplaintCategory)}
                        className={cn(
                          "rounded-2xl border px-3 py-3 text-left transition",
                          active
                            ? "border-sky-500 bg-sky-50 shadow-sm dark:bg-sky-950/50"
                            : "border-slate-200 bg-white hover:border-sky-300 dark:border-slate-700 dark:bg-slate-900"
                        )}
                      >
                        <span className="text-lg">{item.emoji}</span>
                        <span className="mt-1 block text-sm font-semibold leading-tight">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
          <p className="text-sm text-slate-500">{meta.hint}</p>
        </div>

        {category === "otros" && (
          <div className="space-y-2">
            <Label htmlFor="detail">¿Qué es, en una frase?</Label>
            <Input
              id="detail"
              required
              minLength={3}
              maxLength={160}
              value={categoryDetail}
              onChange={(e) => setCategoryDetail(e.target.value)}
              placeholder="Ej. Un solar vallado que se está cayendo a la acera"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            required
            minLength={5}
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Bache profundo junto al paso de peatones"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="desc">Qué ha pasado</Label>
          <Textarea
            id="desc"
            required
            minLength={10}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Dónde está, desde cuándo y por qué importa. Sin insultos: el texto se envía tal cual a la administración."
          />
          {!tone.ok && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
              {tone.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>¿A quién le toca?</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.entries(ADMIN_LEVELS) as [AdminLevel, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setLevelTouched(true);
                  setAdminLevel(key);
                }}
                className={cn(
                  "rounded-2xl border px-3 py-3 text-left",
                  adminLevel === key
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                    : "border-slate-200 dark:border-slate-700"
                )}
              >
                <span className="block text-sm font-semibold">{label}</span>
                <span className="mt-1 block text-xs text-slate-500">{ADMIN_LEVEL_HINTS[key]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">
                {!spot
                  ? "Marca el punto para ver la calle y el barrio"
                  : routePreview?.territory?.calle || "Buscando la calle más cercana…"}
              </p>
              {spot && routePreview?.road?.ref && (
                <p className="mt-1 text-emerald-800/90 dark:text-emerald-200/90">
                  Vía {routePreview.road.ref}
                  {routePreview.road.name && routePreview.road.name !== routePreview.road.ref
                    ? ` (${routePreview.road.name})`
                    : ""}
                  {" · "}
                  {routePreview.road.pk
                    ? `punto kilométrico ${routePreview.road.pk.replace("PK ", "")}`
                    : "punto kilométrico no identificado"}
                </p>
              )}
              {spot && (
                <p className="mt-1 text-emerald-800/90 dark:text-emerald-200/90">
                  {[
                    routePreview?.territory?.barrio
                      ? `Barrio ${routePreview.territory.barrio}`
                      : "",
                    routePreview?.road?.ref && routePreview.territory?.municipio
                      ? `Zona afectada: Ayuntamiento de ${routePreview.territory.municipio}`
                      : routePreview?.territory?.municipio || "",
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Sin barrio con nombre en este punto."}
                </p>
              )}
              {spot && (
                <p className="mt-1">
                  <span className="font-mono">
                    {spot.lat.toFixed(5)}, {spot.lng.toFixed(5)}
                  </span>
                  {" · "}
                  <a
                    href={mapsUrl(spot.lat, spot.lng)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold underline"
                  >
                    Ver en Google Maps
                  </a>
                </p>
              )}
              <p className="mt-2">
                {routePreview?.recipient?.name
                  ? `Se enviará a ${routePreview.recipient.name}. El enlace y la calle van en la queja.`
                  : "Al marcar el punto localizamos la calle para el ayuntamiento."}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reply">Tu correo, si quieres que te contesten (opcional)</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="reply"
              type="email"
              value={reporterEmail}
              onChange={(e) => setReporterEmail(e.target.value)}
              placeholder="tu@correo.es"
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Foto (obligatoria, máx. {MAX_PHOTOS})</Label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500 hover:border-sky-400 dark:border-slate-600 dark:bg-slate-900">
            <Upload className="h-5 w-5" />
            Sin una foto no se puede enviar la queja
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => void onFiles(e.target.files)}
            />
          </label>
          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {photos.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url.slice(0, 48)}
                  src={url}
                  alt="Vista previa"
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500">
          Se firma como <strong>{nickname}</strong>. No se publica hasta que un
          administrador la aprueba. El punto tiene que estar en tierra. Quien diga si
          sigue o ya está arreglada tiene que estar a 1 km.
        </p>

        <Button
          type="submit"
          size="lg"
          className="w-full bg-orange-500 hover:bg-orange-600"
          disabled={submitting || !position || !pin || !tone.ok || photos.length < 1}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
            </>
          ) : (
            "Enviar a revisión"
          )}
        </Button>
      </motion.form>

      <div className="order-1 min-h-[320px] overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 lg:sticky lg:top-4 lg:order-2 lg:h-[calc(100dvh-2rem)]">
        {position ? (
          <div className="relative h-full min-h-[280px]">
            <MiniMap center={position} pin={pin} onPick={placePin} />
            <p className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-slate-700 shadow dark:bg-slate-900/95 dark:text-slate-200">
              {checkingLand
                ? "Comprobando que es tierra…"
                : routePreview?.territory?.calle
                  ? [routePreview.territory.calle, routePreview.territory.barrio]
                      .filter(Boolean)
                      .join(" · ")
                  : pin
                    ? "Punto naranja, en tierra"
                    : "Toca el mapa, en tierra"}
            </p>
          </div>
        ) : (
          <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-slate-500">
            Esperando ubicación…
          </div>
        )}
      </div>
    </div>
  );
}
