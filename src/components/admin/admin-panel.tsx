"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  STATUS_LABELS,
  CATEGORIES,
  ROLE_LABELS,
} from "@/lib/constants";
import type { Comment, Complaint, Profile, Report } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Tab = "cola" | "fotos" | "comentarios" | "usuarios" | "reportes";

export function AdminPanel() {
  const [secret, setSecret] = useState("demo-admin");
  const [superEmail, setSuperEmail] = useState("");
  const [authed, setAuthed] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [comments, setComments] = useState<
    (Comment & { complaint_title?: string })[]
  >([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [filter, setFilter] = useState("pending");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("cola");

  const headers = useCallback(() => {
    const h: Record<string, string> = {
      "x-admin-secret": secret,
      "Content-Type": "application/json",
    };
    if (superEmail.trim()) {
      h["x-super-admin-email"] = superEmail.trim().toLowerCase();
    }
    return h;
  }, [secret, superEmail]);

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ status: filter });
    if (categoryFilter !== "all") qs.set("category", categoryFilter);
    if (search.trim()) qs.set("q", search.trim());
    if (tab === "fotos") qs.set("withPhotos", "1");

    const [cRes, rRes, sRes, cmRes, uRes] = await Promise.all([
      fetch(`/api/admin/complaints?${qs}`, { headers: headers() }),
      fetch("/api/admin/reports", { headers: headers() }),
      fetch("/api/admin/stats", { headers: headers() }),
      fetch(
        `/api/admin/comments${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`,
        { headers: headers() }
      ),
      fetch(
        `/api/admin/users${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`,
        { headers: headers() }
      ),
    ]);
    if (!cRes.ok) {
      toast.error("No autorizado — revisa ADMIN_SECRET (demo: demo-admin)");
      setAuthed(false);
      return;
    }
    setAuthed(true);
    const c = await cRes.json();
    const r = await rRes.json();
    const s = await sRes.json();
    const cm = cmRes.ok ? await cmRes.json() : { comments: [] };
    const u = uRes.ok ? await uRes.json() : { profiles: [] };
    setComplaints(c.complaints ?? []);
    setReports(r.reports ?? []);
    setStats(s.stats ?? null);
    setComments(cm.comments ?? []);
    setProfiles(u.profiles ?? []);
    setIsSuperAdmin(
      Boolean(c.isSuperAdmin ?? s.isSuperAdmin ?? u.isSuperAdmin)
    );
  }, [filter, categoryFilter, search, tab, headers]);

  useEffect(() => {
    if (authed) void load();
  }, [authed, load]);

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/complaints/${id}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status, adminToken: secret }),
    });
    if (!res.ok) {
      toast.error("Error al moderar");
      return;
    }
    toast.success(`Estado → ${STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status}`);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar queja?")) return;
    const res = await fetch(`/api/complaints/${id}`, {
      method: "DELETE",
      headers: headers(),
    });
    if (!res.ok) {
      toast.error("Error al eliminar");
      return;
    }
    toast.success("Eliminada");
    await load();
  }

  async function removePhoto(complaintId: string, photoUrl: string) {
    if (!confirm("¿Eliminar esta foto inapropiada?")) return;
    const res = await fetch("/api/admin/photos", {
      method: "DELETE",
      headers: headers(),
      body: JSON.stringify({ complaintId, photoUrl }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "No se pudo eliminar la foto");
      return;
    }
    toast.success(data.message ?? "Foto eliminada");
    await load();
  }

  async function removeComment(id: string) {
    if (!confirm("¿Borrar comentario ofensivo?")) return;
    const res = await fetch("/api/admin/comments", {
      method: "DELETE",
      headers: headers(),
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "No se pudo borrar");
      return;
    }
    toast.success("Comentario eliminado");
    await load();
  }

  async function banUser(id: string, banned: boolean) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ id, banned }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Acción no permitida");
      return;
    }
    toast.success(data.message ?? (banned ? "Baneado" : "Desbaneado"));
    await load();
  }

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
        <h1 className="font-display text-2xl font-bold">Panel SUPER_ADMIN</h1>
        <p className="text-sm text-slate-500">
          Introduce el secreto de administrador. En demo:{" "}
          <code>demo-admin</code>. Opcional: email de{" "}
          <code>SUPER_ADMIN_EMAIL</code> para acciones elevadas en producción.
        </p>
        <Input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="ADMIN_SECRET"
        />
        <Input
          type="email"
          value={superEmail}
          onChange={(e) => setSuperEmail(e.target.value)}
          placeholder="SUPER_ADMIN_EMAIL (opcional)"
        />
        <Button onClick={() => void load()}>Entrar</Button>
        <Link href="/" className="text-center text-sm text-sky-600">
          Volver
        </Link>
      </div>
    );
  }

  const s = stats as {
    total?: number;
    pending?: number;
    approved?: number;
    resolved?: number;
    rejected?: number;
    withPhotos?: number;
    bannedUsers?: number;
  } | null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "cola", label: "Cola de quejas" },
    { id: "fotos", label: "Fotos" },
    { id: "comentarios", label: "Comentarios" },
    { id: "usuarios", label: "Usuarios" },
    { id: "reportes", label: "Reportes" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Moderación</h1>
          <p className="text-sm text-slate-500">
            {isSuperAdmin
              ? "Sesión SUPER_ADMIN — aprobar, fotos, comentarios y baneos."
              : "Sesión admin — aprueba/rechaza quejas. Añade SUPER_ADMIN_EMAIL para acciones elevadas."}
          </p>
        </div>
        <Link href="/" className="text-sm text-sky-600">
          Salir al mapa
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {[
          ["Total", s?.total],
          ["Pendientes", s?.pending],
          ["Aprobadas", s?.approved],
          ["Resueltas", s?.resolved],
          ["Rechazadas", s?.rejected],
          ["Con fotos", s?.withPhotos],
          ["Baneados", s?.bannedUsers],
        ].map(([label, val]) => (
          <Card key={String(label)}>
            <CardHeader className="p-4 pb-1">
              <CardTitle className="text-sm font-medium text-slate-500">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="font-display text-2xl font-bold">{val ?? "—"}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={tab === t.id ? "default" : "outline"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[180px] flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar título, nick, comentario…"
          />
        </div>
        {(tab === "cola" || tab === "fotos") && (
          <>
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              {["pending", "approved", "resolved", "rejected", "all"].map(
                (f) => (
                  <option key={f} value={f}>
                    {f === "all"
                      ? "Todas"
                      : STATUS_LABELS[f as keyof typeof STATUS_LABELS]}
                  </option>
                )
              )}
            </select>
            <select
              className="h-10 max-w-[220px] rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Todas las categorías</option>
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </>
        )}
        <Button size="sm" variant="secondary" onClick={() => void load()}>
          Refrescar
        </Button>
      </div>

      {(tab === "cola" || tab === "fotos") && (
        <ul className="space-y-3">
          {complaints.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap gap-2">
                    <Badge
                      variant={
                        c.status === "pending"
                          ? "pending"
                          : c.status === "resolved"
                            ? "resolved"
                            : c.status === "rejected"
                              ? "rejected"
                              : "approved"
                      }
                    >
                      {STATUS_LABELS[c.status]}
                    </Badge>
                    <Badge variant="outline">
                      {CATEGORIES[c.category]?.label ?? c.category}
                    </Badge>
                  </div>
                  <h3 className="font-semibold">{c.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {c.description}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {c.anonymous_nickname} · {c.lat.toFixed(4)},{" "}
                    {c.lng.toFixed(4)}
                  </p>
                  {c.photos.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {c.photos.map((url) => (
                        <div key={url} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt="Foto de la queja"
                            className="h-20 w-28 rounded-lg object-cover"
                          />
                          {isSuperAdmin && (
                            <Button
                              size="sm"
                              variant="danger"
                              className="absolute bottom-1 right-1 h-7 px-2 text-xs"
                              onClick={() => void removePhoto(c.id, url)}
                            >
                              Quitar
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => void setStatus(c.id, "approved")}
                  >
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void setStatus(c.id, "resolved")}
                  >
                    Resuelta
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => void setStatus(c.id, "rejected")}
                  >
                    Rechazar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void remove(c.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </li>
          ))}
          {complaints.length === 0 && (
            <p className="text-sm text-slate-500">
              No hay quejas en este filtro.
            </p>
          )}
        </ul>
      )}

      {tab === "comentarios" && (
        <ul className="space-y-2">
          {comments.map((cm) => (
            <li
              key={cm.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700"
            >
              <div>
                <p className="font-medium">{cm.author_nickname}</p>
                <p className="text-slate-600 dark:text-slate-300">{cm.body}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {cm.complaint_title ?? cm.complaint_id}
                </p>
              </div>
              {isSuperAdmin && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => void removeComment(cm.id)}
                >
                  Borrar
                </Button>
              )}
            </li>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-slate-500">Sin comentarios.</p>
          )}
        </ul>
      )}

      {tab === "usuarios" && (
        <ul className="space-y-2">
          {profiles.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{p.nickname}</span>
                  <Badge variant="outline">
                    {ROLE_LABELS[p.role] ?? p.role}
                  </Badge>
                  {p.banned && <Badge variant="rejected">Baneado</Badge>}
                </div>
                <p className="text-xs text-slate-400">
                  {p.email ?? "sin email"} · {p.reputation_level} (
                  {p.reputation_points} pts)
                </p>
              </div>
              {isSuperAdmin && p.role !== "super_admin" && (
                <Button
                  size="sm"
                  variant={p.banned ? "outline" : "danger"}
                  onClick={() => void banUser(p.id, !p.banned)}
                >
                  {p.banned ? "Desbanear" : "Banear"}
                </Button>
              )}
            </li>
          ))}
          {profiles.length === 0 && (
            <p className="text-sm text-slate-500">Sin usuarios.</p>
          )}
        </ul>
      )}

      {tab === "reportes" && (
        <ul className="space-y-2">
          {reports.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700"
            >
              <Badge variant="pending">{r.status}</Badge> {r.reason}
              <span className="ml-2 text-xs text-slate-400">
                por {r.reporter_nickname}
              </span>
            </li>
          ))}
          {reports.length === 0 && (
            <p className="text-sm text-slate-500">Sin reportes abiertos.</p>
          )}
        </ul>
      )}
    </div>
  );
}
