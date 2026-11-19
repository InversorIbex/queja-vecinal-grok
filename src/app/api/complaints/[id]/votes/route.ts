import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addVote } from "@/lib/complaints-store";
import { rateLimit } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  vote_type: z.enum(["real", "fake", "resolved"]),
  voter_nickname: z.string().min(3).max(40),
  voter_lat: z.number().min(-90).max(90),
  voter_lng: z.number().min(-180).max(180),
});

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`vote:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Demasiadas solicitudes. Espera ${rl.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const result = await addVote({
      complaint_id: id,
      ...parsed.data,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      distance_m: result.distance_m,
      message: "Voto registrado. Solo vecinos a ≤10 km pueden votar.",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al votar" }, { status: 500 });
  }
}
