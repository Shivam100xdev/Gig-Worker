import { Router } from "express";
import { requireAuth, requireSessionUser } from "../middleware/authUse.js";
import { calendarService } from "../services/calendarService.js";


const router = Router();

router.get("/login", async (_req, res) => {
  try {
    const consentUrl = calendarService.consentUrl();
    res.redirect(consentUrl)
  } catch (err) {
    console.log(err);
  }
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    res.json(await calendarService.listReminders(userId));
  } catch (err) {
    next(err);
  }
});

router.get("/auth", requireAuth, (_req, res) => {
  if (!calendarService.isConfigured()) {
    res.status(503).json({
      error: "Google Calendar is not configured. Set GOOGLE_CLIENT_ID/SECRET in backend/.env.",
    });
    return;
  }
  res.redirect(calendarService.consentUrl());
});

router.get("/callback", async (req, res, next) => {
  try {
    const session = requireSessionUser(req);
    const code = req.query.code as string | undefined;
    if (!code) {
      res.status(400).send("Missing ?code from Google.");
      return;
    }
    await calendarService.exchangeCode(code, session.userId, session.mobile);
    res.redirect(`${process.env.CORS_ORIGIN ?? "http://localhost:5173"}/?calendar=connected`);
  } catch (err) {
    next(err);
  }
});

router.post("/sync", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    const results = await calendarService.syncReminders(userId);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});

router.post("/disconnect", requireAuth, async (req, res, next) => {
  try {
    const { userId } = requireSessionUser(req);
    await calendarService.disconnect(userId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
