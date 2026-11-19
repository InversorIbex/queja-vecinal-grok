import { LOCATION_PRIVACY_RADIUS_M, MAX_DISTANCE_M } from "./constants";
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

/**
 * Pin público ofuscado: punto uniforme dentro de un círculo de radio ~10 km
 * (diámetro ~20 km) centrado en la ubicación elegida.
 * Nunca persistir el GPS exacto del dispositivo.
 *
 * Si se pasa `seed`, el punto es estable/reproducible (hash FNV-1a del seed).
 */
export function obfuscateLocation(
  center: GeoPosition,
  seed?: string,
  radiusM: number = LOCATION_PRIVACY_RADIUS_M
): GeoPosition {
  const u = seed ? seededUnit(seed, 0) : Math.random();
  const v = seed ? seededUnit(seed, 1) : Math.random();
  // Uniforme en el disco: r = R * sqrt(u)
  const r = radiusM * Math.sqrt(u);
  const theta = 2 * Math.PI * v;
  const northM = r * Math.cos(theta);
  const eastM = r * Math.sin(theta);
  const dLat = (northM / EARTH_RADIUS_M) * (180 / Math.PI);
  const cosLat = Math.cos((center.lat * Math.PI) / 180);
  const dLng =
    (eastM / (EARTH_RADIUS_M * Math.max(0.01, cosLat))) * (180 / Math.PI);
  return {
    lat: clamp(center.lat + dLat, -90, 90),
    lng: wrapLng(center.lng + dLng),
  };
}

function seededUnit(seed: string, lane: number): number {
  let h = 0x811c9dc5 ^ (lane * 0x9e3779b9);
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Mix bits → [0, 1)
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return (h >>> 0) / 0x100000000;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function wrapLng(lng: number) {
  const x = ((((lng + 180) % 360) + 360) % 360) - 180;
  return x === -180 ? 180 : x;
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
