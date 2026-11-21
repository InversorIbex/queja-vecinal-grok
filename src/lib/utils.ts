import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function randomNickname(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `Vecino_${n}`;
}

export function getOrCreateNickname(): string {
  if (typeof window === "undefined") return randomNickname();
  const key = "qv_nickname";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const nick = randomNickname();
  localStorage.setItem(key, nick);
  return nick;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function isDemoMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url.startsWith("http")) return true;
  if (typeof window !== "undefined") return false;
  return !process.env.SUPABASE_SERVICE_ROLE_KEY;
}

/** La anon key tiene que ser un JWT. Si falta, la web sigue por API y se apaga el realtime. */
export function hasSupabaseAnon(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return url.startsWith("http") && key.startsWith("eyJ");
}

export function siteOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").trim();
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, "");
}

export interface SavedTracking {
  code: string;
  title: string;
  at: string;
}

export function rememberTracking(entry: SavedTracking): void {
  if (typeof window === "undefined") return;
  const prev = readTracking().filter((item) => item.code !== entry.code);
  localStorage.setItem("qv_tracking", JSON.stringify([entry, ...prev].slice(0, 20)));
}

export function readTracking(): SavedTracking[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem("qv_tracking") || "[]") as SavedTracking[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
