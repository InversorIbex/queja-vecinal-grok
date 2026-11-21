import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { deliverComplaints } from "@/lib/deliver";
import { getComplaint, updateComplaintFields } from "@/lib/complaints-store";
import { saveMailbox } from "@/lib/mailboxes";
import type { Complaint } from "@/types";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        recipient_email: z.string().max(160).optional(),
        recipient_name: z.string().max(180).optional(),
      })
    )
    .min(1)
    .max(30),
});

function isAdmin(req: NextRequest): boolean {
  const expected = process.env.ADMIN_SECRET ?? "demo-admin";
  return req.headers.get("x-admin-secret") === expected;
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Elige al menos una queja." }, { status: 400 });
  }

  const complaints: Complaint[] = [];
  for (const item of parsed.data.items) {
    const email = item.recipient_email?.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: `El correo ${email} no es válido.` }, { status: 400 });
    }
    if (email || item.recipient_name) {
      await updateComplaintFields(item.id, {
        ...(email ? { recipient_email: email } : {}),
        ...(item.recipient_name ? { recipient_name: item.recipient_name } : {}),
      });
    }
    const complaint = await getComplaint(item.id);
    if (!complaint) continue;
    if (email && complaint.mailbox_key) {
      await saveMailbox({
        key: complaint.mailbox_key,
        admin_level: complaint.admin_level,
        name: item.recipient_name || complaint.recipient_name || email,
        email,
      });
    }
    complaints.push(email ? { ...complaint, recipient_email: email } : complaint);
  }

  const pending = complaints.filter(
    (complaint) => complaint.status !== "approved" && complaint.status !== "resolved"
  );
  if (pending.length) {
    return NextResponse.json(
      { error: "Aprueba las quejas antes de enviarlas." },
      { status: 400 }
    );
  }

  const groups = new Map<string, Complaint[]>();
  for (const complaint of complaints) {
    const email = complaint.recipient_email?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json(
        { error: "Alguna queja no tiene correo de destino." },
        { status: 400 }
      );
    }
    const list = groups.get(email) ?? [];
    list.push(complaint);
    groups.set(email, list);
  }

  const results = [];
  for (const [, group] of groups) {
    results.push(await deliverComplaints(group));
  }

  return NextResponse.json({ groups: results });
}
