import type { AdminLevel, ComplaintCategory, ReputationLevel } from "@/types";

export const APP_NAME = "QuejasVecinales";
export const APP_TAGLINE = "Tu barrio, tu voz";
/** Votar y comentar: hay que estar cerca del punto de la queja. */
export const MAX_DISTANCE_M = 10_000;
/** Publicar: el punto puede estar donde lo viste, dentro de este radio de donde estás ahora. */
export const REPORT_RADIUS_M = 20_000;
export const MAX_PHOTOS = 4;
export const MAX_PHOTO_BYTES = 800 * 1024;

export interface CategoryMeta {
  label: string;
  color: string;
  emoji: string;
  group: string;
  defaultLevel: AdminLevel;
  hint: string;
}

export const CATEGORIES: Record<ComplaintCategory, CategoryMeta> = {
  baches_carreteras: {
    label: "Baches y calzada",
    color: "#c2410c",
    emoji: "🕳️",
    group: "En tu calle",
    defaultLevel: "ayuntamiento",
    hint: "Socavones y asfalto roto en calles del municipio.",
  },
  aceras: {
    label: "Aceras y accesibilidad",
    color: "#9a3412",
    emoji: "🚶",
    group: "En tu calle",
    defaultLevel: "ayuntamiento",
    hint: "Baldosas sueltas, bordillos y pasos que no se pueden usar.",
  },
  mobiliario_urbano: {
    label: "Mobiliario urbano",
    color: "#0369a1",
    emoji: "🪑",
    group: "En tu calle",
    defaultLevel: "ayuntamiento",
    hint: "Bancos, papeleras, marquesinas y fuentes.",
  },
  parques_jardines: {
    label: "Parques y jardines",
    color: "#15803d",
    emoji: "🌳",
    group: "En tu calle",
    defaultLevel: "ayuntamiento",
    hint: "Zonas verdes, juegos infantiles y riego.",
  },
  arbolado: {
    label: "Árboles y ramas",
    color: "#166534",
    emoji: "🍃",
    group: "En tu calle",
    defaultLevel: "ayuntamiento",
    hint: "Árboles caídos, ramas peligrosas o alcorques vacíos.",
  },
  limpieza: {
    label: "Limpieza viaria",
    color: "#a16207",
    emoji: "🧹",
    group: "En tu calle",
    defaultLevel: "ayuntamiento",
    hint: "Suciedad, barrido y manchas en la calle.",
  },
  residuos: {
    label: "Basura y contenedores",
    color: "#854d0e",
    emoji: "🗑️",
    group: "En tu calle",
    defaultLevel: "ayuntamiento",
    hint: "Contenedores llenos, volcados o que no se recogen.",
  },
  iluminacion: {
    label: "Alumbrado público",
    color: "#ca8a04",
    emoji: "💡",
    group: "En tu calle",
    defaultLevel: "ayuntamiento",
    hint: "Farolas apagadas o zonas que se quedan a oscuras.",
  },
  senales: {
    label: "Señales y tráfico",
    color: "#b91c1c",
    emoji: "🚦",
    group: "En tu calle",
    defaultLevel: "ayuntamiento",
    hint: "Señales tapadas, semáforos y pasos de peatones.",
  },
  agua_saneamiento: {
    label: "Agua y alcantarillado",
    color: "#0e7490",
    emoji: "💧",
    group: "En tu calle",
    defaultLevel: "ayuntamiento",
    hint: "Fugas, imbornales atascados y olores de saneamiento.",
  },
  ruido: {
    label: "Ruido y molestias",
    color: "#7c3aed",
    emoji: "🔊",
    group: "En tu calle",
    defaultLevel: "ayuntamiento",
    hint: "Obras, locales o vehículos que no dejan descansar.",
  },
  animales: {
    label: "Animales en la vía",
    color: "#b45309",
    emoji: "🐾",
    group: "En tu calle",
    defaultLevel: "ayuntamiento",
    hint: "Plagas, colonias o animales abandonados.",
  },
  vandalismo: {
    label: "Pintadas y vandalismo",
    color: "#be123c",
    emoji: "🎨",
    group: "En tu calle",
    defaultLevel: "ayuntamiento",
    hint: "Grafitis, mobiliario roto a propósito o cristales.",
  },
  carreteras_provinciales: {
    label: "Carretera de la diputación",
    color: "#9f1239",
    emoji: "🛣️",
    group: "Tu provincia",
    defaultLevel: "provincia",
    hint: "Vías que unen municipios y dependen de la diputación.",
  },
  transporte: {
    label: "Transporte público",
    color: "#1d4ed8",
    emoji: "🚌",
    group: "Tu comunidad",
    defaultLevel: "comunidad",
    hint: "Autobús, metro o cercanías de competencia autonómica.",
  },
  sanidad: {
    label: "Sanidad",
    color: "#e11d48",
    emoji: "🏥",
    group: "Tu comunidad",
    defaultLevel: "comunidad",
    hint: "Centros de salud, esperas y servicios sanitarios públicos.",
  },
  educacion: {
    label: "Educación",
    color: "#4338ca",
    emoji: "🏫",
    group: "Tu comunidad",
    defaultLevel: "comunidad",
    hint: "Colegios e institutos públicos y su mantenimiento.",
  },
  servicios_sociales: {
    label: "Servicios sociales",
    color: "#0f766e",
    emoji: "🤝",
    group: "Tu comunidad",
    defaultLevel: "comunidad",
    hint: "Ayuda a domicilio, dependencia y servicios autonómicos.",
  },
  medio_ambiente: {
    label: "Medio ambiente",
    color: "#047857",
    emoji: "🌿",
    group: "Tu comunidad",
    defaultLevel: "comunidad",
    hint: "Vertidos, humos o espacios naturales de la comunidad.",
  },
  carreteras_autonomicas: {
    label: "Carretera autonómica",
    color: "#c026d3",
    emoji: "🚧",
    group: "Tu comunidad",
    defaultLevel: "comunidad",
    hint: "Carreteras cuya titularidad es de la comunidad autónoma.",
  },
  carreteras_estatales: {
    label: "Carretera del Estado",
    color: "#1e3a8a",
    emoji: "🇪🇸",
    group: "El Estado",
    defaultLevel: "estado",
    hint: "Autovías y carreteras nacionales del Ministerio de Transportes.",
  },
  costas: {
    label: "Costas y puertos",
    color: "#0369a1",
    emoji: "🌊",
    group: "El Estado",
    defaultLevel: "estado",
    hint: "Playas, costas y puertos de interés general.",
  },
  otros: {
    label: "Otra cosa",
    color: "#475569",
    emoji: "✏️",
    group: "Otra cosa",
    defaultLevel: "ayuntamiento",
    hint: "Si no encaja arriba, cuéntalo en una frase. Tú eliges a quién va.",
  },
};

