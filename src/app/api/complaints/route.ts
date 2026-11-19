import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createComplaint, listComplaints } from "@/lib/complaints-store";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_PHOTOS } from "@/lib/constants";

const createSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(10).max(2000),
  category: z.enum([
    "baches_carreteras",
    "mobiliario_urbano",
    "parques_jardines",
    "limpieza",
    "iluminacion",
    "senales",
    "otros",
  ]),
  admin_level: z.enum(["ayuntamiento", "provincia", "comunidad", "estado"]),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
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
    return NextResponse.json({ complaints, demo: !process.env.NEXT_PUBLIC_SUPABASE_URL });
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

    // Geolocalización obligatoria: lat/lng del usuario = ubicación de la queja
    const complaint = await createComplaint(parsed.data);
    return NextResponse.json(
      {
        complaint,
        message:
          "Queja enviada. Quedará en pendiente de moderación hasta ser aprobada.",
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al crear queja" }, { status: 500 });
  }
}
