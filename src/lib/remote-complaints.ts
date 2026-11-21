import { randomUUID } from "crypto";
import { assertWithinVerifyRadius, haversineMeters } from "@/lib/geo";
import { createServiceClient } from "@/lib/supabase/server";
import { makeTrackingCode } from "@/lib/tracking";
import { COMPLAINT_CATEGORIES } from "@/types";
import type {
  AdminLevel,
  Comment,
  Complaint,
  ComplaintCategory,
  ComplaintEvent,
  ComplaintStatus,
  EmailStatus,
  VoteType,
} from "@/types";

/**
 * El proyecto de Supabase ya tiene `complaints` con id entero, `comment` y
 * `author_alias` (0 filas). Guardamos el resto (título, destino, seguimiento,
 * comentarios y votos) en `moderation_note` para no pedir otro esquema.
 */

interface Meta {
  v: 1;
  title: string;
  description: string;
  category_detail: string | null;
  admin_level: AdminLevel;
  tracking_code: string;
  comunidad: string | null;
  calle: string | null;
  barrio: string | null;
  via_ref?: string | null;
  via_name?: string | null;
  via_pk?: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  mailbox_key: string | null;
  reporter_email: string | null;
  email_status: EmailStatus;
  email_sent_at: string | null;
  email_error: string | null;
  votes_resolved: number;
  anonymous_nickname: string;
  updated_at: string;
  comments: Comment[];
  events: ComplaintEvent[];
  voters: { nickname: string; vote_type: VoteType }[];
}

interface RemoteRow {
  id: number;
  lat: number;
  lng: number;
  category: string;
  comment: string | null;
  photos: string | null;
  ccaa: string | null;
  provincia: string | null;
  municipio: string | null;
  municipio_code: string | null;
  location_source: string | null;
  status: string;
  author_alias: string | null;
  created_at: string;
  moderated_at: string | null;
  real_votes: number | null;
  fake_votes: number | null;
  moderation_note: string | null;
}

const SELECT =
  "id,lat,lng,category,comment,photos,ccaa,provincia,municipio,municipio_code,location_source,status,author_alias,created_at,moderated_at,real_votes,fake_votes,moderation_note";

function client() {
  const sb = createServiceClient();
  if (!sb) throw new Error("Supabase no está configurado");
  return sb;
}

function asCategory(value: string | undefined): ComplaintCategory {
  if (value && (COMPLAINT_CATEGORIES as readonly string[]).includes(value)) {
    return value as ComplaintCategory;
  }
  return "otros";
}

function asStatus(value: string | undefined): ComplaintStatus {
  if (value === "approved" || value === "rejected" || value === "resolved" || value === "pending") {
    return value;
  }
  return "pending";
}

function parsePhotos(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === "string");
  } catch {
    /* una sola url */
  }
  return value.startsWith("http") ? [value] : [];
}

function parseMeta(raw: string | null): Meta | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Meta;
    if (data && data.v === 1 && typeof data.title === "string") return data;
  } catch {
    /* texto libre antiguo */
  }
  return null;
}

function toComplaint(row: RemoteRow): Complaint {
  const meta = parseMeta(row.moderation_note);
  const description = meta?.description || row.comment || "";
  return {
    id: String(row.id),
    anonymous_nickname: meta?.anonymous_nickname || row.author_alias || "Vecino",
    title: meta?.title || description.slice(0, 80) || "Queja",
    description,
    category: asCategory(row.category),
    category_detail: meta?.category_detail ?? null,
    admin_level: meta?.admin_level ?? "ayuntamiento",
    status: asStatus(row.status),
    lat: row.lat,
    lng: row.lng,
    photos: parsePhotos(row.photos),
    tracking_code: meta?.tracking_code || row.location_source || `QV-${row.id}`,
    municipio: row.municipio,
    provincia: row.provincia,
    comunidad: meta?.comunidad || row.ccaa,
    calle: meta?.calle ?? null,
    barrio: meta?.barrio ?? null,
    via_ref: meta?.via_ref ?? null,
    via_name: meta?.via_name ?? null,
    via_pk: meta?.via_pk ?? null,
    recipient_name: meta?.recipient_name ?? null,
    recipient_email: meta?.recipient_email ?? null,
    mailbox_key: meta?.mailbox_key || row.municipio_code,
    reporter_email: meta?.reporter_email ?? null,
    email_status: meta?.email_status ?? "none",
    email_sent_at: meta?.email_sent_at ?? null,
    email_error: meta?.email_error ?? null,
    votes_real: row.real_votes ?? 0,
    votes_fake: row.fake_votes ?? 0,
    votes_resolved: meta?.votes_resolved ?? 0,
    comments_count: meta?.comments?.length ?? 0,
    created_at: row.created_at,
    updated_at: meta?.updated_at || row.created_at,
    moderated_at: row.moderated_at,
  };
}

