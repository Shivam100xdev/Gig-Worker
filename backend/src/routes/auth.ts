import { Router, Response, Request } from "express";
import { z } from "zod";
import { requireAuth, requireSessionUser, readSession } from "../middleware/authUse.js";
import { authService, type OtpPurpose } from "../services/authService.js";
import { prisma } from "../lib/prisma.js";
import { getGoogleAuthUrl, getCode } from "../services/gAuth.js";
/**
 * Mobile-OTP auth:
 *   POST /api/auth/otp/request  { mobile, purpose }  -> send OTP (Redis, 5 min TTL)
 *   POST /api/auth/otp/verify   { mobile, code }     -> creates user on first login, sets JWT cookie
 *   GET  /api/auth/session      -> current user or 401
 *   PATCH /api/auth/profile     { name?, email? }
 *   POST /api/auth/pan          { pan, code }  -> PAN change requires fresh OTP (high-value field)
 *   POST /api/auth/logout
 */

const router = Router();

router.get("/login-google", (req: Request, res: Response) => {
  const url = getGoogleAuthUrl();
  return res.redirect(url);
})

router.get("/callback", async (req:Request, res:Response) => {
  const {code } = req.query;

  if(!code) return res.status(400).json({message: "Missing Code"});

  const success = await getCode(code as string);
  res.status(200).json({message: "Logged In successfully. 🥰"});
})
const requestSchema = z.object({
  mobile: z.string().min(10).max(15),
  purpose: z.enum(["login", "pan_update"]).default("login"),
});


router.post("/otp/request", async (req, res, next) => {
  try {
    const { mobile, purpose } = requestSchema.parse(req.body);
    const result = await authService.requestOtp(mobile, purpose as OtpPurpose);
    res.json({ ok: true, mobile: result.mobile, expiresInSec: result.expiresInSec, devCode: result.devCode });
  } catch (err) {
    next(err);
  }
});

const verifySchema = z.object({
  mobile: z.string().min(10).max(15),
  code: z.string().min(4).max(8),
});

router.post("/otp/verify", async (req, res, next) => {
  try {
    const { mobile, code } = verifySchema.parse(req.body);
    const user = await authService.verifyOtp(mobile, code, "login");
    authService.startSession(res, user.id, user.mobile);
    res.json({
      user: {
        id: user.id,
        mobile: user.mobile,
        name: user.name,
        email: user.email,
        pan: user.pan,
        gstin: user.gstin,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/session", (req, res, next) => {
  const session = readSession(req);
  if (!session) {
    res.status(401).json({ user: null });
    return;
  }
  prisma.user
    .findUnique({
      where: { id: session.userId },
      select: { id: true, mobile: true, name: true, email: true, pan: true, gstin: true },
    })
    .then((user) => {
      if (!user) {
        res.status(401).json({ user: null });
        return;
      }
      res.json({ user });
    })
    .catch(next);
});

router.patch("/profile", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    const input = z
      .object({
        name: z.string().trim().max(120).optional(),
        email: z.string().trim().email().optional(),
        gstin: z.string().trim().max(15).optional(),
      })
      .parse(req.body);
    const user = await authService.updateProfile(userId, input);
    res.json({ user: { id: user.id, name: user.name, email: user.email, gstin: user.gstin } });
  } catch (err) {
    next(err);
  }
});

router.post("/pan", requireAuth, async (req, res, next) => {
  try {
    const { userId, mobile } = requireSessionUser(req);
    const input = z
      .object({
        pan: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Format: AAAAA9999A"),
        code: z.string().min(4).max(8),
      })
      .parse(req.body);

    // PAN is the highest-value field on the account: require a fresh OTP
    // even though the session is already valid.
    await authService.verifyOtp(mobile, input.code, "pan_update");
    const user = await authService.updatePan(userId, input.pan);
    res.json({ user: { id: user.id, pan: user.pan } });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (_req, res) => {
  authService.endSession(res);
  res.json({ ok: true });
});

export default router;
