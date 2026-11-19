import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin, requireSuperAdmin } from "@/lib/admin-auth";
import { listProfiles, setUserBanned } from "@/lib/complaints-store";

export async function GET(req: NextRequest) {
  const auth = authorizeAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const bannedOnly = searchParams.get("banned") === "1";
  const profiles = await listProfiles({ search: q, bannedOnly });
  return NextResponse.json({ profiles, isSuperAdmin: auth.isSuperAdmin });
}

export async function PATCH(req: NextRequest) {
  const auth = requireSuperAdmin(req);
  if (!auth.ok || !auth.isSuperAdmin) {
    return NextResponse.json(
      { error: "Se requiere SUPER_ADMIN para banear usuarios" },
      { status: 403 }
    );
  }
  const body = await req.json();
  const id = body.id as string | undefined;
  const banned = Boolean(body.banned);
  if (!id) {
    return NextResponse.json({ error: "id requerido" }, { status: 400 });
  }
  const profile = await setUserBanned(id, banned);
  if (!profile) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }
  return NextResponse.json({
    profile,
    message: banned
      ? "Usuario baneado: no podrá crear quejas ni interactuar."
      : "Usuario desbaneado.",
  });
}
