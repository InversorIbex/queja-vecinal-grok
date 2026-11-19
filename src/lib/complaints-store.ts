import { demoStore } from "@/lib/demo-data";
import { assertWithin10km, obfuscateLocation } from "@/lib/geo";
import { destroyImageByUrl } from "@/lib/cloudinary";
import { createServiceClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/utils";
import type {
  AdminLevel,
  Comment,
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
  Profile,
  VoteType,
} from "@/types";
import { randomUUID } from "crypto";

export async function listComplaints(opts?: {
  status?: ComplaintStatus | "public";
  category?: ComplaintCategory;
}): Promise<Complaint[]> {
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
  admin_level: AdminLevel;
  /** Pin elegido en el mapa (no GPS del dispositivo). */
  lat: number;
  lng: number;
  /** GPS en tiempo real: solo validación ≤10 km al pin. Nunca se persiste. */
  device_lat: number;
  device_lng: number;
  photos: string[];
  anonymous_nickname: string;
  author_id?: string | null;
}): Promise<
  { ok: true; complaint: Complaint } | { ok: false; message: string }
> {
  const pin = { lat: input.lat, lng: input.lng };
  const device = { lat: input.device_lat, lng: input.device_lng };
  const geo = assertWithin10km(device, pin, "crear la queja");
  if (!geo.ok) return { ok: false, message: geo.message };

  const id = randomUUID();
  // Pin público ofuscado (~10 km radio). El GPS del vecino no se guarda.
  const publicPin = obfuscateLocation(pin, id);

  const complaint: Complaint = {
    id,
    author_id: input.author_id ?? null,
    anonymous_nickname: input.anonymous_nickname,
    title: input.title,
    description: input.description,
    category: input.category,
    admin_level: input.admin_level,
    status: "pending",
    lat: publicPin.lat,
    lng: publicPin.lng,
    photos: input.photos.slice(0, 4),
    votes_real: 0,
    votes_fake: 0,
    votes_resolved: 0,
    comments_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isDemoMode() || !createServiceClient()) {
    demoStore.complaints.unshift(complaint);
    return { ok: true, complaint };
  }

  const sb = createServiceClient()!;
  const { data, error } = await sb.from("complaints").insert(complaint).select().single();
  if (error) throw error;
  return { ok: true, complaint: data as Complaint };
}

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus,
  moderatedBy?: string
): Promise<Complaint | null> {
  if (isDemoMode() || !createServiceClient()) {
    const c = demoStore.complaints.find((x) => x.id === id);
    if (!c) return null;
    c.status = status;
    c.updated_at = new Date().toISOString();
    c.moderated_at = new Date().toISOString();
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
  return data as Complaint;
}

export async function deleteComplaint(id: string): Promise<boolean> {
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
  const complaint = await getComplaint(input.complaint_id);
  if (!complaint) return { ok: false, message: "Queja no encontrada." };
  if (complaint.status !== "approved" && complaint.status !== "resolved") {
    return { ok: false, message: "Solo se puede votar quejas aprobadas o resueltas." };
  }

  const geo = assertWithin10km(
    { lat: input.voter_lat, lng: input.voter_lng },
    { lat: complaint.lat, lng: complaint.lng },
    "votar"
  );
  if (!geo.ok) return { ok: false, message: geo.message };

  // GPS del votante solo para Haversine vs pin público; no se persiste.
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
      distance_m: geo.distance_m,
    },
    { onConflict: "complaint_id,voter_nickname" }
  );
  if (error) throw error;
  return { ok: true, distance_m: geo.distance_m };
}

export async function listComments(complaintId: string): Promise<Comment[]> {
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
  const complaint = await getComplaint(input.complaint_id);
  if (!complaint) return { ok: false, message: "Queja no encontrada." };

  const geo = assertWithin10km(
    { lat: input.author_lat, lng: input.author_lng },
    { lat: complaint.lat, lng: complaint.lng },
    "comentar"
  );
  if (!geo.ok) return { ok: false, message: geo.message };

  const comment: Comment = {
    id: randomUUID(),
    complaint_id: input.complaint_id,
    author_nickname: input.author_nickname,
    body: input.body.trim(),
    distance_m: geo.distance_m,
    created_at: new Date().toISOString(),
  };

  // GPS del autor solo para validar distancia; no se persiste.
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
    .insert(comment)
    .select()
    .single();
  if (error) throw error;
  return { ok: true, comment: data as Comment };
}

