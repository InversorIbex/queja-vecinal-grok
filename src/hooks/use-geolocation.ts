"use client";

import { useCallback, useEffect, useState } from "react";
import { getCurrentPosition } from "@/lib/geo";
import type { GeoPosition } from "@/types";

/**
 * Device GPS only. Never invents a town (Madrid/Foz/etc.) on deny/error —
 * position stays null so the 10 km circle is not drawn at a false center.
 * Session cache is only used when it was a prior successful GPS fix.
 */
export function useGeolocation(auto = true) {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(auto);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      setPosition(pos);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("qv_pos", JSON.stringify(pos));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error de ubicación";
      setError(msg);
      const cached =
        typeof window !== "undefined"
          ? sessionStorage.getItem("qv_pos")
          : null;
      if (cached) {
        try {
          setPosition(JSON.parse(cached) as GeoPosition);
        } catch {
          setPosition(null);
        }
      } else {
        setPosition(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auto) void refresh();
  }, [auto, refresh]);

  return { position, error, loading, refresh };
}
