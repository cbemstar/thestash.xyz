const ADMIN_SECRET = process.env.FEEDBACK_ADMIN_SECRET?.trim() ?? "";

export function isAdminKey(key: string | null | undefined): boolean {
  if (!key || typeof key !== "string") return false;
  if (!ADMIN_SECRET) return false;
  return key === ADMIN_SECRET;
}

export function getAdminKeyFromRequest(req: Request): string | null {
  const header = req.headers.get("X-Admin-Key");
  if (header) return header;
  const auth = req.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}
