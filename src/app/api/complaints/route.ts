import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createComplaint,
  isNicknameBanned,
  listComplaints,
} from "@/lib/complaints-store";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_PHOTOS } from "@/lib/constants";
import { isDemoMode } from "@/lib/utils";
import { COMPLAINT_CATEGORY_VALUES } from "@/types";

const createSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(10).max(2000),
  category: z.enum(COMPLAINT_CATEGORY_VALUES),
  admin_level: z.enum(["ayuntamiento", "provincia", "comunidad", "estado"]),
  /** Pin elegido (mapa). El servidor lo ofusca antes de guardar. */
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  /** GPS del dispositivo: solo validación ≤10 km. Nunca se almacena. */
  device_lat: z.number().min(-90).max(90),
  device_lng: z.number().min(-180).max(180),
  photos: z.array(z.string()).max(MAX_PHOTOS).default([]),
  anonymous_nickname: z.string().min(3).max(40),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as
    | "pending"
    | "approved"
    | "rejected"
    | "resolved"
    | "public"
    | null;
  const category = searchParams.get("category") as
    | Parameters<typeof listComplaints>[0] extends infer T
      ? T extends { category?: infer C }
        ? C
        : never
      : never;

  try {
    const complaints = await listComplaints({
      status: status ?? "public",
      category: category ?? undefined,
    });
    return NextResponse.json({ complaints, demo: isDemoMode() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al listar quejas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`create:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Demasiadas solicitudes. Espera ${rl.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (await isNicknameBanned(parsed.data.anonymous_nickname)) {
      return NextResponse.json(
        { error: "Tu cuenta está bloqueada. No puedes crear quejas." },
        { status: 403 }
      );
    }

    // Validar GPS vs pin; persistir solo pin ofuscado (~10 km radio).
    const result = await createComplaint(parsed.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 403 });
    }
    return NextResponse.json(
      {
        complaint: result.complaint,
        message:
          "Queja enviada. El pin público es aproximado (privacidad ~20 km). Pendiente de moderación.",
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al crear queja" }, { status: 500 });
  }
}
