import type { Request } from "express";
/**
 * Helper for route handlers that need the verified session user.
 *
 * Takes the plain Request (Express's augmentation types `sessionUser` as
 * optional) and throws a 401-shaped error when requireAuth hasn't populated
 * it — so callers can pass `req` directly without casts.
 */
export function requireSessionUser(req: Request): { userId: string; mobile: string } {
  if (!req.sessionUser) {
    const err = new Error("Sign in to continue.");
    (err as Error & { status?: number }).status = 401;
    throw err;
  }
  return req.sessionUser;
}
