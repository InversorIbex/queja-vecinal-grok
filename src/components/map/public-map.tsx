"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Filter, Flame, Layers, MapPin } from "lucide-react";
import { CATEGORIES, MAP_DEFAULT_CENTER } from "@/lib/constants";
import type { Complaint, ComplaintCategory } from "@/types";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useComplaintsSync } from "@/hooks/use-sync";
import { useIsDesktop, useIsLandscape } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MapInner = dynamic(() => import("./map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-100 dark:bg-slate-900">
      <p className="text-sm text-slate-500">Cargando mapa…</p>
    </div>
  ),
});

type LayerKey = "none" | "ccaa" | "provincias" | "municipios";

export function PublicMap() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [category, setCategory] = useState<ComplaintCategory | "all">("all");
  const [heat, setHeat] = useState(false);
  const [layer, setLayer] = useState<LayerKey>("none");
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [layerName, setLayerName] = useState<string | null>(null);
  const { position, error: geoError, refresh } = useGeolocation();
  const isDesktop = useIsDesktop();
  const isLandscape = useIsLandscape();

  const load = useCallback(async () => {
    const qs =
      category === "all" ? "status=public" : `status=public&category=${category}`;
    const res = await fetch(`/api/complaints?${qs}`);
    const data = await res.json();
    setComplaints(data.complaints ?? []);
  }, [category]);

  useEffect(() => {
    void load();
  }, [load]);

  const { syncLabel } = useComplaintsSync(load);

  const filtered = useMemo(() => complaints, [complaints]);
  /** Solo GPS real centra el círculo 10 km; sin GPS el mapa usa viewport neutro. */
  const center = position ?? MAP_DEFAULT_CENTER;

  return (
    <div
      className={cn(
        "relative flex w-full",
        isDesktop || (isLandscape && !isDesktop)
          ? "h-[calc(100dvh-0px)] lg:h-dvh"
          : "h-[calc(100dvh-3.5rem)]"
      )}
    >
      <div className="relative min-h-0 min-w-0 flex-1">
        <MapInner
          center={center}
          complaints={filtered}
          heat={heat}
          adminLayer={layer}
          userPosition={position}
          onSelect={setSelected}
          onLayerClick={setLayerName}
        />

        {/* Controles — adaptan posición en landscape */}
        <div
          className={cn(
            "absolute z-[500] flex flex-col gap-2",
            isLandscape && !isDesktop ? "left-2 top-2" : "left-3 top-3"
          )}
        >
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-2 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
            <div className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Filter className="h-3.5 w-3.5" />
              Filtros
            </div>
            <select
              className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-600 dark:bg-slate-800"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as ComplaintCategory | "all")
              }
            >
              <option value="all">Todas las categorías</option>
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-1">
              <Button
                size="sm"
                variant={heat ? "danger" : "outline"}
                onClick={() => setHeat((h) => !h)}
                className="text-xs"
              >
                <Flame className="h-3.5 w-3.5" />
                Heat
              </Button>
              <Button size="sm" variant="outline" onClick={() => void refresh()} className="text-xs">
                <MapPin className="h-3.5 w-3.5" />
                Mi ubicación
              </Button>
            </div>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
              <Layers className="h-3 w-3" />
              <select
                className="flex-1 rounded border border-slate-200 bg-transparent px-1 py-0.5 dark:border-slate-600"
                value={layer}
                onChange={(e) => setLayer(e.target.value as LayerKey)}
              >
                <option value="none">Sin capa admin</option>
                <option value="ccaa">CCAA</option>
                <option value="provincias">Provincias</option>
                <option value="municipios">Municipios</option>
              </select>
            </div>
          </div>
          {layerName && (
            <div className="rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white shadow">
              {layerName}
            </div>
          )}
          <p className="rounded-lg bg-black/50 px-2 py-1 text-[10px] text-white">
            {syncLabel}
            {!position && geoError
              ? " · sin GPS — activa ubicación para el círculo 10 km"
              : !position
                ? " · obteniendo GPS…"
                : ""}
          </p>
        </div>
      </div>

      {/* Panel lateral en desktop / lista en mobile portrait */}
      <aside
        className={cn(
          "z-[400] flex flex-col border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95",
          isDesktop
            ? "w-96 border-l"
            : isLandscape
              ? "absolute bottom-0 right-0 top-0 w-72 border-l"
              : "absolute inset-x-0 bottom-0 max-h-[38%] rounded-t-3xl border-t shadow-2xl"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <div>
            <h2 className="font-display text-base font-semibold">Quejas cercanas</h2>
            <p className="text-xs text-slate-500">{filtered.length} visibles</p>
          </div>
          {selected && (
            <Badge variant={selected.status === "resolved" ? "resolved" : "approved"}>
              Seleccionada
            </Badge>
          )}
        </div>
        <ul className="flex-1 space-y-2 overflow-y-auto p-3">
          {(selected ? [selected, ...filtered.filter((c) => c.id !== selected.id)] : filtered)
            .slice(0, 40)
            .map((c) => (
              <li key={c.id}>
                <Link
                  href={`/quejas/${c.id}`}
                  onClick={() => setSelected(c)}
                  className={cn(
                    "block rounded-xl border p-3 transition hover:border-sky-300 dark:hover:border-sky-700",
                    selected?.id === c.id
                      ? "border-sky-400 bg-sky-50 dark:bg-sky-950/40"
                      : "border-slate-200 dark:border-slate-700"
                  )}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: CATEGORIES[c.category].color }}
                    />
                    <span className="text-[10px] font-medium text-slate-500">
                      {CATEGORIES[c.category].label}
                    </span>
                    {c.status === "resolved" && (
                      <Badge variant="resolved" className="ml-auto">
                        Resuelta
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium leading-snug text-slate-900 dark:text-slate-100">
                    {c.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{c.description}</p>
                  <p className="mt-2 text-[10px] text-slate-400">
                    {c.anonymous_nickname} · ✓{c.votes_real} · 💬{c.comments_count}
                  </p>
                </Link>
              </li>
            ))}
        </ul>
      </aside>
    </div>
  );
}
