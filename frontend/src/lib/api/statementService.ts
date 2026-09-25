/**
 * Bank-statement import service. Mock mode fabricates a plausible OCR
 * result so the review UI is fully explorable without a backend.
 */
import { BASE_URL, mockDelay, USE_MOCKS } from "./client";

export interface ProposedTransaction {
  id: string;
  amount: number;
  txnDate: string | null;
  narration: string;
  counterparty: string | null;
  rawText: string;
  isAccepted: boolean;
}

export interface StatementDto {
  id: string;
  fileName: string;
  ocrStatus: "pending" | "processing" | "done" | "failed";
  errorMessage: string | null;
  uploadedAt: string;
  txCount: number;
  acceptedCount: number;
}

const MOCK_STATEMENTS_KEY = "gig:mock-statements";

interface MockStatement extends StatementDto {
  transactions: ProposedTransaction[];
}

function loadMock(): MockStatement[] {
  const raw = localStorage.getItem(MOCK_STATEMENTS_KEY);
  return raw ? (JSON.parse(raw) as MockStatement[]) : [];
}

function saveMock(list: MockStatement[]) {
  localStorage.setItem(MOCK_STATEMENTS_KEY, JSON.stringify(list));
}

const SAMPLE_NARRATIONS = [
  { narration: "UPI/CR/4482913/SWIGGY LIMITED/payout", counterparty: "SWIGGY LIMITED" },
  { narration: "NEFT CR-ACME CORP PVT LTD INV-8891", counterparty: "ACME CORP PVT LTD" },
  { narration: "IMPS-9932014-UPTOWORK-FREELANCE", counterparty: "UPTOWORK" },
  { narration: "UPI/CR/2231/OLACABS/payout week 32", counterparty: "OLACABS" },
  { narration: "FT CR-918273-ZOMATO LTD-weekly settlement", counterparty: "ZOMATO LTD" },
];

export const statementService = {
  async upload(file: File): Promise<{ statementId: string; transactionsFound: number }> {
    if (USE_MOCKS) {
      await mockDelay(1200);
      const n = 3 + Math.floor(Math.random() * 3);
      const transactions: ProposedTransaction[] = Array.from({ length: n }, (_, i) => {
        const sample = SAMPLE_NARRATIONS[i % SAMPLE_NARRATIONS.length];
        const d = new Date();
        d.setDate(d.getDate() - (i + 1) * 4);
        return {
          id: crypto.randomUUID(),
          amount: Math.round((400 + Math.random() * 24_000) * 100) / 100,
          txnDate: d.toISOString().slice(0, 10),
          narration: sample.narration,
          counterparty: sample.counterparty,
          rawText: `0${(i % 9) + 1}/09/2025  ${sample.narration}  ${(400 + Math.random() * 24_000).toFixed(2)} Cr`,
          isAccepted: false,
        };
      });
      const statement: MockStatement = {
        id: crypto.randomUUID(),
        fileName: file.name,
        ocrStatus: "done",
        errorMessage: null,
        uploadedAt: new Date().toISOString(),
        txCount: n,
        acceptedCount: 0,
        transactions,
      };
      saveMock([statement, ...loadMock()]);
      return { statementId: statement.id, transactionsFound: n };
    }

    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE_URL}/statements`, {
      method: "POST",
      credentials: "include",
      body: form, // no Content-Type header — the browser sets multipart boundary
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? `Upload failed (${res.status})`);
    }
    return res.json();
  },

  async list(): Promise<StatementDto[]> {
    if (USE_MOCKS) {
      await mockDelay(250);
      return loadMock().map(({ transactions, ...s }) => s);
    }
    return (await apiJson<{ statements: StatementDto[] }>(`${BASE_URL}/statements`)).statements;
  },

  async get(statementId: string): Promise<{ statement: StatementDto; transactions: ProposedTransaction[] }> {
    if (USE_MOCKS) {
      await mockDelay(250);
      const s = loadMock().find((x) => x.id === statementId);
      if (!s) throw new Error("Statement not found.");
      return { statement: { ...s }, transactions: s.transactions };
    }
    return apiJson(`${BASE_URL}/statements/${statementId}`);
  },

  async accept(statementId: string, transactionIds: string[], platformId: string): Promise<{ importedCount: number }> {
    if (USE_MOCKS) {
      await mockDelay(500);
      const all = loadMock();
      const s = all.find((x) => x.id === statementId);
      if (!s) throw new Error("Statement not found.");
      let imported = 0;
      for (const t of s.transactions) {
        if (transactionIds.includes(t.id)) {
          t.isAccepted = true;
          imported++;
        }
      }
      s.acceptedCount += imported;
      saveMock(all);
      return { importedCount: imported };
    }
    return apiJson(`${BASE_URL}/statements/${statementId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ transactionIds, platformId }),
    });
  },
};

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}
