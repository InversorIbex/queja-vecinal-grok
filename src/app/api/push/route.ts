import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
  );
  return NextResponse.json({
    configured,
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null,
    message: configured
      ? "Web Push listo."
      : "Web Push en stub: configura NEXT_PUBLIC_VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY.",
  });
}

export async function POST(req: NextRequest) {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
  );
  const body = await req.json().catch(() => ({}));

  if (!configured) {
    return NextResponse.json({
      ok: true,
      demo: true,
      message:
        "Suscripción guardada en modo demo (sin VAPID). Al configurar las claves, el service worker enviará notificaciones reales.",
      subscription: body.subscription ?? null,
    });
  }

  // Persistencia real iría a profiles.push_subscription vía Supabase
  return NextResponse.json({
    ok: true,
    demo: false,
    message: "Suscripción registrada.",
  });
}
