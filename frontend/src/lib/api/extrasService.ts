/**
 * Dashboard extras: Gemini AI chat, Google Calendar deadlines, community
 * reviews and FAQs. Mock mode fakes each so the UI is complete without a
 * backend running.
 */
import { api, mockDelay, USE_MOCKS } from "./client";

// ---------------- AI assistant (Gemini) ----------------

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

const GEMINI_FALLBACK = `AI assistant isn't configured on this deployment. Set GEMINI_API_KEY in backend/.env (free key at aistudio.google.com/apikey) and restart the backend.

Meanwhile, quick answers:
• Advance-tax dates: Jun 15 / Sep 15 / Dec 15 / Mar 15
• ITR deadline (non-audit): Jul 31
• GST registration: generally required past ₹20L services turnover`;

const MOCK_ANSWERS: { match: RegExp; reply: string }[] = [
  { match: /deadline|due date|last date/i, reply: "For FY 2025-26 (AY 2026-27): advance-tax instalments are Sep 15, Dec 15 and Mar 15, and the ITR filing deadline for non-audit cases is Jul 31, 2026. Connect Google Calendar in the Deadlines card and these land in your calendar automatically with reminders." },
  { match: /gst|turnover/i, reply: "GST registration is generally required once aggregate services turnover crosses ₹20 lakh in a financial year. Check the GST desk — the app tracks your reported turnover against the threshold and nudges you before you cross it." },
  { match: /tds|receipt|deduct/i, reply: "When a platform or client deducts TDS, log it with the entry — the app then blocks a clean filing until you confirm the amount against the actual receipt (Form 16A or the platform's statement). That keeps your claimed credit defensible." },
  { match: /44ada|presumptive| itr|form/i, reply: "Most gig workers file ITR-4 under Section 44ADA (presumptive: 50% of gross receipts deemed profit, up to ₹50L) or ITR-3 if maintaining books. The dashboard's live number is a slab-based estimate; the filing step recomputes from your entries." },
  { match: /refund/i, reply: "If tax already deducted (TDS) exceeds your computed liability, you're due a refund — the dashboard shows it as a negative balance payable. Refunds typically arrive 2–6 weeks after the return is processed, straight to your bank account via the pre-validated refund mandate." },
];

export const assistantService = {
  async chat(history: ChatTurn[]): Promise<string> {
    if (USE_MOCKS) {
      await mockDelay(900);
      const last = history.filter((m) => m.role === "user").slice(-1)[0]?.text ?? "";
      const hit = MOCK_ANSWERS.find((m) => m.match.test(last));
      return (
        hit?.reply ??
        "I can help with ITR forms, TDS receipts, GST thresholds, advance-tax dates and how to use this app. Try asking about a deadline, or “do I need GST registration?”"
      );
    }
    const res = await api.post<{ reply: string }>("/assistant/chat", {
      messages: history.map((m) => ({ role: m.role === "assistant" ? "model" : "user", text: m.text })),
    });
    return res.reply;
  },

  fallbackMessage: GEMINI_FALLBACK,
};

// ---------------- Google Calendar deadlines ----------------

export interface CalendarState {
  connected: boolean;
  configured: boolean;
  statutory: { label: string; dueDate: string; syncedToCalendar: boolean }[];
}

const STATUTORY = () => {
  const y = new Date().getUTCFullYear();
  return [
    { label: "Advance tax Q1", dueDate: `${y}-06-15` },
    { label: "Advance tax Q2", dueDate: `${y}-09-15` },
    { label: "Advance tax Q3", dueDate: `${y}-12-15` },
    { label: "Advance tax Q4", dueDate: `${y + 1}-03-15` },
    { label: "ITR filing deadline (non-audit)", dueDate: `${y + 1}-07-31` },
  ];
};

const CAL_KEY = "gig:mock-calendar-synced";

export const calendarExtrasService = {
  async state(): Promise<CalendarState> {
    if (USE_MOCKS) {
      await mockDelay(200);
      const synced = localStorage.getItem(CAL_KEY) === "1";
      const configured = true;
      return {
        connected: synced,
        configured,
        statutory: STATUTORY().map((d) => ({ ...d, syncedToCalendar: synced })),
      };
    }
    try {
      const res = await api.get<{ connected: boolean; statutory: CalendarState["statutory"] }>("/calendar");
      return { connected: res.connected, configured: true, statutory: res.statutory };
    } catch {
      return { connected: false, configured: false, statutory: STATUTORY().map((d) => ({ ...d, syncedToCalendar: false })) };
    }
  },

  async connect(): Promise<void> {
    if (USE_MOCKS) {
      await mockDelay(600);
      localStorage.setItem(CAL_KEY, "1");
      return;
    }
    // Full-page redirect to Google consent; backend drops the session cookie
    // back and lands on /?calendar=connected.
    window.location.href =
  `${import.meta.env.VITE_API_BASE_URL}/calendar/auth`;
  },

  async sync(): Promise<void> {
    if (USE_MOCKS) {
      await mockDelay(700);
      localStorage.setItem(CAL_KEY, "1");
      return;
    }
    await api.post("/calendar/sync");
  },
};

