import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";
import { listComplaints, listProfiles } from "@/lib/complaints-store";
import { DEMO_RANKINGS } from "@/lib/demo-data";

export async function GET(req: NextRequest) {
  const auth = authorizeAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const [all, profiles] = await Promise.all([
    listComplaints(),
    listProfiles(),
  ]);
  const stats = {
    total: all.length,
    pending: all.filter((c) => c.status === "pending").length,
    approved: all.filter((c) => c.status === "approved").length,
    resolved: all.filter((c) => c.status === "resolved").length,
    rejected: all.filter((c) => c.status === "rejected").length,
    withPhotos: all.filter((c) => c.photos.length > 0).length,
    bannedUsers: profiles.filter((p) => p.banned).length,
    byCategory: Object.fromEntries(
      [...new Set(all.map((c) => c.category))].map((cat) => [
        cat,
        all.filter((c) => c.category === cat).length,
      ])
    ),
    topNeighbors: DEMO_RANKINGS.slice(0, 5),
  };
  return NextResponse.json({ stats, isSuperAdmin: auth.isSuperAdmin });
}
