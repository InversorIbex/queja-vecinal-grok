"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, MapPinned, Megaphone } from "lucide-react";
import type { Complaint } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORIES } from "@/lib/constants";

export default function ImpactoPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    void fetch("/api/complaints?status=public")
      .then((r) => r.json())
      .then((d) => setComplaints(d.complaints ?? []));
  }, []);

  const resolved = complaints.filter((c) => c.status === "resolved").length;
  const approved = complaints.filter((c) => c.status === "approved").length;
  const votes = complaints.reduce(
    (a, c) => a + c.votes_real + c.votes_fake + c.votes_resolved,
    0
  );

  const byCat = Object.entries(CATEGORIES)
    .map(([key, meta]) => ({
      key,
      label: meta.label,
      color: meta.color,
      count: complaints.filter((c) => c.category === key).length,
    }))
    .filter((item) => item.count > 0);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold">Impacto vecinal</h1>
        <p className="mt-2 max-w-2xl text-slate-500">
          Lo que la comunidad ha reportado y resuelto. Los mismos números en la PWA
          móvil y en la web de escritorio.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Megaphone, label: "Quejas activas", value: approved, color: "text-sky-600" },
          { icon: CheckCircle2, label: "Resueltas", value: resolved, color: "text-emerald-600" },
          { icon: MapPinned, label: "Votos totales", value: votes, color: "text-orange-600" },
          {
            icon: Clock,
            label: "En el mapa",
            value: complaints.length,
            color: "text-slate-600",
          },
        ].map(({ icon: Icon, label, value, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Icon className={`h-4 w-4 ${color}`} />
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl font-bold">{value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <section>
        <h2 className="font-display mb-4 text-xl font-semibold">Por categoría</h2>
        <div className="space-y-3">
          {byCat.map((c) => {
            const pct =
              complaints.length === 0
                ? 0
                : Math.round((c.count / complaints.length) * 100);
            return (
              <div key={c.key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{c.label}</span>
                  <span className="text-slate-500">
                    {c.count} ({pct}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: c.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
