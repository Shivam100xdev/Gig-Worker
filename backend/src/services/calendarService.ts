import { google } from "googleapis";
import { prisma } from "../lib/prisma.js";

/**
 * Google Calendar — ITR deadline reminders.
 *
 * OAuth flow: /api/calendar/auth -> Google consent -> /api/calendar/callback
 * stores tokens (calendar_tokens table). "Sync reminders" upserts the
 * statutory deadlines the user hasn't already got as events (idempotent via
 * the (user,label,due) unique constraint + eventId persistence).
 */

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];

function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:4000/api/calendar/callback"
  );
}

/** The statutory dates every gig worker should care about (FY 2025-26). */
export function statutoryDeadlines(now = new Date()): { label: string; dueDate: string }[] {
  const y = now.getUTCFullYear();
  // Deadlines that fall in/around the current and next FY.
  return [
    { label: "Advance tax Q1", dueDate: `${y}-06-15` },
    { label: "Advance tax Q2", dueDate: `${y}-09-15` },
    { label: "Advance tax Q3", dueDate: `${y}-12-15` },
    { label: "Advance tax Q4", dueDate: `${y + 1}-03-15` },
    { label: "ITR filing deadline (non-audit)", dueDate: `${y + 1}-07-31` },
  ];
}

async function freshAccessToken(userId: string): Promise<{ token: string; refreshToken: string | null } | null> {
  const row = await prisma.calendarToken.findUnique({ where: { userId } });
  if (!row) return null;

  const oauth = oauthClient();
  oauth.setCredentials({ access_token: row.accessToken, refresh_token: row.refreshToken ?? undefined });
  if (row.expiresAt.getTime() < Date.now() + 60_000 && row.refreshToken) {
    const { credentials } = await oauth.refreshAccessToken();
    await prisma.calendarToken.update({
      where: { userId },
      data: {
        accessToken: credentials.access_token!,
        expiresAt: new Date(credentials.expiry_date ?? Date.now() + 3600_000),
      },
    });
    return { token: credentials.access_token!, refreshToken: row.refreshToken };
  }
  return { token: row.accessToken, refreshToken: row.refreshToken };
}

export const calendarService = {
  isConfigured(): boolean {
    return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  },

  consentUrl(): string {
    const oauth = oauthClient();
    return oauth.generateAuthUrl({
      access_type: "offline", // need a refresh token for long-lived reminders
      prompt: "consent",
      scope: SCOPES,
    });
  },

  async exchangeCode(code: string, userId: string, mobile: string) {
    const oauth = oauthClient();
    const { tokens } = await oauth.getToken(code);
    await prisma.calendarToken.upsert({
      where: { userId },
      update: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token ?? undefined,
        expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600_000),
        scope: tokens.scope ?? null,
      },
      create: {
        userId,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600_000),
        scope: tokens.scope ?? null,
      },
    });
    return { userId, mobile };
  },

  isConnected(): boolean {
    return calendarService.isConfigured();
  },

  async disconnect(userId: string) {
    await prisma.calendarToken.deleteMany({ where: { userId } });
  },

  /** Create the statutory deadline events; returns per-label status. */
  async syncReminders(userId: string): Promise<{ label: string; status: "created" | "exists" }[]> {
    const creds = await freshAccessToken(userId);
    if (!creds) {
      const err = new Error("Connect Google Calendar first.");
      (err as Error & { status?: number }).status = 400;
      throw err;
    }

    const oauth = oauthClient();
    oauth.setCredentials({ access_token: creds.token });
    const calendar = google.calendar({ version: "v3", auth: oauth });

    const existing = await prisma.deadlineReminder.findMany({ where: { userId } });
    const results: { label: string; status: "created" | "exists" }[] = [];

    for (const d of statutoryDeadlines()) {
      const due = new Date(`${d.dueDate}T09:00:00Z`);
      let row = existing.find((r) => r.label === d.label && sameDay(r.dueDate, due));

      if (row?.eventId) {
        results.push({ label: d.label, status: "exists" });
        continue;
      }

      if (!row) {
        row = await prisma.deadlineReminder.create({ data: { userId, label: d.label, dueDate: due } });
      }

      const res = await calendar.events.insert({
        calendarId: "primary",
        requestBody: {
          summary: `Gig · ${d.label}`,
          description: "Auto-added by Gig — your ITR/advance-tax deadline.",
          start: { date: d.dueDate },
          end: { date: nextDay(d.dueDate) },
          reminders: {
            useDefault: false,
            overrides: [
              { method: "popup", minutes: 24 * 60 },
              { method: "email", minutes: 7 * 24 * 60 },
            ],
          },
        },
      });

      await prisma.deadlineReminder.update({
        where: { id: row.id },
        data: { eventId: res.data.id, syncedAt: new Date() },
      });
      results.push({ label: d.label, status: "created" });
    }

    return results;
  },

  async listReminders(userId: string) {
    const rows = await prisma.deadlineReminder.findMany({
      where: { userId },
      orderBy: { dueDate: "asc" },
    });
    const connected = (await prisma.calendarToken.findUnique({ where: { userId }, select: { userId: true } })) != null;
    return {
      connected,
      reminders: rows.map((r) => ({
        id: r.id,
        label: r.label,
        dueDate: r.dueDate,
        syncedToCalendar: Boolean(r.eventId),
      })),
      // Always show the statutory list even before sync, with sync state.
      statutory: statutoryDeadlines().map((d) => ({
        ...d,
        syncedToCalendar: rows.some((r) => r.label === d.label && sameDay(r.dueDate, new Date(`${d.dueDate}T00:00:00Z`)) && Boolean(r.eventId)),
      })),
    };
  },
};

function sameDay(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

function nextDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