// ---------------- Reviews ----------------

export interface ReviewDto {
  id: string;
  displayName: string;
  platformName: string | null;
  rating: number;
  headline: string;
  body: string;
  createdAt: string;
}

const MOCK_REVIEWS: ReviewDto[] = [
  {
    id: "r1",
    displayName: "Priya S.",
    platformName: "Upwork",
    rating: 5,
    headline: "Cleanest way to track freelance TDS",
    body: "Earlier I dug through Upwork invoices every March. Now each gig is one entry with the TDS already split out — my CA got a tidy summary instead of a folder of screenshots.",
    createdAt: new Date(Date.now() - 86400_000 * 6).toISOString(),
  },
  {
    id: "r2",
    displayName: "Rohit K.",
    platformName: "Swiggy",
    rating: 4,
    headline: "Finally know what I actually owe",
    body: "The live tax number while I log income is the killer feature. No more spreadsheet guesswork at deadline time.",
    createdAt: new Date(Date.now() - 86400_000 * 13).toISOString(),
  },
  {
    id: "r3",
    displayName: "Aisha M.",
    platformName: "Ola",
    rating: 5,
    headline: "Bank statement import saved me hours",
    body: "Uploaded my statement, ticked the credits that were payouts, done. Everything landed in the right platform bucket.",
    createdAt: new Date(Date.now() - 86400_000 * 21).toISOString(),
  },
];

const REVIEWS_KEY = "gig:mock-reviews";

function mockReviews(): ReviewDto[] {
  const raw = localStorage.getItem(REVIEWS_KEY);
  return raw ? (JSON.parse(raw) as ReviewDto[]) : MOCK_REVIEWS;
}

export const reviewsService = {
  async list(): Promise<ReviewDto[]> {
    if (USE_MOCKS) {
      await mockDelay(250);
      return mockReviews();
    }
    return (await api.get<{ reviews: ReviewDto[] }>("/reviews")).reviews;
  },

  async create(input: { rating: number; headline: string; body: string; platformName?: string }): Promise<void> {
    if (USE_MOCKS) {
      await mockDelay(400);
      const list = mockReviews();
      list.unshift({
        id: crypto.randomUUID(),
        displayName: "You",
        platformName: input.platformName ?? null,
        rating: input.rating,
        headline: input.headline,
        body: input.body,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(list));
      return;
    }
    await api.post("/reviews", input);
  },
};

// ---------------- FAQs ----------------

export interface FaqDto {
  id: number | string;
  question: string;
  answer: string;
}

const MOCK_FAQS: FaqDto[] = [
  {
    id: 1,
    question: "Is my PAN and income data safe here?",
    answer: "Data is encrypted in transit, stored against your account in PostgreSQL, and nothing is shared with platforms. OTP login means no password to leak — only someone holding your phone can get in.",
  },
  {
    id: 2,
    question: "I work across five apps. Do I add each one separately?",
    answer: "Yes — add each platform once, then log income under it. The dashboard totals every platform together so your tax estimate is always the combined picture.",
  },
  {
    id: 3,
    question: "What if a platform deducted TDS but I never got the certificate?",
    answer: "Log the TDS as \"Platform TDS\". The app blocks a clean filing until you confirm the amount against the actual receipt (Form 16A / platform statement), which keeps your claimed credit honest.",
  },
  {
    id: 4,
    question: "Can I just upload my bank statement instead of typing entries?",
    answer: "Yes. Upload a PDF or image statement on the Import page; OCR extracts credit lines and proposes them as income entries. You accept or reject each one before anything touches your ledger.",
  },
  {
    id: 5,
    question: "Do I need GST registration as a gig worker?",
    answer: "Generally not below ₹20 lakh aggregate turnover for services. The app nudges you when you cross the threshold — confirm specifics with a professional.",
  },
  {
    id: 6,
    question: "Which ITR form applies to me?",
    answer: "Most gig workers file ITR-4 (presumptive, Section 44ADA) or ITR-3 (books of account). The in-app estimate is slab-based; the final computation is prepared from your entries at filing time.",
  },
  {
    id: 7,
    question: "What are the actual deadlines I should care about?",
    answer: "Advance-tax quarters (Jun 15, Sep 15, Dec 15, Mar 15) and the July 31 ITR filing deadline for non-audit cases. Connect Google Calendar and the app drops reminders for each as events.",
  },
  {
    id: 8,
    question: "Is the tax number shown the final figure?",
    answer: "No — it's a live slab-based estimate for feedback while you type. It doesn't yet model Section 44ADA presumptive taxation or Chapter VI-A deductions; the filed computation is authoritative.",
  },
];

const FAQ_KEY = "gig:mock-faqs";

export const faqService = {
  async list(): Promise<FaqDto[]> {
    if (USE_MOCKS) {
      await mockDelay(200);
      const raw = localStorage.getItem(FAQ_KEY);
      return raw ? (JSON.parse(raw) as FaqDto[]) : MOCK_FAQS;
    }
    return (await api.get<{ faqs: FaqDto[] }>("/faqs")).faqs;
  },
};
