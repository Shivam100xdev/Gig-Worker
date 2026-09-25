/**
 * Mobile-OTP auth service. Real mode hits the backend's /api/auth/*;
 * mock mode simulates the exact same flow with the OTP surfaced in the
 * response (the backend does the same outside production when no SMS
 * provider is configured) so the UI is fully testable.
 */
import { api, ApiError, mockDelay, USE_MOCKS, mockSessionStore } from "./client";

export interface SessionUser {
  id: string;
  mobile: string;
  name: string | null;
  email: string | null;
  pan: string | null;
  gstin: string | null;
}

export interface OtpRequestResult {
  mobile: string;
  expiresInSec: number;
  /** Only present in dev/mock mode — the real flow delivers via SMS. */
  devCode?: string;
}

const MOCK_OTP = "123456";
const mockUserStoreKey = "gig:mock-user";

function mockUser(): SessionUser {
  const raw = localStorage.getItem(mockUserStoreKey);
  if (raw) return JSON.parse(raw) as SessionUser;
  return {
    id: "mock-user",
    mobile: "+919820000000",
    name: null,
    email: null,
    pan: null,
    gstin: null,
  };
}

export const authService = {
  async requestOtp(mobile: string, purpose: "login" | "pan_update" = "login"): Promise<OtpRequestResult> {
    if (USE_MOCKS) {
      await mockDelay(500);
      return { mobile, expiresInSec: 300, devCode: MOCK_OTP };
    }
    return api.post<OtpRequestResult>("/auth/otp/request", { mobile, purpose });
  },

  async verifyOtp(mobile: string, code: string): Promise<SessionUser> {
    if (USE_MOCKS) {
      await mockDelay(500);
      if (code !== MOCK_OTP) throw new ApiError("That code is invalid or expired.", 401);
      mockSessionStore.set(mobile);
      return mockUser();
    }
    const res = await api.post<{ user: SessionUser }>("/auth/otp/verify", { mobile, code });
    return res.user;
  },

  async fetchSession(): Promise<SessionUser | null> {
    if (USE_MOCKS) {
      return mockSessionStore.get() ? mockUser() : null;
    }
    try {
      const res = await api.get<{ user: SessionUser | null }>("/auth/session");
      return res.user;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    }
  },

  async updateProfile(patch: { name?: string; email?: string; gstin?: string }): Promise<SessionUser> {
    if (USE_MOCKS) {
      await mockDelay(300);
      const user = { ...mockUser(), ...patch };
      localStorage.setItem(mockUserStoreKey, JSON.stringify(user));
      return user;
    }
    const res = await api.patch<{ user: SessionUser }>("/auth/profile", patch);
    return res.user;
  },

  async logout(): Promise<void> {
    if (USE_MOCKS) {
      mockSessionStore.clear();
      return;
    }
    await api.post("/auth/logout");
  },
};
