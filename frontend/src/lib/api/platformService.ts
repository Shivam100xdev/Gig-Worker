import type { Platform, PlatformCategory } from "@/types";
import { api, mockDelay, USE_MOCKS } from "./client";

/**
 * Platform CRUD. Mock mode returns nulls so the store's atomWithStorage
 * stays the source of truth; real mode persists to Postgres via the backend
 * and the store hydrates from these calls.
 */
export const platformService = {
  async list(): Promise<Platform[] | null> {
    if (USE_MOCKS) {
      await mockDelay(150);
      return null; // atomWithStorage is the source of truth in mock mode
    }
    const res = await api.get<{ platforms: Platform[] }>("/platforms");
    return res.platforms;
  },

  async create(name: string, category: PlatformCategory): Promise<Platform | null> {
    if (USE_MOCKS) {
      await mockDelay(200);
      return {
        id: crypto.randomUUID(),
        name,
        category,
        hasRecords: false,
        createdAt: new Date().toISOString(),
      };
    }
    const res = await api.post<{ platform: Platform }>("/platforms", { name, category });
    return res.platform;
  },

  async remove(platformId: string): Promise<void> {
    if (USE_MOCKS) {
      await mockDelay(150);
      return;
    }
    await api.delete(`/platforms/${platformId}`);
  },
};
