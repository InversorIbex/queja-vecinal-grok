import { NextRequest, NextResponse } from "next/server";
import {
  deleteComplaint,
  getComplaint,
  listComments,
  listEvents,
  updateComplaintFields,
  updateComplaintStatus,
} from "@/lib/complaints-store";
import { deliverComplaints } from "@/lib/deliver";
import { saveMailbox } from "@/lib/mailboxes";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const complaint = await getComplaint(id);
    if (!complaint) {
      return NextResponse.json({ error: "Queja no encontrada" }, { status: 404 });
    }
    const [comments, events] = await Promise.all([
      listComments(id),
      listEvents(id),
    ]);
    return NextResponse.json({ complaint, comments, events });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al obtener queja" }, { status: 500 });
  }
}

const patchSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "resolved"]).optional(),
  adminToken: z.string().optional(),
  send: z.boolean().optional(),
  recipient_email: z.string().max(160).optional(),
  recipient_name: z.string().max(180).optional(),
});

function isAdminAuthorized(req: NextRequest, bodyToken?: string): boolean {
  const expected = process.env.ADMIN_SECRET ?? "demo-admin";
  const header = req.headers.get("x-admin-secret");
  return header === expected || bodyToken === expected;
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    if (!isAdminAuthorized(req, parsed.data.adminToken)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const email = parsed.data.recipient_email?.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "El correo de destino no es válido." }, { status: 400 });
    }

    if (email || parsed.data.recipient_name) {
      await updateComplaintFields(id, {
        ...(email ? { recipient_email: email } : {}),
        ...(parsed.data.recipient_name ? { recipient_name: parsed.data.recipient_name } : {}),
      });
      const current = await getComplaint(id);
      if (current?.mailbox_key && email) {
        await saveMailbox({
          key: current.mailbox_key,
          admin_level: current.admin_level,
          name: parsed.data.recipient_name || current.recipient_name || email,
          email,
        });
      }
    }

    if (parsed.data.status) {
      const updated = await updateComplaintStatus(id, parsed.data.status);
      if (!updated) {
        return NextResponse.json({ error: "Queja no encontrada" }, { status: 404 });
      }
    }

    const complaint = await getComplaint(id);
    if (!complaint) {
      return NextResponse.json({ error: "Queja no encontrada" }, { status: 404 });
    }

    let delivery = null;
    if (parsed.data.send === true && (complaint.status === "approved" || complaint.status === "resolved")) {
      delivery = await deliverComplaints([complaint]);
    }

    const fresh = await getComplaint(id);
    return NextResponse.json({ complaint: fresh, delivery });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const ok = await deleteComplaint(id);
  if (!ok) {
    return NextResponse.json({ error: "Queja no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
