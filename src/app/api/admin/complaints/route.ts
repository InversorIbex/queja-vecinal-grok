import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";
import { listComplaints } from "@/lib/complaints-store";
import type { ComplaintCategory, ComplaintStatus } from "@/types";

export async function GET(req: NextRequest) {
  const auth = authorizeAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category") as ComplaintCategory | null;
  const q = searchParams.get("q")?.trim().toLowerCase();
  const withPhotos = searchParams.get("withPhotos") === "1";

  let complaints = await listComplaints(
    status && status !== "all"
      ? { status: status as ComplaintStatus }
      : undefined
  );

  if (category && category !== ("all" as ComplaintCategory)) {
    complaints = complaints.filter((c) => c.category === category);
  }
  if (withPhotos) {
    complaints = complaints.filter((c) => c.photos.length > 0);
  }
  if (q) {
    complaints = complaints.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.anonymous_nickname.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({
    complaints,
    isSuperAdmin: auth.isSuperAdmin,
  });
}