export async function deleteComment(commentId: string): Promise<boolean> {
  if (isDemoMode() || !createServiceClient()) {
    for (const [cid, list] of Object.entries(demoStore.comments)) {
      const i = list.findIndex((c) => c.id === commentId);
      if (i >= 0) {
        list.splice(i, 1);
        const complaint = demoStore.complaints.find((c) => c.id === cid);
        if (complaint) {
          complaint.comments_count = Math.max(0, complaint.comments_count - 1);
        }
        return true;
      }
    }
    return false;
  }
  const sb = createServiceClient()!;
  const { error } = await sb.from("comments").delete().eq("id", commentId);
  if (error) throw error;
  return true;
}

export async function removeComplaintPhoto(
  complaintId: string,
  photoUrl: string
): Promise<Complaint | null> {
  const complaint = await getComplaint(complaintId);
  if (!complaint) return null;
  const next = complaint.photos.filter((p) => p !== photoUrl);
  if (next.length === complaint.photos.length) return complaint;

  void destroyImageByUrl(photoUrl);

  if (isDemoMode() || !createServiceClient()) {
    complaint.photos = next;
    complaint.updated_at = new Date().toISOString();
    return complaint;
  }

  const sb = createServiceClient()!;
  const { data, error } = await sb
    .from("complaints")
    .update({ photos: next, updated_at: new Date().toISOString() })
    .eq("id", complaintId)
    .select()
    .single();
  if (error) throw error;
  return data as Complaint;
}

export async function listProfiles(opts?: {
  search?: string;
  bannedOnly?: boolean;
}): Promise<Profile[]> {
  if (isDemoMode() || !createServiceClient()) {
    let list = [...demoStore.profiles];
    if (opts?.bannedOnly) list = list.filter((p) => p.banned);
    if (opts?.search) {
      const q = opts.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.nickname.toLowerCase().includes(q) ||
          (p.email?.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  }

  const sb = createServiceClient()!;
  let q = sb.from("profiles").select("*").order("created_at", { ascending: false });
  if (opts?.bannedOnly) q = q.eq("banned", true);
  if (opts?.search) {
    q = q.or(
      `nickname.ilike.%${opts.search}%,email.ilike.%${opts.search}%`
    );
  }
  const { data, error } = await q.limit(100);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...(row as Profile),
    banned: Boolean((row as Profile).banned),
  }));
}

export async function setUserBanned(
  profileId: string,
  banned: boolean
): Promise<Profile | null> {
  if (isDemoMode() || !createServiceClient()) {
    const p = demoStore.profiles.find((x) => x.id === profileId);
    if (!p) return null;
    p.banned = banned;
    return p;
  }
  const sb = createServiceClient()!;
  const { data, error } = await sb
    .from("profiles")
    .update({ banned, updated_at: new Date().toISOString() })
    .eq("id", profileId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function isNicknameBanned(nickname: string): Promise<boolean> {
  if (isDemoMode() || !createServiceClient()) {
    return demoStore.profiles.some(
      (p) => p.nickname === nickname && p.banned
    );
  }
  const sb = createServiceClient()!;
  const { data } = await sb
    .from("profiles")
    .select("id")
    .eq("nickname", nickname)
    .eq("banned", true)
    .maybeSingle();
  return Boolean(data);
}

export async function listAllComments(opts?: {
  search?: string;
  limit?: number;
}): Promise<(Comment & { complaint_title?: string })[]> {
  if (isDemoMode() || !createServiceClient()) {
    const rows: (Comment & { complaint_title?: string })[] = [];
    for (const [cid, list] of Object.entries(demoStore.comments)) {
      const title = demoStore.complaints.find((c) => c.id === cid)?.title;
      for (const c of list) {
        rows.push({ ...c, complaint_title: title });
      }
    }
    let out = rows.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    if (opts?.search) {
      const q = opts.search.toLowerCase();
      out = out.filter(
        (c) =>
          c.body.toLowerCase().includes(q) ||
          c.author_nickname.toLowerCase().includes(q)
      );
    }
    return out.slice(0, opts?.limit ?? 100);
  }

  const sb = createServiceClient()!;
  let q = sb
    .from("comments")
    .select("*, complaints(title)")
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 100);
  if (opts?.search) {
    q = q.or(
      `body.ilike.%${opts.search}%,author_nickname.ilike.%${opts.search}%`
    );
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as Comment & { complaints?: { title?: string } | null };
    return {
      id: r.id,
      complaint_id: r.complaint_id,
      author_nickname: r.author_nickname,
      body: r.body,
      distance_m: r.distance_m,
      created_at: r.created_at,
      complaint_title: r.complaints?.title,
    };
  });
}
