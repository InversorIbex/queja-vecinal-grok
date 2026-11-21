export type UserRole = "user" | "admin";

export type ComplaintStatus = "pending" | "approved" | "rejected" | "resolved";

export const COMPLAINT_CATEGORIES = [
  "baches_carreteras",
  "aceras",
  "mobiliario_urbano",
  "parques_jardines",
  "arbolado",
  "limpieza",
  "residuos",
  "iluminacion",
  "senales",
  "agua_saneamiento",
  "ruido",
  "animales",
  "vandalismo",
  "transporte",
  "sanidad",
  "educacion",
  "servicios_sociales",
  "medio_ambiente",
  "carreteras_provinciales",
  "carreteras_autonomicas",
  "carreteras_estatales",
  "costas",
  "otros",
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export type EmailStatus = "none" | "sent" | "failed" | "no_mailbox" | "no_smtp";

export type ComplaintEventKind =
  | "created"
  | "approved"
  | "rejected"
  | "resolved"
  | "email_sent"
  | "email_failed"
  | "note";

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
  role: UserRole;
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
  category_detail?: string | null;
  admin_level: AdminLevel;
  status: ComplaintStatus;
  lat: number;
  lng: number;
  photos: string[];
  tracking_code: string;
  municipio?: string | null;
  provincia?: string | null;
  comunidad?: string | null;
  calle?: string | null;
  barrio?: string | null;
  recipient_name?: string | null;
  recipient_email?: string | null;
  mailbox_key?: string | null;
  reporter_email?: string | null;
  email_status?: EmailStatus;
  email_sent_at?: string | null;
  email_error?: string | null;
  votes_real: number;
  votes_fake: number;
  votes_resolved: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  moderated_at?: string | null;
}

export interface ComplaintEvent {
  id: string;
  complaint_id: string;
  kind: ComplaintEventKind;
  message: string;
  created_at: string;
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
