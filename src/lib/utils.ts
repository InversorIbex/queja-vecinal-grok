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
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
