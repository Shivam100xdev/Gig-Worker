import { atom } from "jotai";
import {
  incomeRecordsAtom,
  platformsAtom,
  selectedPlatformIdAtom,
  taxpayerProfileAtom,
} from "@/store/atoms";
import { computeTax } from "@/lib/taxEngine";
import { GST_REGISTRATION_THRESHOLD } from "@/lib/constants";
import type { IncomeRecord, ItrReturnPayload } from "@/types";

/** The Platform object currently selected in the sidebar, if any. */
export const selectedPlatformAtom = atom((get) => {
  const id = get(selectedPlatformIdAtom);
  if (!id) return null;
  return get(platformsAtom).find((p) => p.id === id) ?? null;
});

/** All income records belonging to the selected platform, newest first. */
export const selectedPlatformRecordsAtom = atom<IncomeRecord[]>((get) => {
  const id = get(selectedPlatformIdAtom);
  if (!id) return [];
  return get(incomeRecordsAtom)
    .filter((r) => r.platformId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
});

/** Records grouped by platform id, for sidebar badges and the ITR summary. */
export const recordsByPlatformAtom = atom((get) => {
  const map = new Map<string, IncomeRecord[]>();
  for (const record of get(incomeRecordsAtom)) {
    const list = map.get(record.platformId) ?? [];
    list.push(record);
    map.set(record.platformId, list);
  }
  return map;
});

/** Sum of gross income reported across every platform. */
export const totalGrossIncomeAtom = atom((get) =>
  get(incomeRecordsAtom).reduce((sum, r) => sum + r.incomeAmount, 0)
);

/** Sum of tax already deducted/paid, as reported by the user. */
export const totalTaxAlreadyPaidAtom = atom((get) =>
  get(incomeRecordsAtom).reduce((sum, r) => sum + r.correspondingTax, 0)
);

/** Records the user marked paid/confirmed but never uploaded or confirmed
 * a receipt for — these block a clean ITR file and should be surfaced. */
export const unconfirmedReceiptsAtom = atom((get) =>
  get(incomeRecordsAtom).filter(
    (r) => r.paymentStatus === "paid" && !r.receiptConfirmed
  )
);

/** Live tax computation off the current totals and the chosen regime. */
export const taxComputationAtom = atom((get) => {
  const gross = get(totalGrossIncomeAtom);
  const paid = get(totalTaxAlreadyPaidAtom);
  const { regime } = get(taxpayerProfileAtom);
  return computeTax({ grossTotalIncome: gross, totalTaxAlreadyPaid: paid, regime });
});

/** Whether reported turnover crosses the GST registration threshold and the
 * user hasn't flagged themselves as registered — a compliance nudge, not a
 * blocker. */
export const gstAdvisoryAtom = atom((get) => {
  const gross = get(totalGrossIncomeAtom);
  const { gstRegistered } = get(taxpayerProfileAtom);
  const overThreshold = gross > GST_REGISTRATION_THRESHOLD;
  return { overThreshold, gstRegistered, threshold: GST_REGISTRATION_THRESHOLD };
});

/** Everything required to file is present. Used to enable/disable "File ITR". */
export const isReadyToFileAtom = atom((get) => {
  const profile = get(taxpayerProfileAtom);
  const records = get(incomeRecordsAtom);
  const unconfirmed = get(unconfirmedReceiptsAtom);
  return (
    records.length > 0 &&
    profile.name.trim().length > 0 &&
    profile.pan.trim().length === 10 &&
    unconfirmed.length === 0
  );
});

/** Assembles the payload handed to lib/api/itrService for filing. */
export const itrPayloadAtom = atom<ItrReturnPayload>((get) => {
  const profile = get(taxpayerProfileAtom);
  const platforms = get(platformsAtom);
  const records = get(incomeRecordsAtom);
  const computation = get(taxComputationAtom);

  const incomeSources = platforms
    .map((platform) => {
      const platformRecords = records.filter((r) => r.platformId === platform.id);
      if (platformRecords.length === 0) return null;
      return {
        platformName: platform.name,
        category: platform.category,
        grossIncome: platformRecords.reduce((s, r) => s + r.incomeAmount, 0),
        taxDeducted: platformRecords.reduce((s, r) => s + r.correspondingTax, 0),
        deductionSource: platformRecords[0].taxDeductionSource,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return {
    assessmentYear: profile.assessmentYear,
    regime: profile.regime,
    taxpayer: { name: profile.name, pan: profile.pan, email: profile.email },
    incomeSources,
    computation,
    status: "draft",
    generatedAt: new Date().toISOString(),
  };
});
