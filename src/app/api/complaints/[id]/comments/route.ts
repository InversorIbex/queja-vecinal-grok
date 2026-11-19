import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  addComment,
  isNicknameBanned,
  listComments,
} from "@/lib/complaints-store";
import { rateLimit } from "@/lib/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const comments = await listComments(id);
  return NextResponse.json({ comments });
}

const schema = z.object({
  body: z.string().min(2).max(1000),
  author_nickname: z.string().min(3).max(40),
  author_lat: z.number().min(-90).max(90),
  author_lng: z.number().min(-180).max(180),
});

export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`comment:${ip}`, 20, 60_000);
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

    if (await isNicknameBanned(parsed.data.author_nickname)) {
      return NextResponse.json(
        { error: "Tu cuenta está bloqueada. No puedes comentar." },
        { status: 403 }
      );
    }

    const result = await addComment({
      complaint_id: id,
      ...parsed.data,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 403 });
    }

    return NextResponse.json({ comment: result.comment }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al comentar" }, { status: 500 });
  }
}
