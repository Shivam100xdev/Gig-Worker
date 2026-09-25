/**
 * Domain types for the gig-income & ITR assistant.
 *
 * These types are the contract between the frontend store and whatever
 * backend eventually replaces `lib/api/*`. Keep them backend-agnostic:
 * no UI state (e.g. "isModalOpen") belongs here.
 */

export type PlatformCategory =
  | "ride-hailing" // Ola, Uber, Rapido
  | "food-delivery" // Swiggy, Zomato
  | "freelance" // Upwork, Fiverr
  | "ecommerce-seller" // Meesho, Amazon Easy
  | "logistics" // Dunzo, Porter
  | "other";

export type PaymentStatus = "paid" | "not_paid" | "partially_paid";

export type TaxDeductionSource = "none" | "platform_tds" | "client_tds";

export interface ClientDetails {
  name: string;
  email: string;
}

/**
 * A single gig platform the user earns from. One platform can hold many
 * IncomeRecords (e.g. multiple engagements, or one per month).
 */
export interface Platform {
  id: string;
  name: string;
  category: PlatformCategory;
  /** True once the user has entered at least one income record. */
  hasRecords: boolean;
  createdAt: string; // ISO date
}

/**
 * One reported earning entry under a platform. This mirrors the fields
 * sketched in the product wireframe: income, tax, payment status,
 * work duration, filing deadline, and the client who paid it.
 */
export interface IncomeRecord {
  id: string;
  platformId: string;
  incomeAmount: number; // INR, gross
  correspondingTax: number; // INR, tax already known/estimated against this income
  taxDeductionSource: TaxDeductionSource;
  paymentStatus: PaymentStatus;
  /** Required confirmation step when tax was reported paid via an
   * automated source rather than typed by hand — mirrors the
   * "user has to confirm with tax receipt" note in the brief. */
  receiptConfirmed: boolean;
  receiptFileName?: string;
  workStartDate: string; // ISO date
  workEndDate: string; // ISO date
  taxPayDeadline: string; // ISO date
  client: ClientDetails;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AssessmentRegime = "old" | "new";

export interface TaxSlabBreakup {
  slabLabel: string;
  rate: number;
  taxableInSlab: number;
  taxInSlab: number;
}

export interface TaxComputation {
  grossTotalIncome: number;
  totalTaxAlreadyPaid: number; // TDS + advance tax reported by user
  standardDeduction: number;
  taxableIncome: number;
  regime: AssessmentRegime;
  slabBreakup: TaxSlabBreakup[];
  taxBeforeCess: number;
  healthAndEducationCess: number;
  totalTaxLiability: number;
  balancePayable: number; // liability - already paid (can be negative = refund)
  effectiveRate: number; // percentage
}

export type ItrFilingStatus = "draft" | "ready" | "submitted" | "acknowledged";

/**
 * The payload the frontend hands off to a filing backend. Shaped close to
 * what an ITR-1/ITR-4 preparer would need, without pretending to be the
 * literal government schema (that mapping is a backend concern).
 */
export interface ItrReturnPayload {
  assessmentYear: string; // e.g. "2026-27"
  regime: AssessmentRegime;
  taxpayer: {
    name: string;
    pan: string;
    email: string;
  };
  incomeSources: {
    platformName: string;
    category: PlatformCategory;
    grossIncome: number;
    taxDeducted: number;
    deductionSource: TaxDeductionSource;
  }[];
  computation: TaxComputation;
  status: ItrFilingStatus;
  generatedAt: string;
}

export interface TaxpayerProfile {
  name: string;
  pan: string;
  email: string;
  assessmentYear: string;
  regime: AssessmentRegime;
  gstRegistered: boolean;
  /** Aggregate turnover across platforms, kept denormalized here so the
   * GST-threshold nudge doesn't need to re-walk every record. */
  estimatedAnnualTurnover: number;
}

export interface ValidationIssue {
  field: string;
  message: string;
}
