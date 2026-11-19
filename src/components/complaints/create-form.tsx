"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { motion } from "framer-motion";
import { MapPin, Upload, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  ADMIN_LEVELS,
  CATEGORIES,
  LOCATION_PRIVACY_RADIUS_M,
  MAX_DISTANCE_M,
  MAX_PHOTO_BYTES,
  MAX_PHOTOS,
} from "@/lib/constants";
import { assertWithin10km } from "@/lib/geo";
import { getOrCreateNickname } from "@/lib/utils";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useIsDesktop, useIsLandscape } from "@/hooks/use-media-query";
import type { AdminLevel, ComplaintCategory, GeoPosition } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const MiniMap = dynamic(() => import("@/components/map/mini-map"), { ssr: false });

export function CreateComplaintForm() {
  const router = useRouter();
  const { position, error: geoError, loading: geoLoading, usingDemo, refresh } =
    useGeolocation();
  const isDesktop = useIsDesktop();
  const isLandscape = useIsLandscape();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ComplaintCategory>("baches_carreteras");
  const [adminLevel, setAdminLevel] = useState<AdminLevel>("ayuntamiento");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pin, setPin] = useState<GeoPosition | null>(null);

  useEffect(() => {
    if (position && !pin) setPin(position);
  }, [position, pin]);

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
      if (data.demo) toast.message("Foto en modo demo (sin Cloudinary)");
      uploaded.push(data.url);
    }
    setPhotos((p) => [...p, ...uploaded]);
  }

  function onPickPin(next: GeoPosition) {
    if (!position) {
      toast.error("Espera a obtener el GPS antes de elegir el punto.");
      return;
    }
    const check = assertWithin10km(position, next, "ubicar la queja");
    if (!check.ok) {
      toast.error(check.message);
      return;
    }
    setPin(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!position || !pin) {
      toast.error("Necesitamos tu GPS y un punto en el mapa (≤10 km).");
      return;
    }
    const check = assertWithin10km(position, pin, "crear la queja");
    if (!check.ok) {
      toast.error(check.message);
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
          admin_level: adminLevel,
          lat: pin.lat,
          lng: pin.lng,
          device_lat: position.lat,
          device_lng: position.lng,
          photos,
          anonymous_nickname: getOrCreateNickname(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo enviar");
        return;
      }
      try {
        new BroadcastChannel("qv-sync").postMessage({ t: Date.now() });
      } catch {
        /* ignore */
      }
      toast.success(data.message ?? "Queja enviada a moderación");
      router.push(`/quejas/${data.complaint.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-5xl gap-6 p-4 sm:p-6",
        isDesktop || isLandscape ? "lg:grid-cols-2" : "grid-cols-1"
      )}
    >
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Subir Queja
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Elige el punto del problema a ≤{(MAX_DISTANCE_M / 1000).toFixed(0)}{" "}
            km de tu GPS. El pin público se ofusca en un círculo de ~{" "}
            {((LOCATION_PRIVACY_RADIUS_M * 2) / 1000).toFixed(0)} km de diámetro
            (privacidad). Nick anónimo, sin registro obligatorio.
          </p>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              {geoLoading && <p>Obteniendo GPS…</p>}
              {!geoLoading && position && (
                <p>
                  GPS activo
                  {usingDemo && " (demo Madrid — activa ubicación real en producción)"}
                  . Toca el mapa para marcar el problema. Tu posición exacta no se
                  guarda ni se muestra en público.
                </p>
              )}
              {geoError && (
                <p className="flex items-center gap-1 text-orange-700 dark:text-orange-300">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {geoError}
                </p>
              )}
              <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => void refresh()}>
                Actualizar GPS
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            required
            minLength={5}
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Bache profundo en Calle Mayor"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="desc">Descripción</Label>
          <Textarea
            id="desc"
            required
            minLength={10}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe el problema con detalle…"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Categoría</Label>
            <select
              className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
            >
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Nivel administrativo</Label>
            <select
              className="flex h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
              value={adminLevel}
              onChange={(e) => setAdminLevel(e.target.value as AdminLevel)}
            >
              {Object.entries(ADMIN_LEVELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Fotos (máx. {MAX_PHOTOS}, ≤800 KB c/u)</Label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500 hover:border-sky-400 dark:border-slate-600 dark:bg-slate-900">
            <Upload className="h-5 w-5" />
            Añadir fotos
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
                  key={url.slice(0, 40)}
                  src={url}
                  alt="Vista previa"
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500">
          Se publicará como <strong>{getOrCreateNickname()}</strong> · estado inicial:{" "}
          <strong>pendiente de moderación</strong>.
        </p>

        <Button type="submit" size="lg" className="w-full" disabled={submitting || !position || !pin}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
            </>
          ) : (
            "Enviar queja"
          )}
        </Button>
      </motion.form>

      <div className="min-h-[240px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 lg:min-h-[480px]">
        {position ? (
          <div className="flex h-full min-h-[240px] flex-col">
            <MiniMap
              center={position}
              pin={pin ?? position}
              radiusM={MAX_DISTANCE_M}
              onPinChange={onPickPin}
            />
            <p className="border-t border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-700">
              Azul = tu GPS (no se guarda) · Naranja = pin del problema · Círculo ={" "}
              {(MAX_DISTANCE_M / 1000).toFixed(0)} km
            </p>
          </div>
        ) : (
          <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-slate-500">
            Esperando GPS…
          </div>
        )}
      </div>
    </div>
  );
}
