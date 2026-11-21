"use client";

import { useEffect, useState } from "react";

export function DemoBanner() {
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    setDemo(!url.startsWith("http"));
  }, []);
  if (!demo) return null;
  return (
    <div className="bg-amber-500/15 px-3 py-1.5 text-center text-xs font-medium text-amber-800 dark:text-amber-200">
      Modo demo: sin Supabase. Los datos son locales y se sincronizan entre pestañas del
      mismo origen. Configura el `.env` para móvil + web con la misma base de datos.
    </div>
  );
}
