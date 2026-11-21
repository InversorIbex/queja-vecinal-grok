import nodemailer from "nodemailer";
import { ADMIN_LEVELS, categoryMeta } from "@/lib/constants";
import { mapsUrl } from "@/lib/geo";
import { siteOrigin } from "@/lib/utils";
import type { Complaint } from "@/types";

export function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function complaintBlock(complaint: Complaint, index?: number): string {
  const meta = categoryMeta(complaint.category);
  const maps = mapsUrl(complaint.lat, complaint.lng);
  const osm = `https://www.openstreetmap.org/?mlat=${complaint.lat}&mlon=${complaint.lng}#map=18/${complaint.lat}/${complaint.lng}`;
  const photos = (complaint.photos ?? []).filter((p) => p.startsWith("http"));
  const place = [complaint.municipio, complaint.provincia, complaint.comunidad]
    .filter(Boolean)
    .join(", ");
  const heading =
    index === undefined
      ? complaint.title
      : `${index + 1}. ${complaint.tracking_code} — ${complaint.title}`;
  return [
    heading,
    complaint.calle ? `Calle: ${complaint.calle}` : "Calle: no hay una vía con nombre junto al punto.",
    complaint.barrio ? `Barrio: ${complaint.barrio}` : "",
    place ? `Municipio: ${place}` : "",
    `Coordenadas: ${complaint.lat.toFixed(6)}, ${complaint.lng.toFixed(6)}`,
    `Google Maps: ${maps}`,
    `OpenStreetMap: ${osm}`,
    `Código de seguimiento: ${complaint.tracking_code}`,
    `Categoría: ${meta.label}`,
    complaint.category_detail ? `Detalle: ${complaint.category_detail}` : "",
    `Administración: ${ADMIN_LEVELS[complaint.admin_level]}`,
    `Ficha: ${siteOrigin()}/seguimiento/${complaint.tracking_code}`,
    "",
    "Descripción:",
    complaint.description,
    "",
    photos.length ? `Fotos:\n${photos.join("\n")}` : "Fotos: no hay enlaces públicos adjuntos.",
    complaint.reporter_email
      ? `La persona vecina dejó este correo: ${complaint.reporter_email}`
      : "La persona vecina no dejó correo. Podéis responder a este mismo mensaje.",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function buildLetter(complaints: Complaint[]): { subject: string; text: string } {
  const first = complaints[0];
  const name = first?.recipient_name || "la administración";
  const intro =
    complaints.length > 1
      ? `Os escribo como moderador de QuejasVecinales. He revisado ${complaints.length} incidencias y os las traslado juntas en este correo.`
      : "Os escribo como moderador de QuejasVecinales, después de revisar esta incidencia.";
  const blocks = complaints.map((complaint, index) =>
    complaintBlock(complaint, complaints.length > 1 ? index : undefined)
  );
  const text = [
    "Estimados señores:",
    "",
    intro,
    "",
    blocks.join("\n\n----------\n\n"),
    "",
    "Gracias por la atención.",
    "QuejasVecinales",
  ].join("\n");

  const subject =
    !first
      ? "[QuejasVecinales]"
      : complaints.length > 1
        ? `[QuejasVecinales] ${complaints.length} incidencias para ${name}`
        : `[QuejasVecinales ${first.tracking_code}] ${first.title}`;

  return { subject: subject.slice(0, 180), text };
}

export async function sendComplaintEmail(
  complaints: Complaint[],
  to: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!smtpConfigured()) {
    return { ok: false, message: "Falta SMTP_HOST, SMTP_USER y SMTP_PASS." };
  }
  if (!complaints.length) {
    return { ok: false, message: "No hay quejas para enviar." };
  }

  const { subject, text } = buildLetter(complaints);
  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from,
      to,
      replyTo: from,
      subject,
      text,
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo enviar el correo";
    return { ok: false, message };
  }
}
