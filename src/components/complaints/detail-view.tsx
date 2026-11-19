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
  CATEGORIES,
  STATUS_LABELS,
} from "@/lib/constants";
import { formatDate, formatDistance, getOrCreateNickname } from "@/lib/utils";
import { haversineMeters, within10km } from "@/lib/geo";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useComplaintsSync } from "@/hooks/use-sync";
import type { Comment, Complaint, VoteType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ComplaintDetail({ id }: { id: string }) {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
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
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useComplaintsSync(load);

  const distance =
    position && complaint
      ? haversineMeters(position, { lat: complaint.lat, lng: complaint.lng })
      : null;
  const canInteract =
    position && complaint ? within10km(position, { lat: complaint.lat, lng: complaint.lng }) : false;

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
          <Badge variant="outline">{CATEGORIES[complaint.category].label}</Badge>
          <Badge variant="outline">{ADMIN_LEVELS[complaint.admin_level]}</Badge>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {complaint.title}
        </h1>
        <p className="text-sm text-slate-500">
          {complaint.anonymous_nickname} · {formatDate(complaint.created_at)} ·
          ubicación aproximada (privacidad ~20 km)
        </p>
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

      <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
        <h2 className="mb-3 font-display text-lg font-semibold">Votos</h2>
        {distance != null && (
          <p className="mb-3 text-xs text-slate-500">
            Estás a {formatDistance(distance)} de esta queja.
            {!canInteract && (
              <span className="mt-1 flex items-center gap-1 font-medium text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                Debes estar a ≤10 km para votar o comentar.
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
            disabled={!canInteract || busy}
            onClick={() => void vote("real")}
            title={!canInteract ? "Fuera del radio de 10 km" : undefined}
          >
            <ThumbsUp className="h-4 w-4" /> Real ({complaint.votes_real})
          </Button>
          <Button
            variant="outline"
            disabled={!canInteract || busy}
            onClick={() => void vote("fake")}
          >
            <ThumbsDown className="h-4 w-4" /> Falsa ({complaint.votes_fake})
          </Button>
          <Button
            variant="success"
            disabled={!canInteract || busy}
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
        <div className={cn("space-y-2", !canInteract && "opacity-60")}>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              canInteract
                ? "Escribe un comentario…"
                : "Comentarios deshabilitados: estás a más de 10 km"
            }
            disabled={!canInteract || busy}
          />
          <Button
            onClick={() => void comment()}
            disabled={!canInteract || busy || body.trim().length < 2}
          >
            Publicar comentario
          </Button>
        </div>
      </section>
    </motion.article>
  );
}
