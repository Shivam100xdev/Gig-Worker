/** Shared tax constants mirroring frontend/src/lib/taxEngine.ts. */

export const GST_REGISTRATION_THRESHOLD = 2_000_000; // ₹20,00,000 (services)

/** New-regime slabs FY 2025-26, used by the filing route's computation. */
export const NEW_REGIME_SLABS: { upTo: number; rate: number }[] = [
  { upTo: 400_000, rate: 0 },
  { upTo: 800_000, rate: 0.05 },
  { upTo: 1_200_000, rate: 0.1 },
  { upTo: 1_600_000, rate: 0.15 },
  { upTo: 2_000_000, rate: 0.2 },
  { upTo: 2_400_000, rate: 0.25 },
  { upTo: Infinity, rate: 0.3 },
];

/** Backend-side slab computation matching the frontend's live estimate. */
export function computeTaxBackend(grossTotalIncome: number, totalTaxAlreadyPaid: number) {
  const standardDeduction = 75_000;
  const taxableIncome = Math.max(0, grossTotalIncome - standardDeduction);

  let lowerBound = 0;
  let tax = 0;
  const breakup: { slabLabel: string; rate: number; taxableInSlab: number; taxInSlab: number }[] = [];
  for (const slab of NEW_REGIME_SLABS) {
    if (taxableIncome <= lowerBound) break;
    const taxableInSlab = Math.min(taxableIncome, slab.upTo) - lowerBound;
    if (taxableInSlab > 0) {
      tax += taxableInSlab * slab.rate;
      breakup.push({
        slabLabel: slab.upTo === Infinity ? `Above ₹${(lowerBound / 100000).toFixed(1)}L` : `₹${(lowerBound / 100000).toFixed(1)}L – ₹${(slab.upTo / 100000).toFixed(1)}L`,
        rate: slab.rate * 100,
        taxableInSlab,
        taxInSlab: taxableInSlab * slab.rate,
      });
    }
    lowerBound = slab.upTo;
  }

  // Section 87A rebate: nil tax up to ₹12L taxable income (new regime, FY25-26).
  if (taxableIncome <= 1_200_000) tax = 0;

  const cess = tax * 0.04;
  return {
    grossTotalIncome,
    totalTaxAlreadyPaid,
    standardDeduction,
    taxableIncome,
    regime: "new" as const,
    slabBreakup: breakup,
    taxBeforeCess: tax,
    healthAndEducationCess: cess,
    totalTaxLiability: tax + cess,
    balancePayable: tax + cess - totalTaxAlreadyPaid,
    effectiveRate: grossTotalIncome > 0 ? ((tax + cess) / grossTotalIncome) * 100 : 0,
  };
}
