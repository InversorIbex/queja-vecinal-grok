import { NextRequest, NextResponse } from "next/server";
import { assertWithin10km } from "@/lib/geo";

/** Valida distancia servidor (Haversine; en Supabase usar PostGIS within_10km). */
export async function POST(req: NextRequest) {
  try {
    const { user, target } = await req.json();
    if (
      !user?.lat ||
      !user?.lng ||
      !target?.lat ||
      !target?.lng
    ) {
      return NextResponse.json({ error: "Coordenadas incompletas" }, { status: 400 });
    }
    const result = assertWithin10km(user, target, "esta acción");
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Error de validación" }, { status: 500 });
  }
}
