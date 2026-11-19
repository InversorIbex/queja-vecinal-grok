import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin, requireSuperAdmin } from "@/lib/admin-auth";
import { deleteComment, listAllComments } from "@/lib/complaints-store";

export async function GET(req: NextRequest) {
  const auth = authorizeAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const q = new URL(req.url).searchParams.get("q") ?? undefined;
  const comments = await listAllComments({ search: q });
  return NextResponse.json({ comments, isSuperAdmin: auth.isSuperAdmin });
}

export async function DELETE(req: NextRequest) {
  const auth = requireSuperAdmin(req);
  if (!auth.ok || !auth.isSuperAdmin) {
    return NextResponse.json(
      { error: "Se requiere SUPER_ADMIN para borrar comentarios" },
      { status: 403 }
    );
  }
  const { id } = await req.json();
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id requerido" }, { status: 400 });
  }
  const ok = await deleteComment(id);
  if (!ok) {
    return NextResponse.json({ error: "Comentario no encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
