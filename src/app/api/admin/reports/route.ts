import { NextRequest, NextResponse } from "next/server";
import { demoStore } from "@/lib/demo-data";

function isAdmin(req: NextRequest): boolean {
  const expected = process.env.ADMIN_SECRET ?? "demo-admin";
  return req.headers.get("x-admin-secret") === expected;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json({ reports: demoStore.reports });
}

export async function PATCH(req: NextRequest) {
  if (!isAdmin(req)) {
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
