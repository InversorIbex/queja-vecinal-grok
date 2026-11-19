"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { DEMO_RANKINGS } from "@/lib/demo-data";
import { nextLevelInfo } from "@/lib/reputation";
import type { RankingEntry } from "@/types";
import { Badge } from "@/components/ui/badge";

export default function RankingsPage() {
  const [entries, setEntries] = useState<RankingEntry[]>([]);

  useEffect(() => {
    setEntries(DEMO_RANKINGS);
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
      <div>
        <h1 className="font-display flex items-center gap-2 text-3xl font-bold">
          <Trophy className="h-8 w-8 text-orange-500" />
          Rankings
        </h1>
        <p className="mt-2 text-slate-500">
          Reputación por puntos: Novato → Experto Vecinal. Se calcula igual en
          móvil y web.
        </p>
      </div>

      <ol className="space-y-3">
        {entries.map((e, i) => {
          const info = nextLevelInfo(e.reputation_points);
          return (
            <motion.li
              key={e.nickname}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80"
            >
              <span className="font-display flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-lg font-bold text-sky-800 dark:bg-sky-900/50 dark:text-sky-200">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{e.nickname}</p>
                  <Badge>{e.reputation_level}</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {e.reputation_points} pts · {e.complaints_count} quejas
                  {info.next ? ` · ${info.remaining} para ${info.next}` : ""}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${info.progress}%` }}
                  />
                </div>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
