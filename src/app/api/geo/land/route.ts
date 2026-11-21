import { NextRequest, NextResponse } from "next/server";
import { isOnLand, WATER_MESSAGE } from "@/lib/land";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`land:${ip}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ onLand: true, checked: false }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "Ubicación inválida" }, { status: 400 });
  }

  const onLand = await isOnLand(lat, lng);
  if (onLand === false) {
    return NextResponse.json({ onLand: false, checked: true, error: WATER_MESSAGE });
  }
  return NextResponse.json({ onLand: true, checked: onLand === true });
}
