import type {
  AdminLevel,
  ComplaintCategory,
  ReputationLevel,
} from "@/types";

export const APP_NAME = "QuejasVecinales";
export const APP_TAGLINE = "Tu barrio, tu voz";
/** Radio máx. GPS ↔ pin elegido (crear / votar / comentar). */
export const MAX_DISTANCE_M = 10_000;
/**
 * Radio del círculo de ofuscación del pin público (~diámetro 20 km).
 * El GPS del dispositivo nunca se persiste; solo este punto aproximado.
 */
export const LOCATION_PRIVACY_RADIUS_M = 10_000;
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
  agua_alcantarillado: { label: "Agua y alcantarillado", color: "#0e7490" },
  ruido: { label: "Ruido", color: "#7c2d12" },
  animales_plagas: { label: "Animales / plagas", color: "#4d7c0f" },
  transporte_publico: { label: "Transporte público", color: "#1d4ed8" },
  accesibilidad: { label: "Accesibilidad", color: "#7e22ce" },
  obras_andamios: { label: "Obras y andamios", color: "#b45309" },
  contenedores: { label: "Contenedores", color: "#3f6212" },
  grafitis_vandalismo: { label: "Grafitis / vandalismo", color: "#9f1239" },
  aparcamiento_semaforos: { label: "Aparcamiento / semáforos", color: "#c2410c" },
  contaminacion: { label: "Contaminación", color: "#57534e" },
  seguridad_ciudadana: { label: "Seguridad ciudadana", color: "#1e3a8a" },
  playas_costa: { label: "Playas / costa", color: "#0891b2" },
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

export const ROLE_LABELS = {
  user: "Usuario",
  admin: "Admin",
  super_admin: "Super admin",
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

/**
 * Viewport inicial del mapa cuando aún no hay GPS del dispositivo.
 * Nunca usarlo como posición del usuario ni para el círculo de 10 km.
 */
export const MAP_DEFAULT_CENTER = { lat: 40.4168, lng: -3.7038 };

/** @deprecated Prefer MAP_DEFAULT_CENTER — no es la ubicación del usuario */
export const DEMO_CENTER = MAP_DEFAULT_CENTER;
