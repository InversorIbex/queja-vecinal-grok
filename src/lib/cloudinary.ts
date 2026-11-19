/**
 * Subida a Cloudinary. Si faltan credenciales, devuelve data URL / placeholder.
 */

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
  if (!isCloudinaryConfigured()) {
    // Modo demo: aceptar data URLs o devolver placeholder
    if (base64OrUrl.startsWith("data:")) {
      return { url: base64OrUrl, demo: true };
    }
    return {
      url: `https://placehold.co/800x600/0ea5e9/ffffff?text=Demo+foto`,
      demo: true,
    };
  }

  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  const key = process.env.CLOUDINARY_API_KEY!;
  const secret = process.env.CLOUDINARY_API_SECRET!;

  const form = new FormData();
  form.append("file", base64OrUrl);
  form.append("folder", folder);
  form.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET ?? "");

  // Firma unsigned con preset, o signed básico
  const endpoint = `https://api.cloudinary.com/v1_1/${cloud}/image/upload`;

  if (process.env.CLOUDINARY_UPLOAD_PRESET) {
    const res = await fetch(endpoint, { method: "POST", body: form });
    if (!res.ok) {
      throw new Error("Error al subir imagen a Cloudinary");
    }
    const data = (await res.json()) as { secure_url: string };
    return { url: data.secure_url, demo: false };
  }

  // Signed upload (timestamp + signature)
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const crypto = await import("crypto");
  const toSign = `folder=${folder}&timestamp=${timestamp}${secret}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  form.append("api_key", key);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  form.delete("upload_preset");

  const res = await fetch(endpoint, { method: "POST", body: form });
  if (!res.ok) {
    throw new Error("Error al subir imagen a Cloudinary");
  }
  const data = (await res.json()) as { secure_url: string };
  return { url: data.secure_url, demo: false };
}
