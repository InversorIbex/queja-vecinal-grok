import { ccaaKeyFrom } from "@/lib/directory";
import { haversineMeters } from "@/lib/geo";
import type { AdminLevel } from "@/types";

export interface RoadAtPoint {
  ref: string;
  name: string;
  owner: AdminLevel;
  pk: string | null;
}

interface OsmTags {
  ref?: string;
  nat_ref?: string;
  name?: string;
  highway?: string;
  operator?: string;
  network?: string;
  proposed?: string;
}

const HIGHWAY_RANK: Record<string, number> = {
  motorway: 1,
  motorway_link: 2,
  trunk: 3,
  trunk_link: 4,
  primary: 5,
  primary_link: 6,
  secondary: 7,
  secondary_link: 8,
  tertiary: 9,
  tertiary_link: 10,
  unclassified: 11,
};

const STATE_RINGS = new Set([
  "M-11",
  "M-12",
  "M-13",
  "M-21",
  "M-22",
  "M-23",
  "M-31",
  "M-40",
  "M-50",
  "SE-30",
  "SE-40",
  "V-30",
  "V-31",
  "Z-40",
  "B-10",
  "B-20",
  "B-23",
  "B-24",
  "B-30",
  "B-40",
]);

const AUTONOMIC_PREFIX: Record<string, RegExp> = {
  galicia: /^(?:AC|LU|OU|PO|AG|VG|CG)-/i,
  andalucia: /^A-\d{3,}/i,
  aragon: /^A-\d{3,}/i,
  cataluna: /^(?:C)-/i,
  valencia: /^(?:CV)-/i,
  madrid: /^(?:M)-/i,
  cyl: /^(?:CL)-/i,
  clm: /^(?:CM)-/i,
  extremadura: /^(?:EX)-/i,
  murcia: /^(?:RM)-/i,
  asturias: /^(?:AS)-/i,
  cantabria: /^(?:CA)-/i,
  navarra: /^(?:NA)-/i,
  rioja: /^(?:LR)-/i,
  baleares: /^(?:MA|ME|PM|EI)-/i,
  canarias: /^(?:TF|GC|FV|LZ|LP|HI)-/i,
};

const cache = new Map<string, RoadAtPoint | null>();

function tokens(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[;,]/)
    .map((part) => part.trim().toUpperCase().replace(/\s+/g, ""))
    .filter((part) => /^[A-Z]{1,3}-\d/.test(part));
}

function ownerFromOperator(operator: string | undefined): AdminLevel | "municipal" | null {
  if (!operator) return null;
  const text = operator.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/ayuntamiento|concello|ajuntament/.test(text)) return "municipal";
  if (/diputacion|deputacion/.test(text)) return "provincia";
  if (/ministerio|transportes|fomento|demarcacion de carreteras|gobierno de espana|administracion general del estado/.test(text)) {
    return "estado";
  }
  if (
    /xunta|junta de|generalitat|govern |gobierno vasco|gobierno de canarias|gobierno de navarra|gobierno de aragon|gobierno de cantabria|gobierno de la rioja|principado|comunidad de madrid|castilla y leon|castilla-la mancha|region de murcia|extremadura/.test(
      text
    )
  ) {
    return "comunidad";
  }
  return null;
}

function ownerFromNetwork(network: string | undefined): AdminLevel | null {
  if (!network) return null;
  if (/^ES:(N|A|AP)-/i.test(network)) return "estado";
  if (/provincial|diputaci/i.test(network)) return "provincia";
  if (/^[A-Z]{2}:/i.test(network)) return "comunidad";
  return null;
}

function ownerFromRef(ref: string, ccaaKey: string | null, highway: string | undefined): AdminLevel | null {
  if (ref === "M-30") return null;
  if (STATE_RINGS.has(ref) || /^(?:N|AP)-\d/.test(ref) || /^A-\d{1,2}[A-Z]?$/.test(ref)) return "estado";
  if (ccaaKey === "andalucia" && (ref === "SE-30" || ref === "SE-40")) return "estado";
  if (ccaaKey && AUTONOMIC_PREFIX[ccaaKey]?.test(ref)) {
    if (STATE_RINGS.has(ref)) return "estado";
    return "comunidad";
  }
  if (/^A-\d{3,}/.test(ref)) return ccaaKey === "andalucia" || ccaaKey === "aragon" ? "comunidad" : "estado";
  const rank = highway ? HIGHWAY_RANK[highway] : undefined;
  if (rank != null && rank <= HIGHWAY_RANK.unclassified && /^[A-Z]{1,3}-\d/.test(ref)) return "provincia";
  return null;
}

export function classifyRoadTags(
  tags: OsmTags,
  comunidad: string
): { ref: string; name: string; owner: AdminLevel } | null {
  if (tags.highway === "proposed" || tags.proposed) return null;
  if (tags.highway && !(tags.highway in HIGHWAY_RANK) && tags.highway !== "road") return null;

  const ccaaKey = ccaaKeyFrom(comunidad);
  const explicit = [...tokens(tags.ref), ...tokens(tags.nat_ref)];
  const stateRef = explicit.find((ref) => ownerFromRef(ref, ccaaKey, tags.highway) === "estado");
  if (stateRef) {
    return { ref: stateRef, name: tags.name?.trim() || stateRef, owner: "estado" };
  }

  const operator = ownerFromOperator(tags.operator);
  if (operator === "municipal") return null;
  const network = ownerFromNetwork(tags.network);
  const ref = explicit[0] || "";
  const owner = operator || network || (ref ? ownerFromRef(ref, ccaaKey, tags.highway) : null);
  if (!owner || !ref) return null;
  return { ref, name: tags.name?.trim() || ref, owner };
}

