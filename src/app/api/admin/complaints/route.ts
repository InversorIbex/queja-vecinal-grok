import { NextRequest, NextResponse } from "next/server";
import { listComplaints } from "@/lib/complaints-store";

function isAdmin(req: NextRequest): boolean {
  const expected = process.env.ADMIN_SECRET ?? "demo-admin";
  return req.headers.get("x-admin-secret") === expected;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const status = new URL(req.url).searchParams.get("status");
  const complaints = await listComplaints(
    status && status !== "all"
      ? { status: status as "pending" | "approved" | "rejected" | "resolved" }
      : undefined
  );
  return NextResponse.json({ complaints });
}
