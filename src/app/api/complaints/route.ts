import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createComplaint, listComplaints } from "@/lib/complaints-store";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_PHOTOS } from "@/lib/constants";
import { assertOnLand } from "@/lib/land";
import { inspectTone } from "@/lib/moderation";
import { resolveRoad } from "@/lib/road";
import { resolveTerritory, routeComplaint } from "@/lib/territory";
import { COMPLAINT_CATEGORIES, type ComplaintCategory } from "@/types";

const createSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(10).max(2000),
  category: z.enum(COMPLAINT_CATEGORIES),
  category_detail: z.string().max(160).optional().default(""),
  admin_level: z.enum(["ayuntamiento", "provincia", "comunidad", "estado"]),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  user_lat: z.number().min(-90).max(90),
  user_lng: z.number().min(-180).max(180),
  photos: z
    .array(z.string().min(1))
    .min(1, "La queja necesita al menos una foto.")
    .max(MAX_PHOTOS),
  anonymous_nickname: z.string().min(3).max(40),
  reporter_email: z.string().max(160).optional().default(""),
  level_manual: z.boolean().optional().default(false),
});

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

function dbHint(error: unknown): string | null {
  const message = errorText(error);
  if (/column|constraint|category|tracking_code|schema cache/i.test(message)) {
    return "La base de datos necesita la migración supabase/migrations/003_delivery.sql. Ábrela en el SQL Editor de Supabase y ejecútala.";
  }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as
    | "pending"
    | "approved"
    | "rejected"
    | "resolved"
    | "public"
    | null;
  const category = searchParams.get("category");

  try {
    const complaints = await listComplaints({
      status: status ?? "public",
      category:
        category && (COMPLAINT_CATEGORIES as readonly string[]).includes(category)
          ? (category as ComplaintCategory)
          : undefined,
    });
    return NextResponse.json({ complaints, demo: !process.env.NEXT_PUBLIC_SUPABASE_URL });
  } catch (e) {
    console.error(errorText(e));
    return NextResponse.json(
      { error: dbHint(e) ?? "Error al listar quejas" },
      { status: 500 }
    );
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
      const message = parsed.error.issues[0]?.message ?? "Datos inválidos";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const detail = parsed.data.category_detail.trim();
    if (parsed.data.category === "otros" && detail.length < 3) {
      return NextResponse.json(
        { error: "En «Otra cosa» escribe qué ocurre, aunque sea en una frase." },
        { status: 400 }
      );
    }

    const tone = inspectTone(
      [parsed.data.title, parsed.data.description, detail, parsed.data.anonymous_nickname].join(
        "\n"
      )
    );
    if (!tone.ok) {
      return NextResponse.json({ error: tone.message }, { status: 400 });
    }

    const land = await assertOnLand(parsed.data.lat, parsed.data.lng);
    if (!land.ok) {
      return NextResponse.json({ error: land.message }, { status: 400 });
    }

    const reporter = parsed.data.reporter_email.trim();
    if (reporter && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporter)) {
      return NextResponse.json({ error: "El correo de respuesta no es válido." }, { status: 400 });
    }

    const territory = await resolveTerritory(parsed.data.lat, parsed.data.lng);
    const road = await resolveRoad({
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      comunidad: territory.comunidad,
      osmType: territory.osmType,
      osmId: territory.osmId,
      osmCategory: territory.osmCategory,
    });
    const { level_manual: manual, ...complaintInput } = parsed.data;
    const level = !manual && road?.owner ? road.owner : parsed.data.admin_level;
    const office = await routeComplaint({
      level,
      category:
        road?.owner === "estado" && level === "estado"
          ? "carreteras_estatales"
          : parsed.data.category,
      territory,
    });

    const complaint = await createComplaint({
      ...complaintInput,
      admin_level: level,
      category_detail: detail || null,
      reporter_email: reporter || null,
      municipio: territory.municipio || null,
      provincia: territory.provincia || null,
      comunidad: territory.comunidad || null,
      calle: territory.calle || road?.ref || null,
      barrio: territory.barrio || null,
      via_ref: road?.ref || null,
      via_name: road && road.name !== road.ref ? road.name : null,
      via_pk: road?.pk || null,
      recipient_name: office.name,
      recipient_email: office.email,
      mailbox_key: office.key,
    });

    return NextResponse.json(
      {
        complaint,
        message: `Queja registrada con el código ${complaint.tracking_code}. La revisaremos y, si procede, se enviará a ${office.name}.`,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(errorText(e));
    return NextResponse.json(
      { error: dbHint(e) ?? "Error al crear queja" },
      { status: 500 }
    );
  }
}
