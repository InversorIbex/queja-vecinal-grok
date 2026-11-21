/**
 * Subida a Cloudinary. Si faltan credenciales o el servicio rechaza la foto,
 * se guarda el data URL con la queja para que el envío no se quede sin imagen.
 */

async function cloudinaryUrl(form: FormData, cloud: string): Promise<string | null> {
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { secure_url?: string };
  return data.secure_url || null;
}

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export async function uploadImage(
  base64OrUrl: string,
  folder = "quejas-vecinales"
): Promise<{ url: string; demo: boolean }> {
  const local =
    base64OrUrl.startsWith("data:")
      ? { url: base64OrUrl, demo: true as const }
      : null;

  if (!isCloudinaryConfigured()) {
    if (local) return local;
    return {
      url: "https://placehold.co/800x600/0ea5e9/ffffff?text=Demo+foto",
      demo: true,
    };
  }

  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  const key = process.env.CLOUDINARY_API_KEY!;
  const secret = process.env.CLOUDINARY_API_SECRET!;
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim();

  try {
    if (preset) {
      const form = new FormData();
      form.append("file", base64OrUrl);
      form.append("folder", folder);
      form.append("upload_preset", preset);
      const url = await cloudinaryUrl(form, cloud);
      if (url) return { url, demo: false };
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const crypto = await import("crypto");
    const signature = crypto
      .createHash("sha1")
      .update(`folder=${folder}&timestamp=${timestamp}${secret}`)
      .digest("hex");
    const signed = new FormData();
    signed.append("file", base64OrUrl);
    signed.append("folder", folder);
    signed.append("api_key", key);
    signed.append("timestamp", timestamp);
    signed.append("signature", signature);
    const url = await cloudinaryUrl(signed, cloud);
    if (url) return { url, demo: false };
  } catch (error) {
    console.error("Cloudinary no aceptó la foto", error instanceof Error ? error.message : "");
  }

  if (local) return local;
  throw new Error("Error al subir imagen a Cloudinary");
}
