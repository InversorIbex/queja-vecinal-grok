"use client";

/**
 * Sincronización móvil ↔ web: misma fuente de verdad (Supabase o demo store vía API).
 * Polling ligero + BroadcastChannel para pestañas del mismo origen.
 * Con Supabase Realtime configurado, suscribirse a `complaints` / `votes` / `comments`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useComplaintsSync(onInvalidate: () => void, intervalMs = 8000) {
  const cb = useRef(onInvalidate);
  cb.current = onInvalidate;
  const [syncLabel, setSyncLabel] = useState("Sincronizado");

  const bump = useCallback((reason: string) => {
    setSyncLabel(reason);
    cb.current();
    setTimeout(() => setSyncLabel("Sincronizado"), 1500);
  }, []);

  useEffect(() => {
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("qv-sync")
        : null;

    const onMsg = () => bump("Actualizado");
    channel?.addEventListener("message", onMsg);

    const sb = createClient();
    let realtimeCleanup: (() => void) | undefined;

    if (sb) {
      const rt = sb
        .channel("qv-complaints")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "complaints" },
          () => bump("En vivo")
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "votes" },
          () => bump("En vivo")
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "comments" },
          () => bump("En vivo")
        )
        .subscribe();
      realtimeCleanup = () => {
        void sb.removeChannel(rt);
      };
    }

    const timer = setInterval(() => {
      if (!sb) bump("Sincronizando…");
    }, intervalMs);

    return () => {
      channel?.removeEventListener("message", onMsg);
      channel?.close();
      clearInterval(timer);
      realtimeCleanup?.();
    };
  }, [bump, intervalMs]);

  const broadcastLocal = useCallback(() => {
    try {
      new BroadcastChannel("qv-sync").postMessage({ t: Date.now() });
    } catch {
      /* ignore */
    }
    bump("Actualizado");
  }, [bump]);

  return { syncLabel, broadcastLocal };
}
