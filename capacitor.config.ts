import { readFileSync } from "node:fs";
import type { CapacitorConfig } from "@capacitor/cli";

function envValue(name: string): string {
  const fromProcess = process.env[name]?.trim();
  if (fromProcess) return fromProcess.replace(/^["']|["']$/g, "");
  try {
    const line = readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .find((row) => row.startsWith(`${name}=`));
    return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, "") : "";
  } catch {
    return "";
  }
}

const explicit = envValue("CAPACITOR_SERVER_URL");
const site = (explicit || envValue("NEXT_PUBLIC_SITE_URL")).replace(/\/$/, "");
const remote =
  /^https:\/\//i.test(site) || (explicit.startsWith("http://") && /^http:\/\//i.test(site))
    ? site
    : "";

const config: CapacitorConfig = {
  appId: "es.quejasvecinales.app",
  appName: "QuejasVecinales",
  webDir: "mobile",
  server: remote
    ? {
        url: remote,
        androidScheme: "https",
        cleartext: remote.startsWith("http://"),
      }
    : undefined,
};

export default config;
