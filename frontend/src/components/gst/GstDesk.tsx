import { useEffect, useState } from "react";
import { ReceiptText, BadgeCheck, AlertTriangle, Plus, Loader2 } from "lucide-react";
import { gstService, type GstInvoiceDto, type GstSummary } from "@/lib/api/gstService";
import { Button } from "@/components/common/Button";
import { TextInput } from "@/components/common/TextInput";
import { Modal } from "@/components/common/Modal";
import { formatINR } from "@/lib/taxEngine";

/**
 * GST desk: turnover-vs-threshold advisory, invoice register, and
 * e-invoice (IRN) generation through the backend's IRIS IRP integration.
 * Simulation mode is labeled honestly in the UI.
 */
export function GstDesk() {
  const [summary, setSummary] = useState<GstSummary | null>(null);
  const [invoices, setInvoices] = useState<GstInvoiceDto[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refresh() {
    const [s, list] = await Promise.all([gstService.summary(), gstService.listInvoices()]);
    setSummary(s);
    setInvoices(list);
  }

  useEffect(() => {
    refresh().catch(() => setSummary(null));
  }, []);

  async function handleGenerateIrn(id: string) {
    setBusyId(id);
    setNotice(null);
    try {
      const res = await gstService.generateIrn(id);
      setNotice(
        res.mode === "simulation"
          ? "IRN generated in simulation mode — set IRIS_* credentials in backend/.env to go live."
          : `IRN ${res.irn.slice(0, 16)}… registered with IRP (ack ${res.ackNo}).`
      );
      await refresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "IRN generation failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-600 text-ledger-text">GST desk</h2>
          <p className="mt-1 text-sm text-ledger-muted">
            Track turnover against the ₹20L registration threshold, keep invoices, and raise e-invoices via IRIS IRP.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> New invoice
        </Button>
      </header>

      {summary && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label="Aggregate turnover (reported)" value={formatINR(summary.aggregateTurnover)} />
          <Stat
            label={`vs ₹20L registration threshold`}
            value={summary.registrationLikelyRequired ? "Threshold crossed" : "Below threshold"}
            accent={summary.registrationLikelyRequired ? "pending" : "filed"}
          />
          <Stat label="GSTIN on file" value={summary.gstin ?? "Not added"} />
        </div>
      )}

      {summary?.registrationLikelyRequired && !summary.gstin && (
        <div className="flex items-start gap-2 rounded-md border border-signal-pending/40 bg-signal-pending/10 px-3 py-2.5 text-xs text-signal-pending">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            Your turnover has crossed the ₹20L services threshold — GST registration is typically required from here.
            Informational nudge, not legal advice: confirm with a professional, then add your GSTIN above.
          </span>
        </div>
      )}

      {notice && (
        <div className="rounded-md border border-signal-info/40 bg-signal-info/10 px-3 py-2 text-xs text-signal-info">{notice}</div>
      )}

      {/* Invoice register */}
      <div className="overflow-hidden rounded-lg border border-ledger-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ledger-line bg-ledger-panel text-left text-xs uppercase tracking-wide text-ledger-muted">
              <th className="px-4 py-2.5 font-medium">Invoice</th>
              <th className="px-4 py-2.5 font-medium">Customer</th>
              <th className="px-4 py-2.5 text-right font-medium">Taxable</th>
              <th className="px-4 py-2.5 text-right font-medium">GST</th>
              <th className="px-4 py-2.5 text-right font-medium">Total</th>
              <th className="px-4 py-2.5 font-medium">e-Invoice</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-xs text-ledger-muted">
                  No invoices yet. Create one to get started — GST is auto-split CGST/SGST or IGST.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-ledger-line/60 last:border-0">
                  <td className="px-4 py-3">
                    <span className="block text-ledger-text">{inv.invoiceNumber}</span>
                    <span className="block text-xs text-ledger-muted">{new Date(inv.invoiceDate).toLocaleDateString("en-IN")}</span>
                  </td>
                  <td className="px-4 py-3 text-ledger-text">{inv.customerName}</td>
                  <td className="px-4 py-3 text-right font-mono text-ledger-text">{formatINR(inv.taxableValue)}</td>
                  <td className="px-4 py-3 text-right font-mono text-ledger-muted">
                    @ {inv.gstRate}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-ledger-text">{formatINR(inv.total)}</td>
                  <td className="px-4 py-3">
                    {inv.irnGenerated ? (
                      <span className="flex items-center gap-1.5 text-xs text-signal-filed">
                        <BadgeCheck size={14} /> IRN ok
                      </span>
                    ) : (
                      <Button
                        variant="secondary"
                        className="px-2.5 py-1 text-xs"
                        loading={busyId === inv.id}
                        onClick={() => handleGenerateIrn(inv.id)}
                      >
                        <ReceiptText size={12} /> Generate IRN
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateInvoiceModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            refresh().catch(() => undefined);
          }}
        />
      )}
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "pending" | "filed" }) {
  return (
    <div className="rounded-md border border-ledger-line bg-ledger-panel px-4 py-3">
      <p className="text-[11px] text-ledger-muted">{label}</p>
      <p
        className={`mt-1 font-mono text-lg ${
          accent === "pending" ? "text-signal-pending" : accent === "filed" ? "text-signal-filed" : "text-ledger-text"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function CreateInvoiceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [customerName, setCustomerName] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${new Date().getFullYear()}-`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [taxableValue, setTaxableValue] = useState("");
  const [gstRate, setGstRate] = useState(18);
  const [isInterState, setIsInterState] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = Number(taxableValue) || 0;
  const tax = value * (gstRate / 100);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim() || !invoiceNumber.trim() || value <= 0) {
      setError("Fill customer, invoice number and a taxable value above ₹0.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await gstService.createInvoice({
        customerName: customerName.trim(),
        customerGstin: customerGstin.trim() || undefined,
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        taxableValue: value,
        gstRate,
        isInterState,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the invoice.");
      setBusy(false);
    }
  }

  return (
    <Modal title="New GST invoice" subtitle="Tax splits automatically: CGST+SGST within state, IGST between states." onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Who you billed" />
          <TextInput
            label="Customer GSTIN (optional)"
            value={customerGstin}
            onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
            placeholder="27AAAPZ1234C1X5"
            maxLength={15}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Invoice number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
          <TextInput label="Invoice date" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextInput label="Taxable value" prefix="₹" type="number" min={0} value={taxableValue} onChange={(e) => setTaxableValue(e.target.value)} placeholder="0" />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-ledger-muted">GST rate</span>
            <div className="flex gap-1.5">
              {[0, 5, 12, 18, 28].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setGstRate(r)}
                  className={`rounded-md border px-2.5 py-2 text-xs transition-colors ${
                    gstRate === r ? "border-signal-info/60 bg-signal-info/10 text-signal-info" : "border-ledger-line text-ledger-muted hover:text-ledger-text"
                  }`}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ledger-muted">
          <input type="checkbox" checked={isInterState} onChange={(e) => setIsInterState(e.target.checked)} className="accent-[#4E8CF0]" />
          Inter-state supply (charges IGST instead of CGST+SGST)
        </label>

        <div className="rounded-md border border-ledger-line bg-ledger-raised/50 px-3 py-2.5 text-sm">
          <div className="flex justify-between text-ledger-muted">
            <span>{isInterState ? "IGST" : "CGST + SGST"} @ {gstRate}%</span>
            <span className="font-mono">{formatINR(tax)}</span>
          </div>
          <div className="mt-1 flex justify-between font-medium text-ledger-text">
            <span>Invoice total</span>
            <span className="font-mono">{formatINR(value + tax)}</span>
          </div>
        </div>

        {error && <p className="text-xs text-signal-overdue">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-ledger-line pt-4">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" loading={busy}>
            {busy && <Loader2 size={14} className="animate-spin" />} Create invoice
          </Button>
        </div>
      </form>
    </Modal>
  );
}