async function loadRow(id: string): Promise<{ row: RemoteRow; meta: Meta } | null> {
  const numeric = Number(id);
  if (!Number.isInteger(numeric)) return null;
  const { data, error } = await client()
    .from("complaints")
    .select(SELECT)
    .eq("id", numeric)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as RemoteRow;
  const meta = parseMeta(row.moderation_note) ?? emptyMeta(row);
  return { row, meta };
}

function emptyMeta(row: RemoteRow): Meta {
  return {
    v: 1,
    title: (row.comment || "Queja").slice(0, 80),
    description: row.comment || "",
    category_detail: null,
    admin_level: "ayuntamiento",
    tracking_code: row.location_source || `QV-${row.id}`,
    comunidad: row.ccaa,
    calle: null,
    barrio: null,
    via_ref: null,
    via_name: null,
    via_pk: null,
    recipient_name: null,
    recipient_email: null,
    mailbox_key: row.municipio_code,
    reporter_email: null,
    email_status: "none",
    email_sent_at: null,
    email_error: null,
    votes_resolved: 0,
    anonymous_nickname: row.author_alias || "Vecino",
    updated_at: row.created_at,
    comments: [],
    events: [],
    voters: [],
  };
}

async function saveMeta(id: number, meta: Meta, extra: Record<string, unknown> = {}) {
  meta.updated_at = new Date().toISOString();
  const { error } = await client()
    .from("complaints")
    .update({
      moderation_note: JSON.stringify(meta),
      comment: meta.description,
      location_source: meta.tracking_code,
      municipio_code: meta.mailbox_key,
      ccaa: meta.comunidad,
      ...extra,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function legacyListComplaints(opts?: {
  status?: ComplaintStatus | "public";
  category?: ComplaintCategory;
}): Promise<Complaint[]> {
  let query = client().from("complaints").select(SELECT).order("created_at", { ascending: false });
  if (opts?.status === "public") query = query.in("status", ["approved", "resolved"]);
  else if (opts?.status) query = query.eq("status", opts.status);
  if (opts?.category) query = query.eq("category", opts.category);
  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as RemoteRow[]).map(toComplaint);
}

export async function legacyGetComplaint(id: string): Promise<Complaint | null> {
  const loaded = await loadRow(id);
  return loaded ? toComplaint(loaded.row) : null;
}

export async function legacyGetComplaintByCode(code: string): Promise<Complaint | null> {
  const normalized = code.trim().toUpperCase();
  const { data, error } = await client()
    .from("complaints")
    .select(SELECT)
    .eq("location_source", normalized)
    .maybeSingle();
  if (error) throw error;
  return data ? toComplaint(data as RemoteRow) : null;
}

export async function legacyCreateComplaint(input: {
  title: string;
  description: string;
  category: ComplaintCategory;
  category_detail?: string | null;
  admin_level: AdminLevel;
  lat: number;
  lng: number;
  photos: string[];
  anonymous_nickname: string;
  tracking_code?: string;
  municipio?: string | null;
  provincia?: string | null;
  comunidad?: string | null;
  calle?: string | null;
  barrio?: string | null;
  via_ref?: string | null;
  via_name?: string | null;
  via_pk?: string | null;
  recipient_name?: string | null;
  recipient_email?: string | null;
  mailbox_key?: string | null;
  reporter_email?: string | null;
}): Promise<Complaint> {
  const now = new Date().toISOString();
  const tracking = input.tracking_code ?? makeTrackingCode();
  const meta: Meta = {
    v: 1,
    title: input.title.trim(),
    description: input.description.trim(),
    category_detail: input.category_detail?.trim() || null,
    admin_level: input.admin_level,
    tracking_code: tracking,
    comunidad: input.comunidad || null,
    calle: input.calle || null,
    barrio: input.barrio || null,
    via_ref: input.via_ref || null,
    via_name: input.via_name || null,
    via_pk: input.via_pk || null,
    recipient_name: input.recipient_name || null,
    recipient_email: input.recipient_email || null,
    mailbox_key: input.mailbox_key || null,
    reporter_email: input.reporter_email || null,
    email_status: "none",
    email_sent_at: null,
    email_error: null,
    votes_resolved: 0,
    anonymous_nickname: input.anonymous_nickname,
    updated_at: now,
    comments: [],
    events: [
      {
        id: randomUUID(),
        complaint_id: "",
        kind: "created",
        message: "Queja registrada. Un administrador la revisará antes de enviarla.",
        created_at: now,
      },
    ],
    voters: [],
  };

  const { data, error } = await client()
    .from("complaints")
    .insert({
      lat: input.lat,
      lng: input.lng,
      category: input.category,
      comment: meta.description,
      photos: JSON.stringify(input.photos.slice(0, 4)),
      ccaa: input.comunidad || null,
      provincia: input.provincia || null,
      municipio: input.municipio || null,
      municipio_code: input.mailbox_key || null,
      location_source: tracking,
      status: "pending",
      author_alias: input.anonymous_nickname,
      created_at: now,
      real_votes: 0,
      fake_votes: 0,
      moderation_note: JSON.stringify(meta),
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  const row = data as RemoteRow;
  meta.events[0]!.complaint_id = String(row.id);
  await saveMeta(row.id, meta);
  const refreshed = await loadRow(String(row.id));
  return toComplaint(refreshed?.row ?? row);
}

export async function legacyUpdateStatus(
  id: string,
  status: ComplaintStatus
): Promise<Complaint | null> {
  const loaded = await loadRow(id);
  if (!loaded) return null;
  const now = new Date().toISOString();
  loaded.meta.events.push({
    id: randomUUID(),
    complaint_id: id,
    kind: status === "pending" ? "note" : status,
    message:
      status === "approved"
        ? "Aprobada. El moderador la enviará a la administración."
        : status === "rejected"
          ? "No se publica. Puedes reescribirla con más detalle y sin descalificaciones."
          : status === "resolved"
            ? "Marcada como resuelta."
            : "Vuelve a estar en revisión.",
    created_at: now,
  });
  await saveMeta(loaded.row.id, loaded.meta, {
    status,
    moderated_at: now,
    resolved_at: status === "resolved" ? now : null,
  });
  return legacyGetComplaint(id);
}

export async function legacyUpdateFields(
  id: string,
  fields: Partial<
    Pick<
      Complaint,
      | "recipient_name"
      | "recipient_email"
      | "mailbox_key"
      | "email_status"
      | "email_sent_at"
      | "email_error"
      | "municipio"
      | "provincia"
      | "comunidad"
    >
  >
): Promise<Complaint | null> {
  const loaded = await loadRow(id);
  if (!loaded) return null;
  if (fields.recipient_name !== undefined) loaded.meta.recipient_name = fields.recipient_name ?? null;
  if (fields.recipient_email !== undefined) loaded.meta.recipient_email = fields.recipient_email ?? null;
  if (fields.mailbox_key !== undefined) loaded.meta.mailbox_key = fields.mailbox_key ?? null;
  if (fields.email_status !== undefined) loaded.meta.email_status = fields.email_status ?? "none";
  if (fields.email_sent_at !== undefined) loaded.meta.email_sent_at = fields.email_sent_at ?? null;
  if (fields.email_error !== undefined) loaded.meta.email_error = fields.email_error ?? null;
  if (fields.comunidad !== undefined) loaded.meta.comunidad = fields.comunidad ?? null;
  await saveMeta(loaded.row.id, loaded.meta, {
    ...(fields.municipio !== undefined ? { municipio: fields.municipio } : {}),
    ...(fields.provincia !== undefined ? { provincia: fields.provincia } : {}),
  });
  return legacyGetComplaint(id);
}

export async function legacyDeleteComplaint(id: string): Promise<boolean> {
  const numeric = Number(id);
  if (!Number.isInteger(numeric)) return false;
  const { error } = await client().from("complaints").delete().eq("id", numeric);
  if (error) throw error;
  return true;
}

export async function legacyListEvents(id: string): Promise<ComplaintEvent[]> {
  const loaded = await loadRow(id);
  return loaded?.meta.events ?? [];
}

export async function legacyAddEvent(input: {
  complaint_id: string;
  kind: ComplaintEvent["kind"];
  message: string;
}): Promise<void> {
  const loaded = await loadRow(input.complaint_id);
  if (!loaded) return;
  loaded.meta.events.push({
    id: randomUUID(),
    complaint_id: input.complaint_id,
    kind: input.kind,
    message: input.message,
    created_at: new Date().toISOString(),
  });
  await saveMeta(loaded.row.id, loaded.meta);
}

export async function legacyListComments(id: string): Promise<Comment[]> {
  const loaded = await loadRow(id);
  return loaded?.meta.comments ?? [];
}

export async function legacyAddComment(input: {
  complaint_id: string;
  body: string;
  author_nickname: string;
  author_lat: number;
  author_lng: number;
}): Promise<{ ok: true; comment: Comment } | { ok: false; message: string }> {
  const loaded = await loadRow(input.complaint_id);
  if (!loaded) return { ok: false, message: "Queja no encontrada." };
  const complaint = toComplaint(loaded.row);
  if (complaint.status !== "approved" && complaint.status !== "resolved") {
    return { ok: false, message: "Los comentarios se abren cuando la queja está publicada." };
  }
  const distance_m = haversineMeters(
    { lat: input.author_lat, lng: input.author_lng },
    { lat: complaint.lat, lng: complaint.lng }
  );
  const comment: Comment = {
    id: randomUUID(),
    complaint_id: input.complaint_id,
    author_nickname: input.author_nickname,
    body: input.body.trim(),
    distance_m,
    created_at: new Date().toISOString(),
  };
  loaded.meta.comments.push(comment);
  await saveMeta(loaded.row.id, loaded.meta);
  return { ok: true, comment };
}

export async function legacyAddVote(input: {
  complaint_id: string;
  vote_type: VoteType;
  voter_nickname: string;
  voter_lat: number;
  voter_lng: number;
}): Promise<{ ok: true; distance_m: number } | { ok: false; message: string }> {
  const loaded = await loadRow(input.complaint_id);
  if (!loaded) return { ok: false, message: "Queja no encontrada." };
  const complaint = toComplaint(loaded.row);
  if (complaint.status !== "approved" && complaint.status !== "resolved") {
    return { ok: false, message: "Solo se puede votar quejas aprobadas o resueltas." };
  }
  const geo = assertWithinVerifyRadius(
    { lat: input.voter_lat, lng: input.voter_lng },
    { lat: complaint.lat, lng: complaint.lng }
  );
  if (!geo.ok) return { ok: false, message: geo.message };

  const voters = loaded.meta.voters.filter((voter) => voter.nickname !== input.voter_nickname);
  voters.push({ nickname: input.voter_nickname, vote_type: input.vote_type });
  loaded.meta.voters = voters;
  loaded.meta.votes_resolved = voters.filter((voter) => voter.vote_type === "resolved").length;
  await saveMeta(loaded.row.id, loaded.meta, {
    real_votes: voters.filter((voter) => voter.vote_type === "real").length,
    fake_votes: voters.filter((voter) => voter.vote_type === "fake").length,
  });
  return { ok: true, distance_m: geo.distance_m };
}
