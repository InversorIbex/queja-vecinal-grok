import { NextRequest, NextResponse } from "next/server";
import { assertWithinVerifyRadius } from "@/lib/geo";

/** Valida que quien comprueba la queja está a 1 km (Haversine). */
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
    const result = assertWithinVerifyRadius(user, target);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Error de validación" }, { status: 500 });
  }
}