export function categoryMeta(id: string | undefined | null): CategoryMeta {
  if (id && id in CATEGORIES) return CATEGORIES[id as ComplaintCategory];
  return CATEGORIES.otros;
}

export const CATEGORY_GROUPS = [
  "En tu calle",
  "Tu provincia",
  "Tu comunidad",
  "El Estado",
  "Otra cosa",
] as const;

export const ADMIN_LEVELS: Record<AdminLevel, string> = {
  ayuntamiento: "Ayuntamiento",
  provincia: "Diputación provincial",
  comunidad: "Comunidad autónoma",
  estado: "Gobierno de España",
};

export const ADMIN_LEVEL_HINTS: Record<AdminLevel, string> = {
  ayuntamiento: "Calles, limpieza, farolas, parques y lo cotidiano del municipio.",
  provincia: "Carreteras y servicios que dependen de la diputación.",
  comunidad: "Sanidad, educación, transporte y carreteras autonómicas.",
  estado: "Carreteras nacionales, costas y competencias del Gobierno.",
};

export const STATUS_LABELS = {
  pending: "En revisión",
  approved: "Aprobada",
  rejected: "No publicada",
  resolved: "Resuelta",
} as const;

export const EMAIL_STATUS_LABELS = {
  none: "Sin enviar",
  sent: "Correo enviado",
  failed: "Falló el envío",
  no_mailbox: "Falta el buzón",
  no_smtp: "Falta configurar el correo",
} as const;

export const REPUTATION_THRESHOLDS: {
  level: ReputationLevel;
  min: number;
}[] = [
  { level: "Novato", min: 0 },
  { level: "Vecino Activo", min: 50 },
  { level: "Vigilante", min: 150 },
  { level: "Referente", min: 300 },
  { level: "Experto Vecinal", min: 500 },
];

export const POINTS = {
  complaintApproved: 15,
  voteReal: 2,
  voteFake: 1,
  comment: 3,
  complaintResolvedBonus: 10,
} as const;

/** Madrid centro — fallback demo si no hay geolocalización */
export const DEMO_CENTER = { lat: 40.4168, lng: -3.7038 };
