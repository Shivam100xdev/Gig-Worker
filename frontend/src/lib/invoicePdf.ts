import type { GstInvoiceDto } from "@/lib/api/gstService";

/**
 * Custom GST invoice PDF.
 *
 * The invoice row comes from the DB (gstService.listInvoices / POST
 * /gst/invoices → /gst/invoices), is rendered into an HTML table, converted
 * to a pdfmake content tree with html-to-pdfmake, and downloaded as a PDF.
 */

export interface InvoiceSellerDetails {
  name: string;
  pan: string;
  gstin: string | null;
}

const inr = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function buildInvoiceHtml(
  invoice: GstInvoiceDto,
  seller: InvoiceSellerDetails
): string {
  const desc = `Income under ${invoice.gstRate}% GST slab — invoice ${esc(invoice.invoiceNumber)}`;
  const gstinLabel =
    seller.gstin && seller.gstin !== "Not added" ? seller.gstin : "Not registered (below threshold)";

  return `
<div style="font-size:12px">
  <h2 style="text-align:center;font-size:18px;margin:0 0 2px 0">TAX INVOICE</h2>
  <p style="text-align:center;font-size:10px;color:#555555;margin:0">GST invoice raised from Gig — gig-worker income &amp; ITR assistant</p>

  <table style="width:100%;margin-top:10px">
    <tr>
      <td style="width:50%;vertical-align:top">
        <p style="margin:0;font-weight:bold">Seller (supplier)</p>
        <p style="margin:2px 0">${esc(seller.name || "—")}</p>
        <p style="margin:2px 0">PAN: ${esc(seller.pan || "—")}</p>
        <p style="margin:2px 0">GSTIN: ${esc(gstinLabel)}</p>
      </td>
      <td style="width:50%;vertical-align:top">
        <p style="margin:0;font-weight:bold">Buyer (recipient)</p>
        <p style="margin:2px 0">${esc(invoice.customerName)}</p>
        <p style="margin:2px 0">GSTIN: ${esc(invoice.customerGstin || "Unregistered buyer")}</p>
        <p style="margin:2px 0">Place of supply: ${invoice.igst > 0 ? "Inter-state (IGST)" : "Intra-state (CGST + SGST)"}</p>
      </td>
    </tr>
  </table>

  <table style="width:100%;margin-top:8px">
    <tr>
      <td style="width:50%"><b>Invoice No:</b> ${esc(invoice.invoiceNumber)}</td>
      <td style="width:50%"><b>Invoice Date:</b> ${fmtDate(invoice.invoiceDate)}</td>
    </tr>
  </table>

  <table style="width:100%;margin-top:10px;border-collapse:collapse">
    <tr style="background:#F0F0F0;font-weight:bold">
      <td style="padding:6px;border:1px solid #CCCCCC">#</td>
      <td style="padding:6px;border:1px solid #CCCCCC">Description of supply</td>
      <td style="padding:6px;border:1px solid #CCCCCC;text-align:right">Taxable value (₹)</td>
      <td style="padding:6px;border:1px solid #CCCCCC;text-align:right">GST rate</td>
      <td style="padding:6px;border:1px solid #CCCCCC;text-align:right">GST (₹)</td>
    </tr>
    <tr>
      <td style="padding:6px;border:1px solid #CCCCCC">1</td>
      <td style="padding:6px;border:1px solid #CCCCCC">${desc}</td>
      <td style="padding:6px;border:1px solid #CCCCCC;text-align:right">${inr(invoice.taxableValue)}</td>
      <td style="padding:6px;border:1px solid #CCCCCC;text-align:right">${invoice.gstRate}%</td>
      <td style="padding:6px;border:1px solid #CCCCCC;text-align:right">${inr(invoice.cgst + invoice.sgst + invoice.igst)}</td>
    </tr>
  </table>

  <table style="width:100%;margin-top:8px">
    <tr><td style="padding:3px 6px">CGST @ ${invoice.gstRate / 2}%</td><td style="padding:3px 6px;text-align:right">${inr(invoice.cgst)}</td></tr>
    <tr><td style="padding:3px 6px">SGST @ ${invoice.gstRate / 2}%</td><td style="padding:3px 6px;text-align:right">${inr(invoice.sgst)}</td></tr>
    <tr><td style="padding:3px 6px">IGST @ ${invoice.gstRate}%</td><td style="padding:3px 6px;text-align:right">${inr(invoice.igst)}</td></tr>
    <tr style="font-weight:bold;background:#F0F0F0">
      <td style="padding:6px">Invoice total</td>
      <td style="padding:6px;text-align:right">₹ ${inr(invoice.total)}</td>
    </tr>
  </table>

  ${
    invoice.irnGenerated
      ? `<p style="margin-top:10px;font-size:10px">e-Invoice: IRN <b>${esc(invoice.irn ?? "")}</b> · Ack No. ${esc(invoice.ackNo ?? "")}</p>`
      : `<p style="margin-top:10px;font-size:10px;color:#888888">e-Invoice: not yet registered with IRP</p>`
  }
  <p style="margin-top:14px;font-size:10px;color:#555555">This is a system-generated tax invoice for the taxable value shown above. Reverse charge: No. Subject to the supplier's GST registration status.</p>
</div>`;
}

/**
 * Convert the HTML to pdfmake content and trigger the browser download.
 * Loaded lazily so pdfmake's ~1MB bundle only loads when an invoice is
 * actually generated.
 */
export async function downloadInvoicePdf(
  invoice: GstInvoiceDto,
  seller: InvoiceSellerDetails
): Promise<void> {
  const [{ default: htmlToPdfmake }, pdfmakeModule, vfsModule] = await Promise.all([
    import("html-to-pdfmake"),
    import("pdfmake/build/pdfmake.js"),
    import("pdfmake/build/vfs_fonts.js"),
  ]);

  // pdfmake's export shape varies by build/channel (default vs namespace,
  // flat vfs map vs { vfs } wrapper); normalise all shapes seen in 0.2.x.
  const pdfmakeRaw = pdfmakeModule as unknown as Record<string, unknown>;
  const pdfMake = (pdfmakeRaw.default ?? pdfmakeRaw) as typeof pdfmakeModule.default;
  const vfsRaw = vfsModule as unknown as Record<string, unknown>;
  const vfsDefault = (vfsRaw.default ?? vfsRaw) as unknown;
  const vfsShape = vfsDefault as { vfs?: Record<string, string>; pdfMake?: { vfs?: Record<string, string> } };
  const vfs =
    vfsShape.pdfMake?.vfs ?? vfsShape.vfs ?? (vfsDefault as Record<string, string> | null);
  if (vfs && typeof vfs === "object") {
    pdfMake.vfs = vfs;
  }

  const content = htmlToPdfmake(buildInvoiceHtml(invoice, seller), {
    window: typeof window !== "undefined" ? window : undefined,
  });

  pdfMake.createPdf({
    content,
    defaultStyle: { font: "Roboto", fontSize: 11 },
    pageMargins: [40, 40, 40, 40],
  }).download(`gst-invoice-${invoice.invoiceNumber.replace(/[^\w.-]+/g, "_")}.pdf`);
}
