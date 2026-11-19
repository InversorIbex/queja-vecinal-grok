import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { removeComplaintPhoto } from "@/lib/complaints-store";

/** Eliminar una foto inapropiada de una queja (SUPER_ADMIN). */
export async function DELETE(req: NextRequest) {
  const auth = requireSuperAdmin(req);
  if (!auth.ok || !auth.isSuperAdmin) {
    return NextResponse.json(
      { error: "Se requiere SUPER_ADMIN para eliminar fotos" },
      { status: 403 }
    );
  }
  const body = await req.json();
  const complaintId = body.complaintId as string | undefined;
  const photoUrl = body.photoUrl as string | undefined;
  if (!complaintId || !photoUrl) {
    return NextResponse.json(
      { error: "complaintId y photoUrl requeridos" },
      { status: 400 }
    );
  }
  const complaint = await removeComplaintPhoto(complaintId, photoUrl);
  if (!complaint) {
    return NextResponse.json({ error: "Queja no encontrada" }, { status: 404 });
  }
  return NextResponse.json({
    complaint,
    message: "Foto eliminada de la queja.",
  });
}
