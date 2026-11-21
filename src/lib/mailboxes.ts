import { demoStore } from "@/lib/demo-data";
import { createServiceClient } from "@/lib/supabase/server";
import { schemaMode } from "@/lib/schema-mode";
import { isDemoMode } from "@/lib/utils";
import type { AdminLevel } from "@/types";

export interface SavedMailbox {
  key: string;
  admin_level: AdminLevel;
  name: string;
  email: string;
}

function useMemory(): boolean {
  return isDemoMode() || !createServiceClient();
}

export async function getSavedMailbox(key: string): Promise<SavedMailbox | null> {
  if ((await schemaMode()) === "legacy") {
    try {
      const sb = createServiceClient()!;
      const { data, error } = await sb
        .from("geo_cache")
        .select("payload")
        .eq("cache_key", `qv-mail:${key}`)
        .maybeSingle();
      if (error || !data?.payload) return null;
      const payload =
        typeof data.payload === "string" ? JSON.parse(data.payload) : data.payload;
      if (!payload?.email) return null;
      return {
        key,
        admin_level: payload.admin_level,
        name: payload.name,
        email: payload.email,
      };
    } catch {
      return null;
    }
  }
  if (useMemory()) {
    return demoStore.mailboxes.find((m) => m.key === key) ?? null;
  }
  try {
    const sb = createServiceClient()!;
    const { data, error } = await sb
      .from("admin_mailboxes")
      .select("*")
      .eq("mailbox_key", key)
      .maybeSingle();
    if (error || !data) return null;
    return {
      key: data.mailbox_key as string,
      admin_level: data.admin_level as AdminLevel,
      name: data.recipient_name as string,
      email: data.email as string,
    };
  } catch {
    return null;
  }
}

export async function saveMailbox(input: SavedMailbox): Promise<boolean> {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) return false;
  const row: SavedMailbox = { ...input, email };

  if ((await schemaMode()) === "legacy") {
    try {
      const sb = createServiceClient()!;
      const { error } = await sb.from("geo_cache").upsert(
        {
          cache_key: `qv-mail:${row.key}`,
          payload: JSON.stringify({
            email: row.email,
            name: row.name,
            admin_level: row.admin_level,
          }),
          created_at: new Date().toISOString(),
        },
        { onConflict: "cache_key" }
      );
      return !error;
    } catch {
      return false;
    }
  }

  if (useMemory()) {
    const i = demoStore.mailboxes.findIndex((m) => m.key === row.key);
    if (i >= 0) demoStore.mailboxes[i] = row;
    else demoStore.mailboxes.push(row);
    return true;
  }

  try {
    const sb = createServiceClient()!;
    const { error } = await sb.from("admin_mailboxes").upsert(
      {
        mailbox_key: row.key,
        admin_level: row.admin_level,
        recipient_name: row.name,
        email: row.email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "mailbox_key" }
    );
    return !error;
  } catch {
    return false;
  }
}
