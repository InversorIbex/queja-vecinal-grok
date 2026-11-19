import { NextRequest } from "next/server";

/**
 * Autorización del panel / APIs de moderación.
 *
 * - Header `x-admin-secret` (o body `adminToken`) debe coincidir con `ADMIN_SECRET`
 *   (por defecto `demo-admin`).
 * - `SUPER_ADMIN_EMAIL`: email documentado del super admin (Ence). El panel lo
 *   envía en `x-super-admin-email`. Sin variable → el secreto admin actúa como
 *   super_admin (modo local/demo).
 */
export function getAdminSecret(): string {
  return process.env.ADMIN_SECRET ?? "demo-admin";
}

export function getSuperAdminEmail(): string | null {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  return email || null;
}

export type AdminAuth = {
  ok: boolean;
  isSuperAdmin: boolean;
};

function secretMatches(req: NextRequest, bodyToken?: string): boolean {
  const expected = getAdminSecret();
  return (
    req.headers.get("x-admin-secret") === expected || bodyToken === expected
  );
}

export function authorizeAdmin(
  req: NextRequest,
  bodyToken?: string
): AdminAuth {
  if (!secretMatches(req, bodyToken)) {
    return { ok: false, isSuperAdmin: false };
  }
  return { ok: true, isSuperAdmin: isSuperAdminRequest(req) };
}

/** ¿El request está marcado como SUPER_ADMIN? */
export function isSuperAdminRequest(req: NextRequest): boolean {
  const configured = getSuperAdminEmail();
  if (!configured) {
    // Sin SUPER_ADMIN_EMAIL: cualquier admin autenticado es super_admin (demo).
    return true;
  }
  const claimed = req.headers.get("x-super-admin-email")?.trim().toLowerCase();
  return claimed === configured;
}

/** Acciones elevadas: banear, borrar fotos/comentarios. */
export function requireSuperAdmin(
  req: NextRequest,
  bodyToken?: string
): AdminAuth {
  if (!secretMatches(req, bodyToken)) {
    return { ok: false, isSuperAdmin: false };
  }
  const isSuper = isSuperAdminRequest(req);
  return { ok: isSuper, isSuperAdmin: isSuper };
}
