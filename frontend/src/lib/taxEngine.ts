import type { AssessmentRegime, TaxComputation, TaxSlabBreakup } from "@/types";

/**
 * Slab rates, FY 2025-26 (AY 2026-27), individual taxpayers below 60.
 * Kept as data so a backend or a future tax-year update can override this
 * table without touching the calculation logic below.
 */
const NEW_REGIME_SLABS = [
  { upTo: 400_000, rate: 0 },
  { upTo: 800_000, rate: 0.05 },
  { upTo: 1_200_000, rate: 0.1 },
  { upTo: 1_600_000, rate: 0.15 },
  { upTo: 2_000_000, rate: 0.2 },
  { upTo: 2_400_000, rate: 0.25 },
  { upTo: Infinity, rate: 0.3 },
];

const OLD_REGIME_SLABS = [
  { upTo: 250_000, rate: 0 },
  { upTo: 500_000, rate: 0.05 },
  { upTo: 1_000_000, rate: 0.2 },
  { upTo: Infinity, rate: 0.3 },
];

const NEW_REGIME_STANDARD_DEDUCTION = 75_000;
const OLD_REGIME_STANDARD_DEDUCTION = 50_000;
const CESS_RATE = 0.04;

/** New-regime rebate under 87A: nil tax up to ₹12L taxable income (FY25-26). */
const NEW_REGIME_REBATE_CEILING = 1_200_000;
const OLD_REGIME_REBATE_CEILING = 500_000;
const OLD_REGIME_REBATE_MAX = 12_500;

function slabsFor(regime: AssessmentRegime) {
  return regime === "new" ? NEW_REGIME_SLABS : OLD_REGIME_SLABS;
}

function computeSlabBreakup(
  taxableIncome: number,
  regime: AssessmentRegime
): { breakup: TaxSlabBreakup[]; taxBeforeCess: number } {
  const slabs = slabsFor(regime);
  let lowerBound = 0;
  let remaining = taxableIncome;
  const breakup: TaxSlabBreakup[] = [];
  let taxBeforeCess = 0;

  for (const slab of slabs) {
    if (remaining <= 0) break;
    const slabWidth = slab.upTo - lowerBound;
    const taxableInSlab = Math.min(remaining, slabWidth);
    const taxInSlab = taxableInSlab * slab.rate;

    if (taxableInSlab > 0) {
      breakup.push({
        slabLabel:
          slab.upTo === Infinity
            ? `Above ₹${(lowerBound / 100000).toFixed(1)}L`
            : `₹${(lowerBound / 100000).toFixed(1)}L – ₹${(slab.upTo / 100000).toFixed(1)}L`,
        rate: slab.rate * 100,
        taxableInSlab,
        taxInSlab,
      });
    }

    taxBeforeCess += taxInSlab;
    remaining -= taxableInSlab;
    lowerBound = slab.upTo;
  }

  return { breakup, taxBeforeCess };
}

function applyRebate(taxableIncome: number, taxBeforeCess: number, regime: AssessmentRegime) {
  if (regime === "new" && taxableIncome <= NEW_REGIME_REBATE_CEILING) {
    return 0;
  }
  if (regime === "old" && taxableIncome <= OLD_REGIME_REBATE_CEILING) {
    return Math.max(0, taxBeforeCess - OLD_REGIME_REBATE_MAX);
  }
  return taxBeforeCess;
}

export interface ComputeTaxInput {
  grossTotalIncome: number;
  totalTaxAlreadyPaid: number;
  regime: AssessmentRegime;
}

/**
 * Computes an estimated tax liability from aggregated gig income.
 *
 * This is a simplified slab-based estimate intended to give the user a
 * live, directionally-correct number in the UI. It does NOT model
 * presumptive taxation (44ADA/44AE), business expense deductions, or
 * Chapter VI-A deductions under the old regime — those belong in the
 * backend filing engine once real financials are available.
 */
export function computeTax(input: ComputeTaxInput): TaxComputation {
  const { grossTotalIncome, totalTaxAlreadyPaid, regime } = input;
  const standardDeduction =
    regime === "new" ? NEW_REGIME_STANDARD_DEDUCTION : OLD_REGIME_STANDARD_DEDUCTION;

  const taxableIncome = Math.max(0, grossTotalIncome - standardDeduction);
  const { breakup, taxBeforeCess: rawTax } = computeSlabBreakup(taxableIncome, regime);
  const taxAfterRebate = applyRebate(taxableIncome, rawTax, regime);
  const cess = taxAfterRebate * CESS_RATE;
  const totalTaxLiability = taxAfterRebate + cess;

  return {
    grossTotalIncome,
    totalTaxAlreadyPaid,
    standardDeduction,
    taxableIncome,
    regime,
    slabBreakup: breakup,
    taxBeforeCess: taxAfterRebate,
    healthAndEducationCess: cess,
    totalTaxLiability,
    balancePayable: totalTaxLiability - totalTaxAlreadyPaid,
    effectiveRate: grossTotalIncome > 0 ? (totalTaxLiability / grossTotalIncome) * 100 : 0,
  };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
