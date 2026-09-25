import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import ledgerRoutes from "./routes/ledger.js";
import statementRoutes from "./routes/statements.js";
import gstRoutes from "./routes/gst.js";
import calendarRoutes from "./routes/calendar.js";
import assistantRoutes from "./routes/assistant.js";
import reviewsRoutes from "./routes/reviews.js";
import faqRoutes from "./routes/faqs.js";

/**
 * Gig backend — Express entrypoint.
 * Session auth via httpOnly JWT cookie; all ledger data scoped per user.
 */
const app = express();
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "http://localhost:5173",
    credentials: true, // required for the session cookie
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "gig-backend", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api", ledgerRoutes);
app.use("/api/statements", statementRoutes);
app.use("/api/gst", gstRoutes);
app.use("/api/calendar", authRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/faqs", faqRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Central error handler — keeps ApiError-ish shapes consistent.
app.use((err: Error & { status?: number; code?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status ?? (err.name === "ZodError" ? 400 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 ? "Something went wrong. Try again." : err.message,
  });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`gig-backend listening on http://localhost:${port}`);
});
