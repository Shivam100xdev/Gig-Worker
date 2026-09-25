import clsx from "clsx";
import { useAtomValue } from "jotai";
import { recordsByPlatformAtom } from "@/store/derivedAtoms";
import { PLATFORM_CATEGORY_LABELS } from "@/lib/constants";
import type { Platform } from "@/types";

interface PlatformListItemProps {
  platform: Platform;
  isSelected: boolean;
  onSelect: () => void;
}

export function PlatformListItem({ platform, isSelected, onSelect }: PlatformListItemProps) {
  const recordsByPlatform = useAtomValue(recordsByPlatformAtom);
  const records = recordsByPlatform.get(platform.id) ?? [];
  const hasUnconfirmed = records.some((r) => r.paymentStatus === "paid" && !r.receiptConfirmed);

  const statusColor = records.length === 0
    ? "bg-ledger-line"
    : hasUnconfirmed
      ? "bg-signal-pending"
      : "bg-signal-filed";

  return (
    <button
      onClick={onSelect}
      className={clsx(
        "group flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left transition-colors",
        isSelected
          ? "border-l-signal-info bg-ledger-raised"
          : "border-l-transparent hover:bg-ledger-raised/60"
      )}
    >
      <span className={clsx("h-1.5 w-1.5 shrink-0 rounded-full", statusColor)} aria-hidden />
      <span className="flex min-w-0 flex-col">
        <span className={clsx("truncate text-sm", isSelected ? "text-ledger-text" : "text-ledger-muted group-hover:text-ledger-text")}>
          {platform.name}
        </span>
        <span className="truncate text-[11px] text-ledger-muted/70">
          {PLATFORM_CATEGORY_LABELS[platform.category]} · {records.length} {records.length === 1 ? "entry" : "entries"}
        </span>
      </span>
    </button>
  );
}
