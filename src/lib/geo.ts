import { MAX_DISTANCE_M } from "./constants";
import type { GeoPosition } from "@/types";

const EARTH_RADIUS_M = 6_371_000;

/** Haversine distance in meters (client + server validation). */
export function haversineMeters(
  a: GeoPosition,
  b: GeoPosition
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function within10km(a: GeoPosition, b: GeoPosition): boolean {
  return haversineMeters(a, b) <= MAX_DISTANCE_M;
}

export function getCurrentPosition(
  options?: PositionOptions
): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("La geolocalización no está disponible en este dispositivo."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => {
        const messages: Record<number, string> = {
          1: "Permiso de ubicación denegado. Actívalo para crear o votar quejas.",
          2: "No se pudo obtener tu ubicación. Inténtalo de nuevo.",
          3: "Tiempo de espera agotado al obtener la ubicación.",
        };
        reject(new Error(messages[err.code] ?? "Error de geolocalización."));
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 30_000,
        ...options,
      }
    );
  });
}

export function assertWithin10km(
  user: GeoPosition,
  target: GeoPosition,
  action = "realizar esta acción"
): { ok: true; distance_m: number } | { ok: false; distance_m: number; message: string } {
  const distance_m = haversineMeters(user, target);
  if (distance_m > MAX_DISTANCE_M) {
    return {
      ok: false,
      distance_m,
      message: `Estás a ${(distance_m / 1000).toFixed(1)} km. Debes estar a ≤10 km para ${action}.`,
    };
  }
  return { ok: true, distance_m };
}
