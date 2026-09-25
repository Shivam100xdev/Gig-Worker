import Tesseract from "tesseract.js";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// pdf-parse is CJS; interop via createRequire keeps the ESM build clean.
const pdfParse = require("pdf-parse") as (b: Buffer) => Promise<{ text: string }>;

/**
 * OCR for bank statements (PDF or image).
 *
 * Pipeline:
 *   PDF  -> pdf-parse extracts the embedded text layer (most digital bank
 *           statements have one) — fast and free.
 *   Scan -> tesseract.js (WASM, in-process) for image statements/photos.
 * Either way the raw text is parsed into candidate transactions; credit
 * lines become income-entry proposals the user accepts or rejects.
 */

export interface OcrTransaction {
  rawText: string;
  amount: number;
  direction: "in" | "out";
  txnDate: string | null; // ISO date
  narration: string;
  counterparty: string | null;
}

export const ocrService = {
  /** Extract raw text from a PDF (text layer) or image (tesseract). */
  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType === "application/pdf") {
      const pdf = await pdfParse(buffer);
      return pdf.text;
    }
    const { data } = await Tesseract.recognize(buffer, "eng");
    return data.text;
  },

  /**
   * Parse statement text into candidate transactions.
   *
   * Handles the common Indian bank statement line shapes:
   *   01/07/2025  UPI/CR/348298234/SWIGGY/YESB            1,250.00
   *   02-07-2025  NEFT CR-ACME CORP INV-889               48,500.00 Cr
   *   15/07/25    IMPS-9820000123-OLACABS                 356.40 Dr
   *
   * A line is a transaction candidate when it has a leading date, an
   * amount, and an explicit or trailing Dr/Cr direction marker.
   */
  parseTransactions(text: string): OcrTransaction[] {
    const txns: OcrTransaction[] = [];
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length < 10) continue;

      const dateMatch = trimmed.match(
        /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/
      );
      if (!dateMatch) continue;

      // Amount: last numeric token in Indian format (1,23,456.00).
      const amountMatches = [...trimmed.matchAll(/(?:₹|Rs\.?\s*)?(\d{1,3}(?:,\d{2,3})*\.\d{2}|\d+\.\d{2})/g)];
      if (amountMatches.length === 0) continue;
      const amountToken = amountMatches[amountMatches.length - 1][1];
      const amount = parseFloat(amountToken.replace(/,/g, ""));
      if (!Number.isFinite(amount) || amount <= 0) continue;

      // Direction: explicit Cr/Dr marker, else infer from narration keywords.
      const isCredit =
        /\b(?:cr|credit)\b/i.test(trimmed.slice(-6)) ||
        /\b(?:cr|credit)\b/i.test(trimmed) && !/\b(?:dr|debit)\b/i.test(trimmed.slice(-6)) ||
        /upi\/cr|neft\s*cr|imps-cr|credited/i.test(trimmed);
      const direction: "in" | "out" = isCredit && !/\b(?:dr|debit)\b/i.test(trimmed.slice(-6)) ? "in" : "out";

      // Narration: text between the date and the amount.
      const narration = trimmed
        .replace(dateMatch[0], "")
        .replace(amountToken, "")
        .replace(/\b(?:cr|dr)\b/ig, "")
        .trim()
        .replace(/\s{2,}/g, " ");

      // Counterparty heuristic: first ALL-CAPS word run in the narration.
      const cpMatch = narration.match(/(?:^|[\s\/-])([A-Z][A-Z &]{3,})/);
      const counterparty = cpMatch ? cpMatch[1].trim() : null;

      const d = dateMatch;
      const yearRaw = d[3].length === 2 ? `20${d[3]}` : d[3];
      const txnDate = `${yearRaw}-${d[2].padStart(2, "0")}-${d[1].padStart(2, "0")}`;

      txns.push({
        rawText: trimmed,
        amount,
        direction,
        txnDate: isValidDate(txnDate) ? txnDate : null,
        narration,
        counterparty,
      });
    }

    return txns;
  },
};

function isValidDate(iso: string): boolean {
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(iso);
}
