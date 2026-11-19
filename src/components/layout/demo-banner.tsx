"use client";

import { useEffect, useState } from "react";

/**
 * Asks the server (canonical SUPABASE_URL / ANON_KEY + NEXT_PUBLIC mirrors)
 * instead of trusting only inlined NEXT_PUBLIC_* in the browser bundle.
 * Cursor Secrets / Vercel runtime env are visible to `/api/status`.
 */
export function DemoBanner() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/status");
        if (!res.ok) return;
        const data = (await res.json()) as { demo?: boolean };
        if (!cancelled) setDemo(Boolean(data.demo));
      } catch {
        /* keep hidden on network errors — avoid false demo banner */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  if (!demo) return null;
  return (
    <div className="bg-amber-500/15 px-3 py-1.5 text-center text-xs font-medium text-amber-800 dark:text-amber-200">
      Modo demo: sin Supabase. Los datos son locales y se sincronizan entre pestañas del
      mismo origen. Configura el `.env` para móvil + web con la misma base de datos.
    </div>
  );
}
