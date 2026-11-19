"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** ≥1024px — desktop / landscape tablet web layout */
export function useIsDesktop() {
  return useMediaQuery("(min-width: 1024px)");
}

/** Landscape orientation (phone or desktop) */
export function useIsLandscape() {
  return useMediaQuery("(orientation: landscape)");
}