export function formatPk(raw: string | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(",", ".");
  const plus = cleaned.match(/^(\d+)\s*\+\s*(\d{1,3})$/);
  if (plus) return `PK ${plus[1]}+${plus[2].padStart(3, "0").slice(0, 3)}`;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value < 0 || value > 1500) return null;
  const km = Math.floor(value + 1e-9);
  const meters = Math.round((value - km) * 1000);
  if (meters <= 0) return `PK ${km}`;
  if (meters >= 1000) return `PK ${km + 1}`;
  return `PK ${km}+${String(meters).padStart(3, "0")}`;
}

function sameRef(a: string, b: string | undefined): boolean {
  if (!b) return false;
  const left = a.toUpperCase().replace(/\s+/g, "");
  return tokens(b).some((token) => token === left);
}

interface OverpassElement {
  type?: string;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: OsmTags & { distance?: string; pk?: string; milestone?: string };
}

async function overpass(lat: number, lng: number): Promise<OverpassElement[]> {
  const data = `[out:json][timeout:8];(way(around:30,${lat},${lng})["highway"]["ref"];node(around:500,${lat},${lng})["highway"="milestone"];);out tags center;`;
  const urls = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "User-Agent": "QuejasVecinales/1.0 (incidencias vecinales)",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ data }),
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { elements?: OverpassElement[] };
      return json.elements ?? [];
    } catch {
      continue;
    }
  }
  return [];
}

async function osmWayTags(wayId: number): Promise<OsmTags | null> {
  try {
    const [wayRes, relRes] = await Promise.all([
      fetch(`https://api.openstreetmap.org/api/0.6/way/${wayId}.json`, {
        headers: { "User-Agent": "QuejasVecinales/1.0 (incidencias vecinales)" },
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      }),
      fetch(`https://api.openstreetmap.org/api/0.6/way/${wayId}/relations.json`, {
        headers: { "User-Agent": "QuejasVecinales/1.0 (incidencias vecinales)" },
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      }),
    ]);
    if (!wayRes.ok) return null;
    const wayJson = (await wayRes.json()) as { elements?: { tags?: OsmTags }[] };
    const tags = { ...(wayJson.elements?.[0]?.tags ?? {}) };
    if (relRes.ok) {
      const relJson = (await relRes.json()) as { elements?: { tags?: OsmTags }[] };
      const route = relJson.elements?.find((item) => item.tags?.ref || item.tags?.operator || item.tags?.network);
      if (route?.tags) {
        tags.operator = tags.operator || route.tags.operator;
        tags.network = tags.network || route.tags.network;
        tags.name = tags.name || route.tags.name;
        tags.ref = tags.ref || route.tags.ref;
      }
    }
    return tags;
  } catch {
    return null;
  }
}

function nearestPk(elements: OverpassElement[], ref: string, lat: number, lng: number): string | null {
  let best: { meters: number; pk: string } | null = null;
  for (const element of elements) {
    if (element.type !== "node" || element.tags?.highway !== "milestone") continue;
    if (!sameRef(ref, element.tags.ref)) continue;
    const pointLat = element.lat ?? element.center?.lat;
    const pointLng = element.lon ?? element.center?.lon;
    if (pointLat == null || pointLng == null) continue;
    const meters = haversineMeters({ lat, lng }, { lat: pointLat, lng: pointLng });
    if (meters > 500) continue;
    const pk = formatPk(element.tags.distance || element.tags.pk || element.tags.milestone);
    if (!pk) continue;
    if (!best || meters < best.meters) best = { meters, pk };
  }
  return best?.pk ?? null;
}

function bestWay(elements: OverpassElement[], comunidad: string): { ref: string; name: string; owner: AdminLevel } | null {
  let best: { rank: number; road: { ref: string; name: string; owner: AdminLevel } } | null = null;
  for (const element of elements) {
    if (element.type !== "way" || !element.tags) continue;
    const road = classifyRoadTags(element.tags, comunidad);
    if (!road) continue;
    const rank = HIGHWAY_RANK[element.tags.highway || ""] ?? 20;
    if (!best || rank < best.rank) best = { rank, road };
  }
  return best?.road ?? null;
}

export async function resolveRoad(input: {
  lat: number;
  lng: number;
  comunidad: string;
  osmType?: string;
  osmId?: number;
  osmCategory?: string;
}): Promise<RoadAtPoint | null> {
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) return null;
  const key = `${input.lat.toFixed(4)},${input.lng.toFixed(4)}`;
  if (cache.has(key)) return cache.get(key) ?? null;

  try {
    const wayId =
      input.osmCategory === "highway" && input.osmType === "way" && input.osmId ? input.osmId : 0;
    const [elements, tags] = await Promise.all([
      overpass(input.lat, input.lng),
      wayId ? osmWayTags(wayId) : Promise.resolve(null),
    ]);
    const road = bestWay(elements, input.comunidad) || (tags ? classifyRoadTags(tags, input.comunidad) : null);
    if (!road) {
      if (elements.length > 0 || tags) cache.set(key, null);
      return null;
    }
    const found: RoadAtPoint = {
      ...road,
      pk: nearestPk(elements, road.ref, input.lat, input.lng),
    };
    cache.set(key, found);
    return found;
  } catch {
    return null;
  }
}
