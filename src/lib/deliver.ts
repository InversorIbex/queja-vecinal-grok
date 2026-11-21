import { saveMailbox } from "@/lib/mailboxes";
import { sendComplaintEmail, smtpConfigured } from "@/lib/mailer";
import { addEvent, updateComplaintFields } from "@/lib/complaints-store";
import type { Complaint } from "@/types";

export interface DeliveryResult {
  status: "sent" | "no_mailbox" | "no_smtp" | "failed";
  detail: string;
}

export async function deliverComplaints(complaints: Complaint[]): Promise<DeliveryResult & { count: number }> {
  const ready = complaints.filter(
    (complaint) => complaint.status === "approved" || complaint.status === "resolved"
  );
  if (!ready.length) {
    return { status: "failed", detail: "Solo se envían quejas aprobadas.", count: 0 };
  }

  const email = ready[0]?.recipient_email?.trim();
  const sameDestination = email && ready.every((complaint) => complaint.recipient_email?.trim().toLowerCase() === email.toLowerCase());
  if (!email || !sameDestination) {
    for (const complaint of ready.filter((item) => !item.recipient_email)) {
      await updateComplaintFields(complaint.id, {
        email_status: "no_mailbox",
        email_error: "Sin buzón de la administración",
      });
    }
    return {
      status: "no_mailbox",
      detail: "Falta el correo de destino, o las quejas no van al mismo buzón.",
      count: 0,
    };
  }

  const name = ready[0]?.recipient_name || email;
  if (!smtpConfigured()) {
    for (const complaint of ready) {
      await updateComplaintFields(complaint.id, {
        email_status: "no_smtp",
        email_error: "SMTP sin configurar",
      });
    }
    return {
      status: "no_smtp",
      detail: `Destino ${email}. Configura el correo del moderador (SMTP) para enviarlo tú.`,
      count: 0,
    };
  }

  const sent = await sendComplaintEmail(ready, email);
  if (!sent.ok) {
    for (const complaint of ready) {
      await updateComplaintFields(complaint.id, {
        email_status: "failed",
        email_error: sent.message,
      });
      await addEvent({
        complaint_id: complaint.id,
        kind: "email_failed",
        message: `No se pudo enviar a ${email}: ${sent.message}`,
      });
    }
    return { status: "failed", detail: sent.message, count: 0 };
  }

  const now = new Date().toISOString();
  const together =
    ready.length > 1 ? ` junto con otras ${ready.length - 1}` : "";
  for (const complaint of ready) {
    await updateComplaintFields(complaint.id, {
      email_status: "sent",
      email_sent_at: now,
      email_error: null,
    });
    await addEvent({
      complaint_id: complaint.id,
      kind: "email_sent",
      message: `El moderador la envió${together} a ${name} (${email}).`,
    });
    if (complaint.mailbox_key) {
      await saveMailbox({
        key: complaint.mailbox_key,
        admin_level: complaint.admin_level,
        name: complaint.recipient_name || email,
        email,
      });
    }
  }

  return {
    status: "sent",
    detail:
      ready.length > 1
        ? `${ready.length} quejas enviadas en un correo a ${email}.`
        : `Enviada a ${email}.`,
    count: ready.length,
  };
}
