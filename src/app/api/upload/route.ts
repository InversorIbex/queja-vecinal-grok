import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_PHOTO_BYTES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const rl = rateLimit(`upload:${ip}`, 15, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Demasiadas subidas. Espera ${rl.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  try {
    const { dataUrl } = await req.json();
    if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
      return NextResponse.json({ error: "Imagen inválida" }, { status: 400 });
    }
    // Rough size check from base64
    const approxBytes = Math.ceil((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75);
    if (approxBytes > MAX_PHOTO_BYTES * 1.2) {
      return NextResponse.json(
        { error: "La imagen supera ~800 KB. Comprime antes de subir." },
        { status: 400 }
      );
    }

    const result = await uploadImage(dataUrl);
    return NextResponse.json({
      url: result.url,
      demo: result.demo,
      message: result.demo
        ? "La foto se queda con la queja. El almacén de imágenes no la aceptó."
        : "Imagen subida correctamente.",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al subir imagen" }, { status: 500 });
  }
}
