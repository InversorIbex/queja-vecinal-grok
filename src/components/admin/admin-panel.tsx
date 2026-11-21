"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { STATUS_LABELS, EMAIL_STATUS_LABELS, categoryMeta } from "@/lib/constants";
import type { Complaint, Report } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminPanel() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [filter, setFilter] = useState("pending");
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});

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
          toast.error("No autorizado. Revisa ADMIN_SECRET.");
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

  async function moderate(
    id: string,
    status: string,
    extra?: { send?: boolean; recipient_email?: string; recipient_name?: string },
    quiet = false
  ) {
    const res = await fetch(`/api/complaints/${id}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ status, adminToken: secret, ...extra }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Error al moderar");
      return false;
    }
    if (!quiet) {
      const delivery = data.delivery as { status?: string; detail?: string } | null;
      if (delivery?.status === "sent") toast.success(delivery.detail ?? "Enviada");
      else if (delivery?.detail) toast.message(delivery.detail);
      else toast.success(status === "approved" ? "Aprobada. El correo lo envías tú." : `Estado → ${status}`);
      await load();
    }
    return true;
  }

  function chosenComplaints() {
    return complaints.filter((complaint) => selected[complaint.id]);
  }

  async function approveSelected() {
    const chosen = chosenComplaints();
    if (!chosen.length) return;
    let ok = 0;
    for (const complaint of chosen) {
      const saved = await moderate(
        complaint.id,
        "approved",
        {
          recipient_email: emails[complaint.id] ?? complaint.recipient_email ?? "",
          recipient_name: complaint.recipient_name ?? undefined,
        },
        true
      );
      if (saved) ok += 1;
    }
    toast.success(`${ok} aprobadas. El correo lo envías tú, sola o varias juntas.`);
    setSelected({});
    await load();
  }

  async function sendSelected() {
    const chosen = chosenComplaints();
    if (!chosen.length) return;
    if (chosen.some((complaint) => complaint.status !== "approved" && complaint.status !== "resolved")) {
      toast.error("Aprueba las quejas antes de enviarlas.");
      return;
    }
    const missing = chosen.filter(
      (complaint) => !(emails[complaint.id] ?? complaint.recipient_email)?.trim()
    );
    if (missing.length) {
      toast.error("Alguna queja seleccionada no tiene correo de destino.");
      return;
    }
    const groups = new Map<string, number>();
    for (const complaint of chosen) {
      const email = (emails[complaint.id] ?? complaint.recipient_email)!.trim().toLowerCase();
      groups.set(email, (groups.get(email) ?? 0) + 1);
    }
    const summary = [...groups.entries()]
      .map(([email, count]) => `${email} (${count})`)
      .join(", ");
    if (!confirm(`Se enviará desde tu correo: ${summary}.`)) return;

    const res = await fetch("/api/admin/send", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        items: chosen.map((complaint) => ({
          id: complaint.id,
          recipient_email: emails[complaint.id] ?? complaint.recipient_email ?? "",
          recipient_name: complaint.recipient_name ?? undefined,
        })),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "No se pudo enviar");
      return;
    }
    const results = (data.groups ?? []) as { status?: string; detail?: string }[];
    const sent = results.filter((result) => result.status === "sent");
    if (sent.length) toast.success(sent.map((result) => result.detail).join(" "));
    const pending = results.filter((result) => result.status !== "sent" && result.detail);
    if (pending.length) toast.message(pending.map((result) => result.detail).join(" "));
    setSelected({});
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
        <h1 className="font-display text-2xl font-bold">Administrador</h1>
        <p className="text-sm text-slate-500">
          Entra con el secreto ADMIN_SECRET. Apruebas las quejas y el correo a la
          administración lo envías tú, una a una o varias juntas.
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
    sent?: number;
  } | null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Aprobar y enviar</h1>
          <p className="text-sm text-slate-500">
            Aprobar publica la queja. El correo no sale solo: lo mandas tú, desde tu
            buzón, cuando quieras. Si marcas varias del mismo destino, van en un
            único mensaje.
          </p>
        </div>
        <Link href="/" className="text-sm text-sky-600">
          Salir al mapa
        </Link>
      </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {[
          ["Total", s?.total],
          ["En revisión", s?.pending],
          ["Aprobadas", s?.approved],
          ["Resueltas", s?.resolved],
          ["No publicadas", s?.rejected],
          ["Correos enviados", s?.sent],
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
            onClick={() => {
              setFilter(f);
              setSelected({});
            }}
          >
            {f === "all" ? "Todas" : STATUS_LABELS[f as keyof typeof STATUS_LABELS] ?? f}
          </Button>
        ))}
        <Button size="sm" variant="secondary" onClick={() => void load()}>
          Refrescar
        </Button>
      </div>

      {Object.values(selected).some(Boolean) && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 p-3 dark:border-sky-900 dark:bg-sky-950">
          <p className="text-sm font-medium text-sky-900 dark:text-sky-100">
            {Object.values(selected).filter(Boolean).length} seleccionadas
          </p>
          <Button size="sm" variant="outline" onClick={() => void approveSelected()}>
            Aprobar
          </Button>
          <Button size="sm" variant="success" onClick={() => void sendSelected()}>
            Enviar juntas
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected({})}>
            Quitar selección
          </Button>
        </div>
      )}

      <ul className="space-y-3">
        {complaints.map((c) => (
          <li
            key={c.id}
            className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <label className="mt-1 flex items-start">
                <input
                  type="checkbox"
                  className="mt-1 size-4"
                  checked={Boolean(selected[c.id])}
                  onChange={(event) =>
                    setSelected((current) => ({ ...current, [c.id]: event.target.checked }))
                  }
                  aria-label={`Seleccionar ${c.tracking_code}`}
                />
              </label>
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
                  <Badge variant="outline">{categoryMeta(c.category).label}</Badge>
                  {c.email_status && c.email_status !== "none" && (
                    <Badge variant="outline">{EMAIL_STATUS_LABELS[c.email_status]}</Badge>
                  )}
                </div>
                <h3 className="font-semibold">{c.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{c.description}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {c.anonymous_nickname} · {c.tracking_code} · {c.lat.toFixed(4)}, {c.lng.toFixed(4)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {[c.calle, c.barrio ? `Barrio ${c.barrio}` : "", c.municipio]
                    .filter(Boolean)
                    .join(" · ") || "Sin calle cercana"}
                  {" · "}
                  <a
                    href={`https://www.google.com/maps?q=${c.lat},${c.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-sky-700 underline"
                  >
                    Google Maps
                  </a>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {c.recipient_name || "Destino sin identificar"}
                  {c.recipient_email ? ` · ${c.recipient_email}` : " · sin buzón guardado"}
                </p>
                <Input
                  className="mt-2"
                  type="email"
                  placeholder="correo@administracion.es"
                  value={emails[c.id] ?? c.recipient_email ?? ""}
                  onChange={(e) =>
                    setEmails((current) => ({ ...current, [c.id]: e.target.value }))
                  }
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {c.status !== "approved" && c.status !== "resolved" && (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() =>
                      void moderate(c.id, "approved", {
                        recipient_email: emails[c.id] ?? c.recipient_email ?? "",
                        recipient_name: c.recipient_name ?? undefined,
                      })
                    }
                  >
                    Aprobar
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => void moderate(c.id, "resolved")}>
                  Resuelta
                </Button>
                <Button size="sm" variant="danger" onClick={() => void moderate(c.id, "rejected")}>
                  No publicar
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
