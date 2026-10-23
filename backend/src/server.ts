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

const configuredOrigins = (process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()).filter(Boolean)) ?? [
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Dev convenience: any localhost/loopback port is trusted outside
      // production, so a dev server bumped to another port (5174 when 5173
      // is busy) still works. Production is restricted to CORS_ORIGIN.
      const isLoopback =
        process.env.NODE_ENV !== "production" &&
        (origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:"));
      if (!origin || configuredOrigins.includes(origin) || isLoopback) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
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
app.use("/api/calendar", calendarRoutes);
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
