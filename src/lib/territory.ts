import { directoryOffice, type RoutedOffice } from "@/lib/directory";
import { getSavedMailbox } from "@/lib/mailboxes";
import type { AdminLevel, ComplaintCategory } from "@/types";

export interface Territory {
  municipio: string;
  provincia: string;
  comunidad: string;
  calle: string;
  barrio: string;
  label: string;
}

const cache = new Map<string, Territory>();

const EMPTY: Territory = {
  municipio: "",
  provincia: "",
  comunidad: "",
  calle: "",
  barrio: "",
  label: "",
};

function firstAddress(address: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = address[key]?.trim();
    if (value) return value;
  }
  return "";
}

export async function resolveTerritory(lat: number, lng: number): Promise<Territory> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return EMPTY;
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("zoom", "18");
    url.searchParams.set("accept-language", "es");
    const res = await fetch(url, {
      headers: {
        "User-Agent": "QuejasVecinales/1.0 (incidencias vecinales)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!res.ok) return EMPTY;
    const data = (await res.json()) as {
      name?: string;
      category?: string;
      display_name?: string;
      address?: Record<string, string>;
    };
    const address = data.address ?? {};
    const municipio = firstAddress(address, [
      "city",
      "town",
      "village",
      "municipality",
      "hamlet",
    ]);
    const barrio = firstAddress(address, [
      "neighbourhood",
      "suburb",
      "quarter",
      "city_district",
      "residential",
    ]);
    let calle = firstAddress(address, ["road", "pedestrian", "footway", "path", "cycleway"]);
    if (!calle && data.category === "highway" && data.name) calle = data.name;
    const territory: Territory = {
      municipio,
      provincia: firstAddress(address, ["province", "county", "state_district"]),
      comunidad: address.state || "",
      calle,
      barrio: barrio && barrio !== municipio ? barrio : "",
      label: data.display_name || "",
    };
    cache.set(cacheKey, territory);
    return territory;
  } catch {
    return EMPTY;
  }
}

export async function routeComplaint(input: {
  level: AdminLevel;
  category: ComplaintCategory;
  territory: Territory;
}): Promise<RoutedOffice & { source: "saved" | "directory" | "unknown" }> {
  const office = directoryOffice({
    level: input.level,
    category: input.category,
    municipio: input.territory.municipio,
    provincia: input.territory.provincia,
    comunidad: input.territory.comunidad,
  });
  const saved = await getSavedMailbox(office.key);
  if (saved) {
    return {
      ...office,
      name: saved.name || office.name,
      email: saved.email,
      source: "saved",
    };
  }
  if (office.email) return { ...office, source: "directory" };
  return { ...office, source: "unknown" };
}
