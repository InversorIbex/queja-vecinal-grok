import type {
  AdminLevel,
  ComplaintCategory,
  ReputationLevel,
} from "@/types";

export const APP_NAME = "QuejasVecinales";
export const APP_TAGLINE = "Tu barrio, tu voz";
export const MAX_DISTANCE_M = 10_000;
export const MAX_PHOTOS = 4;
export const MAX_PHOTO_BYTES = 800 * 1024;

export const CATEGORIES: Record<
  ComplaintCategory,
  { label: string; color: string }
> = {
  baches_carreteras: { label: "Baches y carreteras", color: "#c2410c" },
  mobiliario_urbano: { label: "Mobiliario urbano", color: "#0369a1" },
  parques_jardines: { label: "Parques y jardines", color: "#15803d" },
  limpieza: { label: "Limpieza", color: "#a16207" },
  iluminacion: { label: "Iluminación", color: "#ca8a04" },
  senales: { label: "Señales", color: "#b91c1c" },
  otros: { label: "Otros", color: "#475569" },
};

export const ADMIN_LEVELS: Record<AdminLevel, string> = {
  ayuntamiento: "Ayuntamiento",
  provincia: "Provincia (Diputación)",
  comunidad: "Comunidad Autónoma",
  estado: "Estado (Gobierno de España)",
};

export const STATUS_LABELS = {
  pending: "Pendiente de moderación",
  approved: "Aprobada",
  rejected: "Rechazada",
  resolved: "Resuelta",
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
