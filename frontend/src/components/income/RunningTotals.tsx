import { useAtomValue } from "jotai";
import { taxComputationAtom, totalGrossIncomeAtom } from "@/store/derivedAtoms";
import { formatINR } from "@/lib/taxEngine";

export function RunningTotals() {
  const totalGross = useAtomValue(totalGrossIncomeAtom);
  const computation = useAtomValue(taxComputationAtom);

  return (
    <div className="grid grid-cols-3 gap-3">
      <Stat label="Total income, all platforms" value={formatINR(totalGross)} />
      <Stat label="Estimated tax liability" value={formatINR(computation.totalTaxLiability)} />
      <Stat
        label={computation.balancePayable >= 0 ? "Estimated balance payable" : "Estimated refund"}
        value={formatINR(Math.abs(computation.balancePayable))}
        accent={computation.balancePayable >= 0 ? "overdue" : "filed"}
      />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "overdue" | "filed" }) {
  return (
    <div className="rounded-md border border-ledger-line bg-ledger-panel px-4 py-3">
      <p className="text-[11px] text-ledger-muted">{label}</p>
      <p
        className={
          "mt-1 font-mono text-lg " +
          (accent === "overdue" ? "text-signal-overdue" : accent === "filed" ? "text-signal-filed" : "text-ledger-text")
        }
      >
        {value}
      </p>
    </div>
  );
}
