/**
 * Resolve Supabase public client config.
 *
 * Canonical names (Cursor Secrets / Flutter / server): SUPABASE_URL, SUPABASE_ANON_KEY.
 * Next.js browser needs NEXT_PUBLIC_* mirrors (set in .env.local or via next.config env map).
 */
export function getSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    ""
  );
}

export function getSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    ""
  );
}

export function hasSupabaseConfig(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return false;
  if (url.includes("YOUR_PROJECT")) return false;
  if (key === "your_anon_key" || key === "your_publishable_or_anon_key") {
    return false;
  }
  return true;
}
