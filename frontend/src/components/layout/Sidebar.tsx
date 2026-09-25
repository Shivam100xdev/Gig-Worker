import { Plus } from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import { isAddPlatformModalOpenAtom, selectedPlatformIdAtom } from "@/store/atoms";
import { usePlatformActions } from "@/hooks/usePlatformActions";
import { PlatformListItem } from "@/components/platforms/PlatformListItem";

export function Sidebar() {
  const { platforms, selectPlatform } = usePlatformActions();
  const selectedId = useAtomValue(selectedPlatformIdAtom);
  const setAddModalOpen = useSetAtom(isAddPlatformModalOpenAtom);

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-ledger-line bg-ledger-panel">
      <div className="border-b border-ledger-line px-4 py-4">
        <h2 className="font-display text-sm font-600 tracking-tight text-ledger-text">
          Your platforms
        </h2>
        <p className="mt-0.5 text-[11px] text-ledger-muted">
          Add every place you earn from — we can't pull this automatically yet.
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {platforms.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-ledger-muted">
            No platforms yet. Add your first one below.
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {platforms.map((platform) => (
              <PlatformListItem
                key={platform.id}
                platform={platform}
                isSelected={platform.id === selectedId}
                onSelect={() => selectPlatform(platform.id)}
              />
            ))}
          </div>
        )}
      </nav>

      <div className="border-t border-ledger-line p-3">
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-signal-filed/50 py-2 text-xs font-medium text-signal-filed transition-colors hover:bg-signal-filed/10"
        >
          <Plus size={14} />
          Add platform
        </button>
      </div>
    </aside>
  );
}
