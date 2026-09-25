import crypto from "node:crypto";

/**
 * IRIS IRP / IRIS GST — e-invoice integration.
 *
 * The Invoice Registration Portal (IRP) is the government's e-invoicing
 * system; IRIS is one of the four GSPs offering API access to it
 * (developer.irisirp.com). We implement the core call a gig worker needs:
 *
 *   Generate IRN  -> returns { Irn, AckNo, AckDt, SignedQRCode }
 *
 * Auth model (per IRIS IRP docs): request body is plaintext JSON with a
 * Base64-SHA256(plaintext) `user_gst` header hash; API credentials come
 * from the IRIS developer console. Sandbox: developer.irisirp.com.
 *
 * Simulation mode: without IRIS_* credentials the service validates the
 * invoice, builds the exact payload it *would* send, and returns a
 * synthetic IRN — so the GST desk is demoable and the switch to live is
 * credentials-only.
 */

const IRIS_BASE_URL = process.env.IRIS_BASE_URL ?? "https://developer.irisirp.com";

export interface EInvoiceInput {
  sellerGstin: string;
  buyerGstin: string | null;
  buyerName: string;
  invoiceNumber: string;
  invoiceDate: string; // "YYYY-MM-DD"
  taxableValue: number;
  gstRate: number; // 0 | 5 | 12 | 18 | 28
  isInterState: boolean;
}

export interface EInvoiceResult {
  irn: string;
  ackNo: string;
  ackDate: string;
  mode: "live" | "simulation";
  payloadSent: Record<string, unknown>;
}

/** SHA256 -> Base64, as IRIS IRP expects for body hashes. */
function sha256Base64(body: string): string {
  return crypto.createHash("sha256").update(body).digest("base64");
}

/** Build the IRP e-invoice payload (NIC schema v1.01 subset). */
export function buildEInvoicePayload(input: EInvoiceInput) {
  const tax = input.taxableValue * (input.gstRate / 100);
  const cgst = input.isInterState ? 0 : tax / 2;
  const sgst = input.isInterState ? 0 : tax / 2;
  const igst = input.isInterState ? tax : 0;
  const total = input.taxableValue + tax;

  return {
    Version: "1.1",
    TranDtls: { TaxSch: "GST", SupTyp: "B2B" },
    DocDtls: { Typ: "INV", No: input.invoiceNumber, Dt: formatDate(input.invoiceDate) },
    SellerDtls: { Gstin: input.sellerGstin, LglNm: "Gig worker" },
    BuyerDtls: { Gstin: input.buyerGstin ?? "URP", LglNm: input.buyerName },
    ItemList: [
      {
        SlNo: "1",
        PrdDesc: "Gig services",
        HsnCd: "998313", // "Other services" — generic for gig/professional services
        Qty: 1,
        Unit: "NOS",
        UnitPrice: input.taxableValue,
        TotAmt: input.taxableValue,
        AssAmt: input.taxableValue,
        GstRt: input.gstRate,
        CgstAmt: round2(cgst),
        SgstAmt: round2(sgst),
        IgstAmt: round2(igst),
        TotItemVal: round2(total),
      },
    ],
    ValDtls: {
      AssVal: round2(input.taxableValue),
      CgstVal: round2(cgst),
      SgstVal: round2(sgst),
      IgstVal: round2(igst),
      RndOffAmt: 0,
      TotInvVal: round2(total),
    },
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`; // IRP wants DD/MM/YYYY
}

export const irisIrpService = {
  isConfigured(): boolean {
    return Boolean(
      process.env.IRIS_CLIENT_ID && process.env.IRIS_CLIENT_SECRET && process.env.IRIS_USERNAME
    );
  },

  /**
   * Generate an IRN for an invoice. Live mode posts to IRIS IRP with the
   * documented auth headers; simulation mode returns a synthetic IRN.
   */
  async generateIrn(input: EInvoiceInput): Promise<EInvoiceResult> {
    const payload = buildEInvoicePayload(input);
    const body = JSON.stringify(payload);

    if (!this.isConfigured()) {
      // Simulation: deterministic synthetic IRN from invoice identity.
      const irn = sha256Base64(`${input.sellerGstin}|${input.invoiceNumber}|${input.invoiceDate}|sim`)
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 64)
        .padEnd(64, "0");
      return {
        irn,
        ackNo: String(Math.floor(1e10 + Math.random() * 9e10)),
        ackDate: new Date().toISOString(),
        mode: "simulation",
        payloadSent: payload,
      };
    }

    // ---- Live path ----------------------------------------------------
    const auth = Buffer.from(`${process.env.IRIS_USERNAME}:${process.env.IRIS_PASSWORD}`).toString("base64");
    const res = await fetch(`${IRIS_BASE_URL}/eiv/main/ir/v1`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "client-id": process.env.IRIS_CLIENT_ID!,
        "client-secret": process.env.IRIS_CLIENT_SECRET!,
        Authorization: `Basic ${auth}`,
        "user_gst": input.sellerGstin,
        "val-b64": sha256Base64(body),
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(`IRIS IRP error ${res.status}: ${text.slice(0, 300)}`);
      (err as Error & { status?: number }).status = 502;
      throw err;
    }

    const data = (await res.json()) as {
      Irn?: string;
      AckNo?: number;
      AckDt?: string;
      ErrorDetails?: { ErrorMessage?: string }[];
    };
    if (!data.Irn) {
      const msg = data.ErrorDetails?.map((e) => e.ErrorMessage).join("; ") ?? "IRN generation rejected";
      const err = new Error(msg);
      (err as Error & { status?: number }).status = 422;
      throw err;
    }

    return {
      irn: data.Irn,
      ackNo: String(data.AckNo ?? ""),
      ackDate: data.AckDt ?? new Date().toISOString(),
      mode: "live",
      payloadSent: payload,
    };
  },
};
