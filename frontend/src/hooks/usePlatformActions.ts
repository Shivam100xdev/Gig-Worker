import { useAtom, useSetAtom } from "jotai";
import {
  incomeRecordsAtom,
  isAddPlatformModalOpenAtom,
  platformsAtom,
  selectedPlatformIdAtom,
} from "@/store/atoms";
import { platformService } from "@/lib/api/platformService";
import type { PlatformCategory } from "@/types";

export function usePlatformActions() {
  const [platforms, setPlatforms] = useAtom(platformsAtom);
  const setSelectedId = useSetAtom(selectedPlatformIdAtom);
  const setIncomeRecords = useSetAtom(incomeRecordsAtom);
  const setModalOpen = useSetAtom(isAddPlatformModalOpenAtom);

  async function addPlatform(name: string, category: PlatformCategory) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const platform = await platformService.create(trimmed, category);
    if (!platform) return;
    setPlatforms((prev) => [...prev, platform]);
    setSelectedId(platform.id);
    setModalOpen(false);
  }

  async function removePlatform(platformId: string) {
    await platformService.remove(platformId);
    setPlatforms((prev) => prev.filter((p) => p.id !== platformId));
    setIncomeRecords((prev) => prev.filter((r) => r.platformId !== platformId));
    setSelectedId((current) => (current === platformId ? null : current));
  }

  function selectPlatform(platformId: string) {
    setSelectedId(platformId);
  }

  return { platforms, addPlatform, removePlatform, selectPlatform };
}
