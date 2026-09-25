import type { ItrReturnPayload } from "@/types";
import { api, mockDelay, USE_MOCKS } from "./client";

export interface FilingResult {
  acknowledgementNumber: string;
  filedAt: string;
  status: "submitted" | "acknowledged";
}

/**
 * The seam between the frontend's self-reported income data and the
 * backend filing engine. The backend recomputes the authoritative
 * computation from Postgres before accepting a filing, so the client's
 * numbers are advisory.
 */
export const itrService = {
  async file(payload: ItrReturnPayload): Promise<FilingResult> {
    if (USE_MOCKS) {
      await mockDelay(900);
      return {
        acknowledgementNumber: `MOCK-${Date.now().toString(36).toUpperCase()}`,
        filedAt: new Date().toISOString(),
        status: "submitted",
      };
    }
    return api.post<FilingResult>("/itr/file", payload);
  },

  /** Downloads the filed summary. Real mode asks the backend for the
   * latest filed return; mock mode exports the current payload. */
  async exportSummary(payload: ItrReturnPayload): Promise<Blob> {
    if (USE_MOCKS) {
      await mockDelay(200);
      const text = JSON.stringify(payload, null, 2);
      return new Blob([text], { type: "application/json" });
    }
    const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
    const res = await fetch(`${BASE_URL}/itr/export`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? "Export failed");
    }
    return res.blob();
  },
};
