"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { STATUS_LABELS, CATEGORIES } from "@/lib/constants";
import type { Complaint, Report } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminPanel() {
  const [secret, setSecret] = useState("demo-admin");
  const [authed, setAuthed] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [filter, setFilter] = useState("pending");

  const headers = useCallback(
    () => ({ "x-admin-secret": secret, "Content-Type": "application/json" }),
    [secret]
  );

  const load = useCallback(async () => {
    const [cRes, rRes, sRes] = await Promise.all([
      fetch(`/api/admin/complaints?status=${filter}`, { headers: headers() }),
      fetch("/api/admin/reports", { headers: headers() }),
      fetch("/api/admin/stats", { headers: headers() }),
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
    setComplaints(c.complaints ?? []);
    setReports(r.reports ?? []);
    setStats(s.stats ?? null);
  }, [filter, headers]);

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
    toast.success(`Estado → ${status}`);
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

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
        <h1 className="font-display text-2xl font-bold">Panel admin</h1>
        <p className="text-sm text-slate-500">
          Introduce el secreto de administrador. En demo: <code>demo-admin</code>
        </p>
        <Input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="ADMIN_SECRET"
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
  } | null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Moderación</h1>
          <p className="text-sm text-slate-500">
            Móvil y web comparten las mismas quejas vía API / Supabase.
          </p>
        </div>
        <Link href="/" className="text-sm text-sky-600">
          Salir al mapa
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Total", s?.total],
          ["Pendientes", s?.pending],
          ["Aprobadas", s?.approved],
          ["Resueltas", s?.resolved],
          ["Rechazadas", s?.rejected],
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
        {["pending", "approved", "resolved", "rejected", "all"].map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Todas" : STATUS_LABELS[f as keyof typeof STATUS_LABELS] ?? f}
          </Button>
        ))}
        <Button size="sm" variant="secondary" onClick={() => void load()}>
          Refrescar
        </Button>
      </div>

      <ul className="space-y-3">
        {complaints.map((c) => (
          <li
            key={c.id}
            className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
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
                  <Badge variant="outline">{CATEGORIES[c.category].label}</Badge>
                </div>
                <h3 className="font-semibold">{c.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{c.description}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {c.anonymous_nickname} · {c.lat.toFixed(4)}, {c.lng.toFixed(4)}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="success" onClick={() => void setStatus(c.id, "approved")}>
                  Aprobar
                </Button>
                <Button size="sm" variant="outline" onClick={() => void setStatus(c.id, "resolved")}>
                  Resuelta
                </Button>
                <Button size="sm" variant="danger" onClick={() => void setStatus(c.id, "rejected")}>
                  Rechazar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void remove(c.id)}>
                  Eliminar
                </Button>
              </div>
            </div>
          </li>
        ))}
        {complaints.length === 0 && (
          <p className="text-sm text-slate-500">No hay quejas en este filtro.</p>
        )}
      </ul>

      <section>
        <h2 className="font-display mb-3 text-xl font-semibold">Reportes</h2>
        <ul className="space-y-2">
          {reports.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700"
            >
              <Badge variant="pending">{r.status}</Badge> {r.reason}
              <span className="ml-2 text-xs text-slate-400">por {r.reporter_nickname}</span>
            </li>
          ))}
          {reports.length === 0 && (
            <p className="text-sm text-slate-500">Sin reportes abiertos.</p>
          )}
        </ul>
      </section>
    </div>
  );
}
