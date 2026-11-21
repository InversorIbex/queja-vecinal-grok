import { createServiceClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/utils";

let cached: "demo" | "app" | "legacy" | null = null;

/** `legacy`: la tabla real (id entero, author_alias). `app`: el esquema de 001_init.sql. */
export async function schemaMode(): Promise<"demo" | "app" | "legacy"> {
  if (isDemoMode() || !createServiceClient()) return "demo";
  if (cached && cached !== "demo") return cached;
  const sb = createServiceClient()!;
  const { error } = await sb.from("complaints").select("author_alias").limit(1);
  cached = error ? "app" : "legacy";
  return cached;
}
