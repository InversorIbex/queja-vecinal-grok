import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";
import { demoStore } from "@/lib/demo-data";

export async function GET(req: NextRequest) {
  const auth = authorizeAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json({ reports: demoStore.reports });
}

export async function PATCH(req: NextRequest) {
  const auth = authorizeAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id, status } = await req.json();
  const report = demoStore.reports.find((r) => r.id === id);
  if (!report) {
    return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
  }
  if (status === "reviewed" || status === "dismissed" || status === "open") {
    report.status = status;
  }
  return NextResponse.json({ report });
}
