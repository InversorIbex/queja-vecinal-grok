import { NextRequest, NextResponse } from "next/server";
import { ADMIN_LEVEL_HINTS } from "@/lib/constants";
import { resolveTerritory, routeComplaint } from "@/lib/territory";
import { COMPLAINT_CATEGORIES, type AdminLevel, type ComplaintCategory } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const level = searchParams.get("level") as AdminLevel | null;
  const category = searchParams.get("category");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Ubicación inválida" }, { status: 400 });
  }
  if (!level || !(level in ADMIN_LEVEL_HINTS)) {
    return NextResponse.json({ error: "Administración inválida" }, { status: 400 });
  }
  if (!category || !(COMPLAINT_CATEGORIES as readonly string[]).includes(category)) {
    return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
  }

  const territory = await resolveTerritory(lat, lng);
  const office = await routeComplaint({
    level,
    category: category as ComplaintCategory,
    territory,
  });

  return NextResponse.json({
    territory,
    recipient: {
      name: office.name,
      email: office.email,
      web: office.web,
      known: Boolean(office.email),
      source: office.source,
    },
    hint: ADMIN_LEVEL_HINTS[level],
  });
}
