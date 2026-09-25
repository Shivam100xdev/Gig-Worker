import { useAtomValue } from "jotai";
import { selectedPlatformAtom, selectedPlatformRecordsAtom } from "@/store/derivedAtoms";
import { platformsAtom, mainSectionAtom } from "@/store/atoms";
import { RunningTotals } from "@/components/income/RunningTotals";
import { IncomeForm } from "@/components/income/IncomeForm";
import { IncomeRecordsList } from "@/components/income/IncomeRecordsList";
import { StatementImport } from "@/components/import/StatementImport";
import { GstDesk } from "@/components/gst/GstDesk";
import { DeadlineCard } from "@/components/deadlines/DeadlineCard";
import { ReviewsSection } from "@/components/community/ReviewsSection";
import { FaqSection } from "@/components/community/FaqSection";
import { PLATFORM_CATEGORY_LABELS } from "@/lib/constants";

export function MainPanel() {
  const section = useAtomValue(mainSectionAtom);

  return (
    <main className="flex-1 overflow-y-auto px-6 py-6">
      {section === "dashboard" && <LedgerSection />}
      {section === "import" && (
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <StatementImport />
          <DeadlineCard />
        </div>
      )}
      {section === "gst" && (
        <div className="mx-auto flex max-w-4xl">
          <GstDesk />
        </div>
      )}
      {section === "deadlines" && (
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          <DeadlineCard />
        </div>
      )}
      {section === "reviews" && (
        <div className="mx-auto flex max-w-4xl">
          <ReviewsSection />
        </div>
      )}
      {section === "faq" && (
        <div className="mx-auto flex max-w-3xl">
          <FaqSection />
        </div>
      )}
    </main>
  );
}

/** Original self-reporting workspace: totals + per-platform entry. */
function LedgerSection() {
  const platforms = useAtomValue(platformsAtom);
  const selectedPlatform = useAtomValue(selectedPlatformAtom);
  const records = useAtomValue(selectedPlatformRecordsAtom);
  void records;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <RunningTotals />
      {!selectedPlatform ? (
        <EmptyState hasPlatforms={platforms.length > 0} />
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="font-display text-lg font-600 text-ledger-text">{selectedPlatform.name}</h2>
            <p className="text-xs text-ledger-muted">{PLATFORM_CATEGORY_LABELS[selectedPlatform.category]}</p>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <IncomeForm platformId={selectedPlatform.id} />
            <IncomeRecordsList />
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasPlatforms }: { hasPlatforms: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-ledger-line py-20 text-center">
      <p className="font-display text-base text-ledger-text">
        {hasPlatforms ? "Select a platform to log income" : "Add your first platform to get started"}
      </p>
      <p className="mt-1.5 max-w-sm text-sm text-ledger-muted">
        {hasPlatforms
          ? "Pick one from the sidebar, then log what you earned and from whom."
          : "We can't pull income automatically yet, so start by telling us where you earn from."}
      </p>
    </div>
  );
}
