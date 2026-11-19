export type UserRole = "user" | "admin" | "super_admin";

export type ComplaintStatus = "pending" | "approved" | "rejected" | "resolved";

/** Valores API sincronizados con Flutter `ComplaintCategory` / SQL CHECK. */
export const COMPLAINT_CATEGORY_VALUES = [
  "baches_carreteras",
  "mobiliario_urbano",
  "parques_jardines",
  "limpieza",
  "iluminacion",
  "senales",
  "agua_alcantarillado",
  "ruido",
  "animales_plagas",
  "transporte_publico",
  "accesibilidad",
  "obras_andamios",
  "contenedores",
  "grafitis_vandalismo",
  "aparcamiento_semaforos",
  "contaminacion",
  "seguridad_ciudadana",
  "playas_costa",
  "otros",
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORY_VALUES)[number];

export type AdminLevel =
  | "ayuntamiento"
  | "provincia"
  | "comunidad"
  | "estado";

export type VoteType = "real" | "fake" | "resolved";

export type ReputationLevel =
  | "Novato"
  | "Vecino Activo"
  | "Vigilante"
  | "Referente"
  | "Experto Vecinal";

export interface Profile {
  id: string;
  nickname: string;
  email?: string | null;
  role: UserRole;
  banned: boolean;
  reputation_points: number;
  reputation_level: ReputationLevel;
  avatar_url?: string | null;
  push_enabled: boolean;
  created_at: string;
}

export interface Complaint {
  id: string;
  author_id?: string | null;
  anonymous_nickname: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  admin_level: AdminLevel;
  status: ComplaintStatus;
  lat: number;
  lng: number;
  photos: string[];
  votes_real: number;
  votes_fake: number;
  votes_resolved: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  moderated_at?: string | null;
}

export interface Vote {
  id: string;
  complaint_id: string;
  voter_nickname: string;
  vote_type: VoteType;
  distance_m: number;
  created_at: string;
}

export interface Comment {
  id: string;
  complaint_id: string;
  author_nickname: string;
  body: string;
  distance_m: number;
  created_at: string;
}

export interface Report {
  id: string;
  complaint_id?: string | null;
  comment_id?: string | null;
  reporter_nickname: string;
  reason: string;
  status: "open" | "reviewed" | "dismissed";
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  min_points: number;
}

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface RankingEntry {
  nickname: string;
  reputation_points: number;
  reputation_level: ReputationLevel;
  complaints_count: number;
}
