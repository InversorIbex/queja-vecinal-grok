/**
 * Subida a Cloudinary (free tier).
 *
 * Preferido: unsigned upload con CLOUDINARY_CLOUD_NAME + CLOUDINARY_UPLOAD_PRESET
 * (sin exponer API secret al cliente; el preset se crea en el dashboard).
 *
 * Alternativa server-side: signed con API_KEY + API_SECRET.
 *
 * Sin credenciales → modo demo (data URL / placeholder).
 */

export function isCloudinaryConfigured(): boolean {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  if (!cloud) return false;
  // Unsigned (free tier típico) o signed
  if (process.env.CLOUDINARY_UPLOAD_PRESET?.trim()) return true;
  return Boolean(
    process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim()
  );
}

export async function uploadImage(
  base64OrUrl: string,
  folder = "quejas-vecinales"
): Promise<{ url: string; demo: boolean }> {
  if (!isCloudinaryConfigured()) {
    if (base64OrUrl.startsWith("data:")) {
      return { url: base64OrUrl, demo: true };
    }
    return {
      url: `https://placehold.co/800x600/0ea5e9/ffffff?text=Demo+foto`,
      demo: true,
    };
  }

  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  const endpoint = `https://api.cloudinary.com/v1_1/${cloud}/image/upload`;
  const form = new FormData();
  form.append("file", base64OrUrl);
  form.append("folder", folder);

  const preset = process.env.CLOUDINARY_UPLOAD_PRESET?.trim();
  if (preset) {
    form.append("upload_preset", preset);
    const res = await fetch(endpoint, { method: "POST", body: form });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Error al subir imagen a Cloudinary: ${detail}`);
    }
    const data = (await res.json()) as { secure_url: string };
    return { url: data.secure_url, demo: false };
  }

  // Signed upload
  const key = process.env.CLOUDINARY_API_KEY!;
  const secret = process.env.CLOUDINARY_API_SECRET!;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const crypto = await import("crypto");
  const toSign = `folder=${folder}&timestamp=${timestamp}${secret}`;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  form.append("api_key", key);
  form.append("timestamp", timestamp);
  form.append("signature", signature);

  const res = await fetch(endpoint, { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Error al subir imagen a Cloudinary: ${detail}`);
  }
  const data = (await res.json()) as { secure_url: string };
  return { url: data.secure_url, demo: false };
}

/** Borrar recurso en Cloudinary por public_id o URL (best-effort). */
export async function destroyImageByUrl(url: string): Promise<boolean> {
  if (!url.includes("res.cloudinary.com")) return false;
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const key = process.env.CLOUDINARY_API_KEY?.trim();
  const secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloud || !key || !secret) return false;

  try {
    // .../upload/v123/folder/name.jpg → folder/name
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
    if (!match) return false;
    const publicId = decodeURIComponent(match[1]);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const crypto = await import("crypto");
    const toSign = `public_id=${publicId}&timestamp=${timestamp}${secret}`;
    const signature = crypto.createHash("sha1").update(toSign).digest("hex");

    const form = new FormData();
    form.append("public_id", publicId);
    form.append("api_key", key);
    form.append("timestamp", timestamp);
    form.append("signature", signature);

    const endpoint = `https://api.cloudinary.com/v1_1/${cloud}/image/destroy`;
    const res = await fetch(endpoint, { method: "POST", body: form });
    return res.ok;
  } catch {
    return false;
  }
}
