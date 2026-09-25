import { useAtomValue } from "jotai";
import { selectedPlatformRecordsAtom } from "@/store/derivedAtoms";
import { IncomeRecordCard } from "@/components/income/IncomeRecordCard";

export function IncomeRecordsList() {
  const records = useAtomValue(selectedPlatformRecordsAtom);

  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ledger-line p-6 text-center text-xs text-ledger-muted">
        No entries yet for this platform. Log your first one on the left.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-display text-sm font-600 text-ledger-text">
        Logged entries ({records.length})
      </h3>
      {records.map((record) => (
        <IncomeRecordCard key={record.id} record={record} />
      ))}
    </div>
  );
}
