const WATER_MESSAGE =
  "Ese punto está en el agua. La queja tiene que ir en tierra.";

const cache = new Map<string, boolean>();

/**
 * true = tierra, false = agua, null = no se pudo comprobar.
 * Si el servicio falla, no bloqueamos: un corte no impide publicar en tierra.
 */
export async function isOnLand(lat: number, lng: number): Promise<boolean | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  try {
    const res = await fetch(
      `https://is-on-water.balbona.me/api/v1/get/${lat}/${lng}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "QuejasVecinales/1.0 (incidencias vecinales)",
        },
        signal: AbortSignal.timeout(4000),
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { isWater?: unknown };
    if (typeof data.isWater !== "boolean") return null;
    const onLand = !data.isWater;
    cache.set(key, onLand);
    return onLand;
  } catch {
    return null;
  }
}

export async function assertOnLand(
  lat: number,
  lng: number
): Promise<{ ok: true } | { ok: false; message: string }> {
  const onLand = await isOnLand(lat, lng);
  if (onLand === false) return { ok: false, message: WATER_MESSAGE };
  return { ok: true };
}

export { WATER_MESSAGE };
