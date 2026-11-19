import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";
import {
  deleteComplaint,
  getComplaint,
  listComments,
  updateComplaintStatus,
} from "@/lib/complaints-store";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const complaint = await getComplaint(id);
    if (!complaint) {
      return NextResponse.json({ error: "Queja no encontrada" }, { status: 404 });
    }
    const comments = await listComments(id);
    return NextResponse.json({ complaint, comments });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al obtener queja" }, { status: 500 });
  }
}

const patchSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "resolved"]).optional(),
  title: z.string().min(5).max(120).optional(),
  description: z.string().min(10).max(2000).optional(),
  adminToken: z.string().optional(),
});

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    const auth = authorizeAdmin(req, parsed.data.adminToken);
    if (!auth.ok) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (parsed.data.status) {
      const complaint = await updateComplaintStatus(id, parsed.data.status);
      if (!complaint) {
        return NextResponse.json({ error: "Queja no encontrada" }, { status: 404 });
      }
      return NextResponse.json({ complaint });
    }
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const auth = authorizeAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const ok = await deleteComplaint(id);
  if (!ok) {
    return NextResponse.json({ error: "Queja no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
