import { NextRequest, NextResponse } from "next/server";
import { getComplaintByCode, listEvents } from "@/lib/complaints-store";
import { normalizeTrackingCode } from "@/lib/tracking";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { code } = await ctx.params;
  try {
    const complaint = await getComplaintByCode(normalizeTrackingCode(code));
    if (!complaint) {
      return NextResponse.json(
        { error: "No hay ninguna queja con ese código." },
        { status: 404 }
      );
    }
    const events = await listEvents(complaint.id);
    const publicComplaint = { ...complaint };
    delete publicComplaint.reporter_email;
    return NextResponse.json({ complaint: publicComplaint, events });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "No se pudo consultar el seguimiento" }, { status: 500 });
  }
}
