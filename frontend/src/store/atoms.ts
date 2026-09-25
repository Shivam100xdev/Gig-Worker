import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type {
  IncomeRecord,
  ItrFilingStatus,
  Platform,
  TaxpayerProfile,
} from "@/types";
import type { SessionUser } from "@/lib/api/authService";

/**
 * Storage layer:
 * - Mock mode: platforms/records/profile persist to localStorage via
 *   atomWithStorage so a refresh doesn't wipe self-reported income.
 * - Real mode: these hydrate from the backend on login (see sessionAtoms
 *   hydrateSession) and writes flow through lib/api services.
 */
export const platformsAtom = atomWithStorage<Platform[]>("gigtax:platforms", []);

export const incomeRecordsAtom = atomWithStorage<IncomeRecord[]>(
  "gigtax:income-records",
  []
);

export const taxpayerProfileAtom = atomWithStorage<TaxpayerProfile>(
  "gigtax:taxpayer-profile",
  {
    name: "",
    pan: "",
    email: "",
    assessmentYear: "2026-27",
    regime: "new",
    gstRegistered: false,
    estimatedAnnualTurnover: 0,
  }
);

/** Signed-in user (mobile-OTP session). Null = logged out. Not persisted. */
export const sessionUserAtom = atom<SessionUser | null>(null);

/** Which top-level section is open in the main panel. */
export type MainSection =
  | "dashboard"
  | "import"
  | "gst"
  | "deadlines"
  | "reviews"
  | "faq";

export const mainSectionAtom = atomWithStorage<MainSection>("gig:section", "dashboard");

/** Currently selected platform id in the sidebar. Pure UI state — not persisted. */
export const selectedPlatformIdAtom = atom<string | null>(null);

/** Filing lifecycle state for the current ITR draft. Pure UI/session state. */
export const itrFilingStatusAtom = atom<ItrFilingStatus>("draft");

/** Controls the "Add platform" modal. */
export const isAddPlatformModalOpenAtom = atom(false);

/** Controls the "File ITR" summary modal. */
export const isItrSummaryModalOpenAtom = atom(false);

/** Global async/error flags for backend calls made from lib/api/*. */
export const isSubmittingItrAtom = atom(false);
export const submitErrorAtom = atom<string | null>(null);
