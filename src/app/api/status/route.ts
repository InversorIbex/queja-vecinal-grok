import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/utils";
import { hasSupabaseConfig } from "@/lib/supabase/config";

/**
 * Runtime status for the client. Demo detection uses canonical SUPABASE_*
 * (Cursor Secrets) and NEXT_PUBLIC_* mirrors — not client-only env.
 */
export async function GET() {
  return NextResponse.json({
    demo: isDemoMode(),
    supabaseConfigured: hasSupabaseConfig(),
  });
}
