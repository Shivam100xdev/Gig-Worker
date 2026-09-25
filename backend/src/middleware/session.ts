import type { Request } from "express";

/** Helper for route handlers that need the verified session user. */
export function requireSessionUser(req: Request): { userId: string; mobile: string } {
  if (!req.sessionUser) {
    const err = new Error("Sign in to continue.");
    (err as Error & { status?: number }).status = 401;
    throw err;
  }
  return req.sessionUser;
}
