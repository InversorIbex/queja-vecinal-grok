"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  Share2,
  ThumbsDown,
  ThumbsUp,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import {
  ADMIN_LEVELS,
  EMAIL_STATUS_LABELS,
  STATUS_LABELS,
  categoryMeta,
} from "@/lib/constants";
import { inspectTone } from "@/lib/moderation";
import { formatDate, formatDistance, getOrCreateNickname } from "@/lib/utils";
import { haversineMeters, mapsUrl, withinVerifyRadius } from "@/lib/geo";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useComplaintsSync } from "@/hooks/use-sync";
import type { Comment, Complaint, ComplaintEvent, VoteType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ComplaintDetail({ id }: { id: string }) {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [events, setEvents] = useState<ComplaintEvent[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const { position, refresh } = useGeolocation();

  const load = useCallback(async () => {
    const res = await fetch(`/api/complaints/${id}`);
    if (!res.ok) {
      setComplaint(null);
      return;
    }
    const data = await res.json();
    setComplaint(data.complaint);
    setComments(data.comments ?? []);
    setEvents(data.events ?? []);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useComplaintsSync(load);

  const distance =
    position && complaint
      ? haversineMeters(position, { lat: complaint.lat, lng: complaint.lng })
      : null;
  const canVerify =
    position && complaint
      ? withinVerifyRadius(position, { lat: complaint.lat, lng: complaint.lng })
      : false;
  const canComment = Boolean(position && complaint);

  async function vote(vote_type: VoteType) {
    if (!position || !complaint) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/complaints/${id}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vote_type,
          voter_nickname: getOrCreateNickname(),
          voter_lat: position.lat,
          voter_lng: position.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success("Voto registrado");
      try {
        new BroadcastChannel("qv-sync").postMessage({ t: Date.now() });
      } catch {
        /* ignore */
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function comment() {
    if (!position || !body.trim()) return;
    const tone = inspectTone(body);
    if (!tone.ok) {
      toast.error(tone.message);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/complaints/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          author_nickname: getOrCreateNickname(),
          author_lat: position.lat,
          author_lng: position.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      setBody("");
      toast.success("Comentario publicado");
      try {
        new BroadcastChannel("qv-sync").postMessage({ t: Date.now() });
      } catch {
        /* ignore */
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      void navigator.share({
        title: complaint?.title ?? "QuejasVecinales",
        text: complaint?.description,
        url,
      });
    } else {
      void navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    }
  }

  if (!complaint) {
    return (
      <div className="p-8 text-center text-slate-500">
        Cargando queja… o no existe.
        <div className="mt-4">
          <Link href="/" className="text-sky-600 underline">
            Volver al mapa
          </Link>
        </div>
      </div>
    );
  }

  const statusVariant =
    complaint.status === "resolved"
      ? "resolved"
      : complaint.status === "pending"
        ? "pending"
        : complaint.status === "rejected"
          ? "rejected"
          : "approved";
  const published = complaint.status === "approved" || complaint.status === "resolved";
  const commentTone = inspectTone(body);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6"
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-sky-600"
        >
          <ArrowLeft className="h-4 w-4" /> Mapa
        </Link>
        <Button size="sm" variant="outline" onClick={share}>
          <Share2 className="h-4 w-4" /> Compartir
        </Button>
      </div>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant}>{STATUS_LABELS[complaint.status]}</Badge>
          <Badge variant="outline">{categoryMeta(complaint.category).label}</Badge>
          <Badge variant="outline">{ADMIN_LEVELS[complaint.admin_level]}</Badge>
          {complaint.email_status && complaint.email_status !== "none" && (
            <Badge variant="outline">{EMAIL_STATUS_LABELS[complaint.email_status]}</Badge>
          )}
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {complaint.title}
        </h1>
        <p className="text-sm text-slate-500">
          {complaint.anonymous_nickname} · {formatDate(complaint.created_at)}
          {complaint.tracking_code ? ` · ${complaint.tracking_code}` : ""}
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
          <span className="font-mono text-slate-500">
            {complaint.lat.toFixed(5)}, {complaint.lng.toFixed(5)}
          </span>
          {" · "}
          <a
            href={mapsUrl(complaint.lat, complaint.lng)}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-sky-700 underline dark:text-sky-300"
          >
            Ver en Google Maps
          </a>
        </p>
        {complaint.recipient_name && (
          <p className="text-sm text-slate-500">Se enviará a {complaint.recipient_name}</p>
        )}
        <p className="leading-relaxed text-slate-700 dark:text-slate-200">
          {complaint.description}
        </p>
        {complaint.photos?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {complaint.photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={p.slice(0, 32)} src={p} alt="" className="h-28 rounded-xl object-cover" />
            ))}
          </div>
        )}
      </header>

      {complaint.tracking_code && (
        <p className="text-sm">
          <Link
            href={`/seguimiento/${complaint.tracking_code}`}
            className="font-semibold text-sky-600"
          >
            Seguir {complaint.tracking_code}
          </Link>
        </p>
      )}

      {events.length > 0 && (
        <ol className="space-y-2 border-l-2 border-sky-200 pl-4 text-sm dark:border-sky-900">
          {events.map((event) => (
            <li key={event.id}>
              <p>{event.message}</p>
              <p className="text-xs text-slate-400">{formatDate(event.created_at)}</p>
            </li>
          ))}
        </ol>
      )}

      {published ? (
      <>
      <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
        <h2 className="mb-3 font-display text-lg font-semibold">Votos</h2>
        {distance != null && (
          <p className="mb-3 text-xs text-slate-500">
            Estás a {formatDistance(distance)} de esta queja.
            {!canVerify && (
              <span className="mt-1 flex items-center gap-1 font-medium text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                Para decir si sigue o está arreglada hay que estar a 1 km. Comentar se puede desde cualquier sitio.
              </span>
            )}
          </p>
        )}
        {!position && (
          <Button size="sm" variant="outline" className="mb-3" onClick={() => void refresh()}>
            Activar ubicación
          </Button>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={!canVerify || busy}
            onClick={() => void vote("real")}
            title={!canVerify ? "Hay que estar a 1 km" : undefined}
          >
            <ThumbsUp className="h-4 w-4" /> Real ({complaint.votes_real})
          </Button>
          <Button
            variant="outline"
            disabled={!canVerify || busy}
            onClick={() => void vote("fake")}
          >
            <ThumbsDown className="h-4 w-4" /> Falsa ({complaint.votes_fake})
          </Button>
          <Button
            variant="success"
            disabled={!canVerify || busy}
            onClick={() => void vote("resolved")}
          >
            <CheckCircle2 className="h-4 w-4" /> Resuelta ({complaint.votes_resolved})
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <MessageCircle className="h-5 w-5" /> Comentarios ({comments.length})
        </h2>
        <div className="space-y-2">
          {comments.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="font-medium text-sky-700 dark:text-sky-400">
                {c.author_nickname}
                <span className="ml-2 text-xs font-normal text-slate-400">
                  {formatDistance(c.distance_m)}
                </span>
              </p>
              <p className="mt-1 text-slate-700 dark:text-slate-200">{c.body}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-slate-500">Sé el primero en comentar.</p>
          )}
        </div>
        <div className={cn("space-y-2", !canComment && "opacity-60")}>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              canComment
                ? "Escribe un comentario…"
                : "Activa la ubicación para comentar"
            }
            disabled={!canComment || busy}
          />
          <Button
            onClick={() => void comment()}
            disabled={!canComment || busy || body.trim().length < 2 || !commentTone.ok}
          >
            Publicar comentario
          </Button>
          {!commentTone.ok && <p className="text-sm text-rose-600">{commentTone.message}</p>}
        </div>
      </section>
      </>
      ) : (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Esta queja todavía no está en el mapa público. Cuando un administrador la apruebe,
          se enviará a la administración y aquí se podrán dejar votos y comentarios.
        </p>
      )}
    </motion.article>
  );
}
