import type { TaxComputation } from "@/types";
import { formatINR } from "@/lib/taxEngine";

export function TaxBreakdownTable({ computation }: { computation: TaxComputation }) {
  return (
    <div className="overflow-hidden rounded-md border border-ledger-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ledger-line bg-ledger-raised/60 text-left text-[11px] uppercase tracking-wide text-ledger-muted">
            <th className="px-3 py-2 font-medium">Slab</th>
            <th className="px-3 py-2 font-medium">Rate</th>
            <th className="px-3 py-2 text-right font-medium">Taxable</th>
            <th className="px-3 py-2 text-right font-medium">Tax</th>
          </tr>
        </thead>
        <tbody>
          {computation.slabBreakup.map((slab) => (
            <tr key={slab.slabLabel} className="border-b border-ledger-line/60 last:border-0">
              <td className="px-3 py-2 text-ledger-text">{slab.slabLabel}</td>
              <td className="px-3 py-2 font-mono text-ledger-muted">{slab.rate}%</td>
              <td className="px-3 py-2 text-right font-mono text-ledger-text">
                {formatINR(slab.taxableInSlab)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-ledger-text">
                {formatINR(slab.taxInSlab)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
