import { useRef } from "react";
import { format } from "date-fns";
import { AlertTriangle, Paperclip, Trash2 } from "lucide-react";
import { useIncomeRecordActions } from "@/hooks/useIncomeRecordActions";
import { ToggleSwitch } from "@/components/common/ToggleSwitch";
import { formatINR } from "@/lib/taxEngine";
import { PAYMENT_STATUS_LABELS } from "@/lib/constants";
import type { IncomeRecord, PaymentStatus } from "@/types";

function safeFormat(iso: string) {
  try {
    return format(new Date(iso), "d MMM yyyy");
  } catch {
    return iso;
  }
}

export function IncomeRecordCard({ record }: { record: IncomeRecord }) {
  const { updateRecord, confirmReceipt, removeRecord } = useIncomeRecordActions(record.platformId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const needsReceipt =
    record.taxDeductionSource !== "none" &&
    record.paymentStatus === "paid" &&
    !record.receiptConfirmed;

  function handleStatusChange(status: PaymentStatus) {
    updateRecord(record.id, { paymentStatus: status });
  }

  function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    confirmReceipt(record.id, file?.name);
  }

  return (
    <div className="rounded-md border border-ledger-line bg-ledger-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-base text-ledger-text">{formatINR(record.incomeAmount)}</p>
          <p className="mt-0.5 text-xs text-ledger-muted">
            Tax {formatINR(record.correspondingTax)} · {safeFormat(record.workStartDate)} – {safeFormat(record.workEndDate)}
          </p>
        </div>
        <button
          onClick={() => removeRecord(record.id)}
          className="rounded-sm p-1 text-ledger-muted transition-colors hover:bg-signal-overdue/10 hover:text-signal-overdue"
          aria-label="Remove entry"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <ToggleSwitch
          value={record.paymentStatus}
          onChange={handleStatusChange}
          options={[
            { value: "not_paid", label: PAYMENT_STATUS_LABELS.not_paid },
            { value: "partially_paid", label: PAYMENT_STATUS_LABELS.partially_paid },
            { value: "paid", label: PAYMENT_STATUS_LABELS.paid },
          ]}
        />
        <span className="text-[11px] text-ledger-muted">
          Deadline {safeFormat(record.taxPayDeadline)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-ledger-line pt-3 text-xs text-ledger-muted">
        <span>{record.client.name} · {record.client.email}</span>
      </div>

      {needsReceipt && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-signal-pending/40 bg-signal-pending/10 px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-signal-pending">
            <AlertTriangle size={14} className="shrink-0" />
            Confirm this against your tax receipt before filing.
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex shrink-0 items-center gap-1 rounded-sm bg-signal-pending/20 px-2 py-1 text-[11px] font-medium text-signal-pending hover:bg-signal-pending/30"
          >
            <Paperclip size={12} />
            Confirm
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFilePicked} />
        </div>
      )}
      {record.receiptConfirmed && record.receiptFileName && (
        <p className="mt-2 truncate text-[11px] text-signal-filed">Receipt: {record.receiptFileName}</p>
      )}
    </div>
  );
}
