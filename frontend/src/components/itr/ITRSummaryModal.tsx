import { useState } from "react";
import { AlertTriangle, CheckCircle2, Download } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import {
  gstAdvisoryAtom,
  isReadyToFileAtom,
  unconfirmedReceiptsAtom,
} from "@/store/derivedAtoms";
import { taxpayerProfileAtom, isItrSummaryModalOpenAtom } from "@/store/atoms";
import { useItrFiling } from "@/hooks/useItrFiling";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { TaxBreakdownTable } from "@/components/itr/TaxBreakdownTable";
import { formatINR } from "@/lib/taxEngine";
import { validatePan } from "@/lib/validation";
import type { FilingResult } from "@/lib/api/itrService";

export function ITRSummaryModal() {
  const [isOpen, setIsOpen] = useAtom(isItrSummaryModalOpenAtom);
  const isReady = useAtomValue(isReadyToFileAtom);
  const unconfirmed = useAtomValue(unconfirmedReceiptsAtom);
  const gstAdvisory = useAtomValue(gstAdvisoryAtom);
  const profile = useAtomValue(taxpayerProfileAtom);
  const { payload, isSubmitting, error, submitFiling, downloadSummary } = useItrFiling();
  const [result, setResult] = useState<FilingResult | null>(null);

  if (!isOpen) return null;

  const checklist = [
    { label: "Taxpayer name", done: profile.name.trim().length > 0 },
    { label: "Valid PAN", done: validatePan(profile.pan) },
    { label: "At least one income entry", done: payload.incomeSources.length > 0 },
    { label: "All paid entries have a confirmed receipt", done: unconfirmed.length === 0 },
  ];

  async function handleSubmit() {
    const res = await submitFiling();
    if (res) setResult(res);
  }

  return (
    <Modal
      title={result ? "Return submitted" : "Review before filing"}
      subtitle={result ? undefined : `Assessment year ${payload.assessmentYear} · ${payload.regime === "new" ? "New" : "Old"} regime`}
      onClose={() => setIsOpen(false)}
      widthClass="max-w-2xl"
    >
      {result ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle2 className="text-signal-filed" size={40} />
          <p className="font-display text-base text-ledger-text">Sent for filing</p>
          <p className="max-w-sm text-sm text-ledger-muted">
            Acknowledgement <span className="font-mono text-ledger-text">{result.acknowledgementNumber}</span>{" "}
            was generated. Keep this for your records until the return is acknowledged by the department.
          </p>
          <Button variant="secondary" onClick={() => setIsOpen(false)} className="mt-2">
            Done
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <ul className="flex flex-col gap-1.5">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-sm">
                {item.done ? (
                  <CheckCircle2 size={15} className="shrink-0 text-signal-filed" />
                ) : (
                  <AlertTriangle size={15} className="shrink-0 text-signal-pending" />
                )}
                <span className={item.done ? "text-ledger-text" : "text-ledger-muted"}>{item.label}</span>
              </li>
            ))}
          </ul>

          {gstAdvisory.overThreshold && !gstAdvisory.gstRegistered && (
            <div className="flex items-start gap-2 rounded-md border border-signal-pending/40 bg-signal-pending/10 px-3 py-2.5 text-xs text-signal-pending">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>
                Your reported turnover has crossed {formatINR(gstAdvisory.threshold)}. GST registration is
                typically required past this point for service income — check with a professional before filing.
              </span>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ledger-muted">
              Income by platform
            </h3>
            <div className="overflow-hidden rounded-md border border-ledger-line">
              <table className="w-full text-sm">
                <tbody>
                  {payload.incomeSources.map((source) => (
                    <tr key={source.platformName} className="border-b border-ledger-line/60 last:border-0">
                      <td className="px-3 py-2 text-ledger-text">{source.platformName}</td>
                      <td className="px-3 py-2 text-right font-mono text-ledger-text">
                        {formatINR(source.grossIncome)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-ledger-muted">
                        TDS {formatINR(source.taxDeducted)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ledger-muted">
              Tax computation
            </h3>
            <TaxBreakdownTable computation={payload.computation} />
            <div className="mt-3 flex flex-col gap-1 rounded-md border border-ledger-line bg-ledger-raised/50 px-3 py-2.5 text-sm">
              <Row label="Gross total income" value={formatINR(payload.computation.grossTotalIncome)} />
              <Row label="Standard deduction" value={`− ${formatINR(payload.computation.standardDeduction)}`} />
              <Row label="Taxable income" value={formatINR(payload.computation.taxableIncome)} emphasize />
              <Row label="Health & education cess (4%)" value={formatINR(payload.computation.healthAndEducationCess)} />
              <Row label="Total tax liability" value={formatINR(payload.computation.totalTaxLiability)} emphasize />
              <Row label="Already paid (TDS/advance tax)" value={`− ${formatINR(payload.computation.totalTaxAlreadyPaid)}`} />
              <div className="my-1 border-t border-ledger-line" />
              <Row
                label={payload.computation.balancePayable >= 0 ? "Balance payable" : "Refund due"}
                value={formatINR(Math.abs(payload.computation.balancePayable))}
                emphasize
                accent={payload.computation.balancePayable >= 0 ? "overdue" : "filed"}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-signal-overdue/40 bg-signal-overdue/10 px-3 py-2 text-xs text-signal-overdue">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-ledger-line pt-4">
            <Button variant="ghost" onClick={downloadSummary}>
              <Download size={14} />
              Download JSON
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsOpen(false)}>
                Keep editing
              </Button>
              <Button variant="primary" onClick={handleSubmit} loading={isSubmitting} disabled={!isReady}>
                Confirm & file
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Row({
  label,
  value,
  emphasize,
  accent,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  accent?: "overdue" | "filed";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ledger-muted">{label}</span>
      <span
        className={
          accent === "overdue"
            ? "font-mono text-signal-overdue"
            : accent === "filed"
              ? "font-mono text-signal-filed"
              : emphasize
                ? "font-mono font-medium text-ledger-text"
                : "font-mono text-ledger-text"
        }
      >
        {value}
      </span>
    </div>
  );
}
