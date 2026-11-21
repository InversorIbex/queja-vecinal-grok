import { NextRequest, NextResponse } from "next/server";
import { listComplaints } from "@/lib/complaints-store";
import { DEMO_RANKINGS } from "@/lib/demo-data";

function isAdmin(req: NextRequest): boolean {
  const expected = process.env.ADMIN_SECRET ?? "demo-admin";
  return req.headers.get("x-admin-secret") === expected;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const all = await listComplaints();
  const stats = {
    total: all.length,
    pending: all.filter((c) => c.status === "pending").length,
    approved: all.filter((c) => c.status === "approved").length,
    resolved: all.filter((c) => c.status === "resolved").length,
    rejected: all.filter((c) => c.status === "rejected").length,
    sent: all.filter((c) => c.email_status === "sent").length,
    byCategory: Object.fromEntries(
      [...new Set(all.map((c) => c.category))].map((cat) => [
        cat,
        all.filter((c) => c.category === cat).length,
      ])
    ),
    topNeighbors: DEMO_RANKINGS.slice(0, 5),
  };
  return NextResponse.json({ stats });
}
