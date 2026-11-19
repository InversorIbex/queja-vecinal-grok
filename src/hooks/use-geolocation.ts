"use client";

import { useCallback, useEffect, useState } from "react";
import { getCurrentPosition } from "@/lib/geo";
import { DEMO_CENTER } from "@/lib/constants";
import type { GeoPosition } from "@/types";

export function useGeolocation(auto = true) {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(auto);
  const [usingDemo, setUsingDemo] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      setPosition(pos);
      setUsingDemo(false);
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
        setPosition(JSON.parse(cached) as GeoPosition);
        setUsingDemo(false);
      } else {
        setPosition(DEMO_CENTER);
        setUsingDemo(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auto) void refresh();
  }, [auto, refresh]);

  return { position, error, loading, usingDemo, refresh };
}
