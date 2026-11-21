import { demoStore } from "@/lib/demo-data";
import { assertWithinVerifyRadius, haversineMeters } from "@/lib/geo";
import {
  legacyAddComment,
  legacyAddEvent,
  legacyAddVote,
  legacyCreateComplaint,
  legacyDeleteComplaint,
  legacyGetComplaint,
  legacyGetComplaintByCode,
  legacyListComments,
  legacyListComplaints,
  legacyListEvents,
  legacyUpdateFields,
  legacyUpdateStatus,
} from "@/lib/remote-complaints";
import { schemaMode } from "@/lib/schema-mode";
import { createServiceClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/utils";
import { makeTrackingCode } from "@/lib/tracking";
import type {
  AdminLevel,
  Comment,
  Complaint,
  ComplaintCategory,
  ComplaintEvent,
  ComplaintEventKind,
  ComplaintStatus,
  VoteType,
} from "@/types";
import { randomUUID } from "crypto";

export async function listComplaints(opts?: {
  status?: ComplaintStatus | "public";
  category?: ComplaintCategory;
}): Promise<Complaint[]> {
  if ((await schemaMode()) === "legacy") return legacyListComplaints(opts);
  if (isDemoMode() || !createServiceClient()) {
    let list = [...demoStore.complaints];
    if (opts?.status === "public") {
      list = list.filter((c) => c.status === "approved" || c.status === "resolved");
    } else if (opts?.status) {
      list = list.filter((c) => c.status === opts.status);
    }
    if (opts?.category) {
      list = list.filter((c) => c.category === opts.category);
    }
    return list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  const sb = createServiceClient()!;
  let q = sb.from("complaints").select("*").order("created_at", { ascending: false });
  if (opts?.status === "public") {
    q = q.in("status", ["approved", "resolved"]);
  } else if (opts?.status) {
    q = q.eq("status", opts.status);
  }
  if (opts?.category) q = q.eq("category", opts.category);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Complaint[];
}

export async function getComplaint(id: string): Promise<Complaint | null> {
  if ((await schemaMode()) === "legacy") return legacyGetComplaint(id);
  if (isDemoMode() || !createServiceClient()) {
    return demoStore.complaints.find((c) => c.id === id) ?? null;
  }
  const sb = createServiceClient()!;
  const { data, error } = await sb.from("complaints").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Complaint | null;
}

export async function createComplaint(input: {
  title: string;
  description: string;
  category: ComplaintCategory;
  category_detail?: string | null;
  admin_level: AdminLevel;
  lat: number;
  lng: number;
  photos: string[];
  anonymous_nickname: string;
  author_id?: string | null;
  tracking_code?: string;
  municipio?: string | null;
  provincia?: string | null;
  comunidad?: string | null;
  calle?: string | null;
  barrio?: string | null;
  recipient_name?: string | null;
  recipient_email?: string | null;
  mailbox_key?: string | null;
  reporter_email?: string | null;
}): Promise<Complaint> {
  if ((await schemaMode()) === "legacy") return legacyCreateComplaint(input);
  const now = new Date().toISOString();
  const complaint: Complaint = {
    id: randomUUID(),
    author_id: input.author_id ?? null,
    anonymous_nickname: input.anonymous_nickname,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    category_detail: input.category_detail?.trim() || null,
    admin_level: input.admin_level,
    status: "pending",
    lat: input.lat,
    lng: input.lng,
    photos: input.photos.slice(0, 4),
    tracking_code: input.tracking_code ?? makeTrackingCode(),
    municipio: input.municipio || null,
    provincia: input.provincia || null,
    comunidad: input.comunidad || null,
    calle: input.calle || null,
    barrio: input.barrio || null,
    recipient_name: input.recipient_name || null,
    recipient_email: input.recipient_email || null,
    mailbox_key: input.mailbox_key || null,
    reporter_email: input.reporter_email || null,
    email_status: "none",
    votes_real: 0,
    votes_fake: 0,
    votes_resolved: 0,
    comments_count: 0,
    created_at: now,
    updated_at: now,
  };

  if (isDemoMode() || !createServiceClient()) {
    demoStore.complaints.unshift(complaint);
    await addEvent({
      complaint_id: complaint.id,
      kind: "created",
      message: "Queja registrada. Un administrador la revisará antes de enviarla.",
    });
    return complaint;
  }

  const sb = createServiceClient()!;
  const { data, error } = await sb.from("complaints").insert(complaint).select().single();
  if (error) throw error;
  const saved = data as Complaint;
  await addEvent({
    complaint_id: saved.id,
    kind: "created",
    message: "Queja registrada. Un administrador la revisará antes de enviarla.",
  });
  return saved;
}

export async function getComplaintByCode(code: string): Promise<Complaint | null> {
  if ((await schemaMode()) === "legacy") return legacyGetComplaintByCode(code);
  const normalized = code.trim().toUpperCase();
  if (isDemoMode() || !createServiceClient()) {
    return (
      demoStore.complaints.find((c) => c.tracking_code.toUpperCase() === normalized) ?? null
    );
  }
  const sb = createServiceClient()!;
  const { data, error } = await sb
    .from("complaints")
    .select("*")
    .eq("tracking_code", normalized)
    .maybeSingle();
  if (error) throw error;
  return data as Complaint | null;
}

export async function listEvents(complaintId: string): Promise<ComplaintEvent[]> {
  if ((await schemaMode()) === "legacy") return legacyListEvents(complaintId);
  if (isDemoMode() || !createServiceClient()) {
    return demoStore.events
      .filter((event) => event.complaint_id === complaintId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
  const sb = createServiceClient()!;
  const { data, error } = await sb
    .from("complaint_events")
    .select("*")
    .eq("complaint_id", complaintId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as ComplaintEvent[];
}

export async function addEvent(input: {
  complaint_id: string;
  kind: ComplaintEventKind;
  message: string;
}): Promise<void> {
  if ((await schemaMode()) === "legacy") {
    await legacyAddEvent(input);
    return;
  }
  const event: ComplaintEvent = {
    id: randomUUID(),
    complaint_id: input.complaint_id,
    kind: input.kind,
    message: input.message,
    created_at: new Date().toISOString(),
  };
  if (isDemoMode() || !createServiceClient()) {
    demoStore.events.push(event);
    return;
  }
  const sb = createServiceClient()!;
  await sb.from("complaint_events").insert(event);
}

export async function updateComplaintFields(
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
  if ((await schemaMode()) === "legacy") return legacyUpdateFields(id, fields);
  if (isDemoMode() || !createServiceClient()) {
    const complaint = demoStore.complaints.find((item) => item.id === id);
    if (!complaint) return null;
    Object.assign(complaint, fields, { updated_at: new Date().toISOString() });
    return complaint;
  }
  const sb = createServiceClient()!;
  const { data, error } = await sb
    .from("complaints")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Complaint;
}

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus,
  moderatedBy?: string
): Promise<Complaint | null> {
  if ((await schemaMode()) === "legacy") return legacyUpdateStatus(id, status);
  if (isDemoMode() || !createServiceClient()) {
    const c = demoStore.complaints.find((x) => x.id === id);
    if (!c) return null;
    c.status = status;
    c.updated_at = new Date().toISOString();
    c.moderated_at = new Date().toISOString();
    await addEvent({
      complaint_id: id,
      kind: status === "pending" ? "note" : status,
      message: statusMessage(status),
    });
    return c;
  }
  const sb = createServiceClient()!;
  const { data, error } = await sb
    .from("complaints")
    .update({
      status,
      moderated_at: new Date().toISOString(),
      moderated_by: moderatedBy ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  await addEvent({
    complaint_id: id,
    kind: status === "pending" ? "note" : status,
    message: statusMessage(status),
  });
  return data as Complaint;
}

function statusMessage(status: ComplaintStatus): string {
  if (status === "approved") return "Aprobada. El moderador la enviará a la administración.";
  if (status === "rejected") return "No se publica. Puedes reescribirla con más detalle y sin descalificaciones.";
  if (status === "resolved") return "Marcada como resuelta.";
  return "Vuelve a estar en revisión.";
}

export async function deleteComplaint(id: string): Promise<boolean> {
  if ((await schemaMode()) === "legacy") return legacyDeleteComplaint(id);
  if (isDemoMode() || !createServiceClient()) {
    const i = demoStore.complaints.findIndex((c) => c.id === id);
    if (i < 0) return false;
    demoStore.complaints.splice(i, 1);
    delete demoStore.comments[id];
    return true;
  }
  const sb = createServiceClient()!;
  const { error } = await sb.from("complaints").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function addVote(input: {
  complaint_id: string;
  vote_type: VoteType;
  voter_nickname: string;
  voter_lat: number;
  voter_lng: number;
}): Promise<{ ok: true; distance_m: number } | { ok: false; message: string }> {
  if ((await schemaMode()) === "legacy") return legacyAddVote(input);
  const complaint = await getComplaint(input.complaint_id);
  if (!complaint) return { ok: false, message: "Queja no encontrada." };
  if (complaint.status !== "approved" && complaint.status !== "resolved") {
    return { ok: false, message: "Solo se puede votar quejas aprobadas o resueltas." };
  }

  const geo = assertWithinVerifyRadius(
    { lat: input.voter_lat, lng: input.voter_lng },
    { lat: complaint.lat, lng: complaint.lng }
  );
  if (!geo.ok) return { ok: false, message: geo.message };

  if (isDemoMode() || !createServiceClient()) {
    const existing = demoStore.votes.find(
      (v) =>
        v.complaint_id === input.complaint_id &&
        v.voter_nickname === input.voter_nickname
    );
    if (existing) {
      // actualizar tipo
      const prev = existing.vote_type;
      if (prev === "real") complaint.votes_real = Math.max(0, complaint.votes_real - 1);
      if (prev === "fake") complaint.votes_fake = Math.max(0, complaint.votes_fake - 1);
      if (prev === "resolved")
        complaint.votes_resolved = Math.max(0, complaint.votes_resolved - 1);
      existing.vote_type = input.vote_type;
    } else {
      demoStore.votes.push({
        id: randomUUID(),
        complaint_id: input.complaint_id,
        voter_nickname: input.voter_nickname,
        vote_type: input.vote_type,
        distance_m: geo.distance_m,
        created_at: new Date().toISOString(),
      });
    }
    if (input.vote_type === "real") complaint.votes_real += 1;
    if (input.vote_type === "fake") complaint.votes_fake += 1;
    if (input.vote_type === "resolved") complaint.votes_resolved += 1;
    return { ok: true, distance_m: geo.distance_m };
  }

  const sb = createServiceClient()!;
  const { error } = await sb.from("votes").upsert(
    {
      complaint_id: input.complaint_id,
      voter_nickname: input.voter_nickname,
      vote_type: input.vote_type,
      voter_lat: input.voter_lat,
      voter_lng: input.voter_lng,
      distance_m: geo.distance_m,
    },
    { onConflict: "complaint_id,voter_nickname" }
  );
  if (error) throw error;
  return { ok: true, distance_m: geo.distance_m };
}

export async function listComments(complaintId: string): Promise<Comment[]> {
  if ((await schemaMode()) === "legacy") return legacyListComments(complaintId);
  if (isDemoMode() || !createServiceClient()) {
    return demoStore.comments[complaintId] ?? [];
  }
  const sb = createServiceClient()!;
  const { data, error } = await sb
    .from("comments")
    .select("*")
    .eq("complaint_id", complaintId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Comment[];
}

export async function addComment(input: {
  complaint_id: string;
  body: string;
  author_nickname: string;
  author_lat: number;
  author_lng: number;
}): Promise<{ ok: true; comment: Comment } | { ok: false; message: string }> {
  if ((await schemaMode()) === "legacy") return legacyAddComment(input);
  const complaint = await getComplaint(input.complaint_id);
  if (!complaint) return { ok: false, message: "Queja no encontrada." };
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

  if (isDemoMode() || !createServiceClient()) {
    if (!demoStore.comments[input.complaint_id]) {
      demoStore.comments[input.complaint_id] = [];
    }
    demoStore.comments[input.complaint_id].push(comment);
    complaint.comments_count += 1;
    return { ok: true, comment };
  }

  const sb = createServiceClient()!;
  const { data, error } = await sb
    .from("comments")
    .insert({
      ...comment,
      author_lat: input.author_lat,
      author_lng: input.author_lng,
    })
    .select()
    .single();
  if (error) throw error;
  return { ok: true, comment: data as Comment };
}
