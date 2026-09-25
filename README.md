# Gig — Income & ITR Assistant for Gig Workers

One ledger for everything a gig worker earns across platforms (Swiggy, Ola,
Upwork, Fiverr…), with live tax estimates, bank-statement OCR import, a GST
desk wired to IRIS IRP, Google-Calendar deadline reminders, a Gemini AI
assistant, mobile-OTP login — and an ITR filing flow at the end of it.

```
Gig/
├── frontend/    React 18 + TypeScript + Vite + Tailwind + Jotai
├── backend/     Express + Prisma (PostgreSQL) + Redis + integrations
└── databases/   docker-compose (Postgres + Redis), SQL schema & seeds
```

## Quick start

**1. Databases (Postgres 16 + Redis 7)**

```bash
cd databases
docker compose up -d          # Postgres :5433, Redis :6380
```

**2. Backend (API + OTP + OCR + integrations)**

```bash
cd backend
npm install
cp .env.example .env          # defaults work with the docker stack as-is
npx prisma db push            # create tables from prisma/schema.prisma
npm run dev                   # http://localhost:4000
```

**3. Frontend**

```bash
cd frontend
npm install
cp ../.env.example .env       # optional — defaults to mocks
npm run dev                   # http://localhost:5173
```

## Two ways to run the frontend

**Mock mode (default).** `VITE_USE_MOCKS` unset/`true` runs the whole app
against in-browser fakes: OTP is shown on screen (`123456`), OCR produces
sample transactions, GST/IRN, calendar sync and AI chat all simulate. Data
persists to `localStorage`. Great for UI work — no backend needed.

**Real mode.** Set `VITE_USE_MOCKS=false` and `VITE_API_BASE_URL=http://localhost:4000/api`,
start the backend, and every section runs against Postgres + Redis through
the Express API with cookie-session auth.

## What's integrated, and where

| Feature | Frontend | Backend | Data |
|---|---|---|---|
| Mobile-OTP login (JWT cookie session, rate-limited) | `components/auth/LoginScreen` | `routes/auth.ts`, `services/authService.ts` | Redis (OTP), Postgres (users) |
| Platforms + income ledger | `components/{layout,income,platforms}` | `routes/ledger.ts` | Postgres |
| Bank-statement upload + OCR (PDF text layer / tesseract for scans) | `components/import/StatementImport` | `routes/statements.ts`, `services/ocrService.ts` | Postgres |
| ITR filing + JSON export | `components/itr/*` | `routes/ledger.ts` (`/itr/*`) | Postgres |
| GST desk + e-invoice IRN via **IRIS IRP** | `components/gst/GstDesk` | `routes/gst.ts`, `services/irisIrpService.ts` | Postgres |
| Google Calendar deadline reminders | `components/deadlines/DeadlineCard` | `routes/calendar.ts`, `services/calendarService.ts` | Postgres + Google OAuth |
| AI assistant (**Gemini**) | `components/assistant/AssistantWidget` | `routes/assistant.ts`, `services/geminiService.ts` | — |
| Reviews from gig workers | `components/community/ReviewsSection` | `routes/reviews.ts` | Postgres (Redis-cached) |
| FAQs | `components/community/FaqSection` | `routes/faqs.ts` | Postgres (Redis-cached) |

## Keys & credentials

Everything degrades gracefully — each integration has a simulation/dev mode
until you add credentials in `backend/.env`:

- **SMS (OTP delivery):** `SMS_PROVIDER_API_KEY` — without it, OTPs are
  logged and surfaced in the UI (dev only).
- **Google Calendar:** `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` —
  create at console.cloud.google.com, enable Calendar API, redirect
  `http://localhost:4000/api/calendar/callback`.
- **Gemini:** `GEMINI_API_KEY` — free at aistudio.google.com/apikey.
- **IRIS IRP / IRIS GST:** `IRIS_*` — sandbox credentials from
  developer.irisirp.com / developer.irisgst.com. Without them, IRN
  generation runs in clearly-labeled simulation mode.

## API surface (implemented by the backend)

```
POST /api/auth/otp/request|verify   POST /api/auth/logout   GET /api/auth/session
PATCH /api/auth/profile             POST /api/auth/pan      (PAN change needs fresh OTP)

GET/POST/DELETE /api/platforms      GET/POST/PATCH/DELETE /api/records
POST /api/itr/file                  POST /api/itr/export    GET /api/summary

POST /api/statements (multipart)    GET /api/statements[/:id]
POST /api/statements/:id/accept     (OCR'd transactions -> income records)

GET  /api/gst/summary|invoices      POST /api/gst/invoices
POST /api/gst/invoices/:id/generate-irn   (IRIS IRP)

GET  /api/calendar                  GET /api/calendar/auth|callback
POST /api/calendar/sync|disconnect

POST /api/assistant/chat            (Gemini with per-user ledger context)
GET  /api/reviews                   POST /api/reviews
GET  /api/faqs
```

## Tax computation & compliance notes

- `frontend/src/lib/taxEngine.ts` keeps a **live slab-based estimate**
  (FY 2025-26, both regimes, 87A rebate) for instant feedback while typing.
- The **backend recomputes authoritatively** from Postgres at filing time
  (`backend/src/lib/taxConstants.ts`) and refuses to file without name, PAN,
  ≥1 entry, and receipts confirmed for every paid TDS entry.
- GST advisory at ₹20L aggregate services turnover is a nudge, not advice.
- Presumptive taxation (44ADA) and Chapter VI-A deductions are out of scope
  for the estimator; the exported JSON gives a CA everything needed.
