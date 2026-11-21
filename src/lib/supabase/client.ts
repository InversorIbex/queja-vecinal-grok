import { createBrowserClient } from "@supabase/ssr";
import { hasSupabaseAnon } from "@/lib/utils";

export function createClient() {
  if (!hasSupabaseAnon()) {
    return null;
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
