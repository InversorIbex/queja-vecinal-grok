import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";
import { isDemoMode } from "@/lib/utils";

export function createClient() {
  if (isDemoMode()) {
    return null;
  }
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}
