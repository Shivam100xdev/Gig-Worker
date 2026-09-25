import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

/**
 * Stateless auth: a signed JWT issued after OTP verification, delivered as
 * an httpOnly cookie (immune to XSS token theft) with SameSite=Lax so the
 * Vite dev server on :5173 can call the API on :4000 with credentials.
 */
const JWT_SECRET = process.env.JWT_SECRET ?? "gig-dev-secret";
const COOKIE_NAME = "gig_session";
const SESSION_TTL_SECONDS = 7 * 24 * 3600; // 7 days

export interface SessionUser {
  userId: string;
  mobile: string;
}

export function issueSession(res: Response, user: SessionUser) {
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: `${SESSION_TTL_SECONDS}s` });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS * 1000,
  });
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE_NAME);
}

export function readSession(req: Request): SessionUser | null {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

/** Express middleware: 401 unless a valid session cookie is present. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = readSession(req);
  if (!session) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }
  req.sessionUser = session;
  next();
}

// Type augmentation so req.sessionUser is typed everywhere.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      sessionUser?: SessionUser;
    }
  }
}
