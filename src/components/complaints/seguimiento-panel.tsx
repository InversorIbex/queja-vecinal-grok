"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import {
  ADMIN_LEVELS,
  EMAIL_STATUS_LABELS,
  STATUS_LABELS,
  categoryMeta,
} from "@/lib/constants";
import { mapsUrl } from "@/lib/geo";
import { formatDate, readTracking, type SavedTracking } from "@/lib/utils";
import type { Complaint, ComplaintEvent } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SeguimientoPanel({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [saved, setSaved] = useState<SavedTracking[]>([]);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [events, setEvents] = useState<ComplaintEvent[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSaved(readTracking());
  }, []);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      void lookup(initialCode, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  async function lookup(value: string, navigate: boolean) {
    const clean = value.trim();
    if (!clean) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/seguimiento/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok) {
        setComplaint(null);
        setEvents([]);
        setError(data.error ?? "No encontrada");
        return;
      }
      setComplaint(data.complaint);
      setEvents(data.events ?? []);
      if (navigate) router.replace(`/seguimiento/${data.complaint.tracking_code}`);
    } finally {
      setLoading(false);
    }
  }

  const meta = complaint ? categoryMeta(complaint.category) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
          Seguimiento
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">¿En qué punto está?</h1>
        <p className="mt-2 text-sm text-slate-500">
          El código llega al enviar la queja, tipo QV-7K2M4P. Con él ves si está en revisión,
          si se aprobó y si el correo ya salió hacia la administración.
        </p>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(code, true);
        }}
      >
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="QV-······"
          aria-label="Código de seguimiento"
          className="font-mono uppercase"
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Ver
        </Button>
      </form>

      {error && (
        <p className="rounded-2xl bg-orange-50 px-4 py-3 text-sm text-orange-800 dark:bg-orange-950/40 dark:text-orange-200">
          {error}
        </p>
      )}

      {complaint && meta && (
        <article className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={
                complaint.status === "pending"
                  ? "pending"
                  : complaint.status === "resolved"
                    ? "resolved"
                    : complaint.status === "rejected"
                      ? "rejected"
                      : "approved"
              }
            >
              {STATUS_LABELS[complaint.status]}
            </Badge>
            <Badge variant="outline">{meta.label}</Badge>
            {complaint.email_status && complaint.email_status !== "none" && (
              <Badge variant="outline">{EMAIL_STATUS_LABELS[complaint.email_status]}</Badge>
            )}
          </div>
          <h2 className="font-display text-2xl font-bold">{complaint.title}</h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {complaint.description}
          </p>
          {complaint.category === "otros" && complaint.category_detail && (
            <p className="text-sm text-slate-500">Tipo: {complaint.category_detail}</p>
          )}
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {complaint.calle || "Sin calle con nombre junto al punto"}
            {complaint.barrio ? ` · Barrio ${complaint.barrio}` : ""}
            {complaint.municipio ? ` · ${complaint.municipio}` : ""}
          </p>
          <p className="text-sm">
            <a
              href={mapsUrl(complaint.lat, complaint.lng)}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-sky-700 underline dark:text-sky-300"
            >
              {complaint.lat.toFixed(5)}, {complaint.lng.toFixed(5)} · Google Maps
            </a>
          </p>
          <p className="text-sm text-slate-500">
            {ADMIN_LEVELS[complaint.admin_level]}
            {complaint.recipient_name ? ` · se enviará a ${complaint.recipient_name}` : ""}
          </p>
          <p className="font-mono text-sm text-sky-700 dark:text-sky-300">
            {complaint.tracking_code}
          </p>
          <ol className="space-y-3 border-l-2 border-sky-200 pl-4 dark:border-sky-900">
            {events.map((event) => (
              <li key={event.id}>
                <p className="text-sm">{event.message}</p>
                <p className="text-xs text-slate-400">{formatDate(event.created_at)}</p>
              </li>
            ))}
            {events.length === 0 && (
              <li className="text-sm text-slate-500">Todavía no hay movimientos.</li>
            )}
          </ol>
          {(complaint.status === "approved" || complaint.status === "resolved") && (
            <Link href={`/quejas/${complaint.id}`} className="text-sm font-semibold text-sky-600">
              Ver en el mapa público
            </Link>
          )}
        </article>
      )}

      {saved.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-lg font-semibold">En este dispositivo</h2>
          <ul className="space-y-2">
            {saved.map((item) => (
              <li key={item.code}>
                <button
                  type="button"
                  onClick={() => {
                    setCode(item.code);
                    void lookup(item.code, true);
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left hover:border-sky-300 dark:border-slate-700"
                >
                  <span>
                    <span className="block font-medium">{item.title}</span>
                    <span className="font-mono text-xs text-slate-400">{item.code}</span>
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(item.at)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
