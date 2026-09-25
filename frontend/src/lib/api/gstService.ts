/**
 * GST desk service — backed by Postgres + the IRIS IRP integration server-
 * side. Mock mode simulates invoice creation and IRN generation so the UI
 * is fully explorable without credentials.
 */
import { api, mockDelay, USE_MOCKS, mockSessionStore } from "./client";

export interface GstInvoiceDto {
  id: string;
  customerName: string;
  customerGstin: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  taxableValue: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  irn: string | null;
  irnGenerated: boolean;
  ackNo: string | null;
  mode: "draft" | "generated";
}

export interface GstSummary {
  gstin: string | null;
  aggregateTurnover: number;
  threshold: number;
  registrationLikelyRequired: boolean;
  invoices: { count: number; taxableValue: number };
}

const MOCK_KEY = "gig:mock-gst-invoices";
const MOCK_GSTIN_KEY = "gig:mock-gstin";

function mockInvoices(): GstInvoiceDto[] {
  const raw = localStorage.getItem(MOCK_KEY);
  return raw ? (JSON.parse(raw) as GstInvoiceDto[]) : [];
}

function saveMockInvoices(list: GstInvoiceDto[]) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(list));
}

function mockGstin(): string | null {
  return localStorage.getItem(MOCK_GSTIN_KEY);
}

export const gstService = {
  async setGstin(gstin: string | null): Promise<void> {
    if (USE_MOCKS) {
      if (gstin) localStorage.setItem(MOCK_GSTIN_KEY, gstin);
      else localStorage.removeItem(MOCK_GSTIN_KEY);
      return;
    }
    await api.patch("/auth/profile", { gstin: gstin ?? "" });
  },

  async getGstin(): Promise<string | null> {
    if (USE_MOCKS) return mockGstin();
    const session = await api.get<{ user: { gstin: string | null } }>("/auth/session");
    return session.user?.gstin ?? null;
  },

  async summary(): Promise<GstSummary> {
    if (USE_MOCKS) {
      await mockDelay(300);
      const invoices = mockInvoices();
      const taxable = invoices.reduce((s, i) => s + i.taxableValue, 0);
      const threshold = 2_000_000;
      return {
        gstin: mockGstin(),
        aggregateTurnover: Math.max(taxable, 0),
        threshold,
        registrationLikelyRequired: taxable > threshold,
        invoices: { count: invoices.length, taxableValue: taxable },
      };
    }
    return api.get<GstSummary>("/gst/summary");
  },

  async listInvoices(): Promise<GstInvoiceDto[]> {
    if (USE_MOCKS) {
      await mockDelay(300);
      return mockInvoices();
    }
    return (await api.get<{ invoices: GstInvoiceDto[] }>("/gst/invoices")).invoices;
  },

  async createInvoice(input: {
    customerName: string;
    customerGstin?: string;
    invoiceNumber: string;
    invoiceDate: string;
    taxableValue: number;
    gstRate: number;
    isInterState: boolean;
  }): Promise<GstInvoiceDto> {
    if (USE_MOCKS) {
      await mockDelay(400);
      const tax = input.taxableValue * (input.gstRate / 100);
      const invoice: GstInvoiceDto = {
        id: crypto.randomUUID(),
        customerName: input.customerName,
        customerGstin: input.customerGstin ?? null,
        invoiceNumber: input.invoiceNumber,
        invoiceDate: input.invoiceDate,
        taxableValue: input.taxableValue,
        gstRate: input.gstRate,
        cgst: input.isInterState ? 0 : tax / 2,
        sgst: input.isInterState ? 0 : tax / 2,
        igst: input.isInterState ? tax : 0,
        total: input.taxableValue + tax,
        irn: null,
        irnGenerated: false,
        ackNo: null,
        mode: "draft",
      };
      saveMockInvoices([invoice, ...mockInvoices()]);
      return invoice;
    }
    const res = await api.post<{ invoiceId: string }>("/gst/invoices", input);
    const invoices = await (await api.get<{ invoices: GstInvoiceDto[] }>("/gst/invoices")).invoices;
    return invoices.find((i) => i.id === res.invoiceId) ?? invoices[0];
  },

  async generateIrn(invoiceId: string): Promise<{ irn: string; ackNo: string; mode: "live" | "simulation" }> {
    if (USE_MOCKS) {
      await mockDelay(800);
      const invoices = mockInvoices();
      const inv = invoices.find((i) => i.id === invoiceId);
      if (!inv) throw new Error("Invoice not found.");
      if (!mockGstin()) throw new Error("Add your GSTIN before generating e-invoices.");
      inv.irn = Array.from({ length: 64 }, () => "0123456789ABCDEF"[Math.floor(Math.random() * 16)]).join("");
      inv.irnGenerated = true;
      inv.ackNo = String(Math.floor(1e10 + Math.random() * 9e10));
      inv.mode = "generated";
      saveMockInvoices(invoices);
      return { irn: inv.irn, ackNo: inv.ackNo, mode: "simulation" };
    }
    return api.post(`/gst/invoices/${invoiceId}/generate-irn`);
  },
};

// keep the session store import used when tree-shaking mock paths
void mockSessionStore;
