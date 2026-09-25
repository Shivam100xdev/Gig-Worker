import { useCallback, useEffect, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { sessionUserAtom, taxpayerProfileAtom, platformsAtom, incomeRecordsAtom } from "@/store/atoms";
import { authService } from "@/lib/api/authService";
import { platformService } from "@/lib/api/platformService";
import { USE_MOCKS, mockSessionStore, api } from "@/lib/api/client";

/**
 * Session lifecycle: restores any existing session on mount, exposes the
 * OTP login steps, and on login hydrates the ledger store from Postgres
 * (real mode) so the rest of the app reads atoms as before.
 */
export function useSession() {
  const [user, setUser] = useAtom(sessionUserAtom);
  const [status, setStatus] = useState<"loading" | "anon" | "ready">("loading");
  const setProfile = useSetAtom(taxpayerProfileAtom);
  const setPlatforms = useSetAtom(platformsAtom);
  const setRecords = useSetAtom(incomeRecordsAtom);

  // Restore session on first load.
  useEffect(() => {
    let cancelled = false;
    authService
      .fetchSession()
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("ready");
      });
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  // Mirror identity/profile fields into the ledger profile atom so the
  // filing payload and TaxpayerBar keep working unchanged.
  useEffect(() => {
    if (!user) return;
    setProfile((p) => ({
      ...p,
      name: p.name || user.name || "",
      email: p.email || user.email || "",
      pan: user.pan ?? p.pan,
    }));
  }, [user, setProfile]);

  const requestOtp = useCallback(
    (mobile: string, purpose: "login" | "pan_update" = "login") =>
      authService.requestOtp(mobile, purpose),
    []
  );

  const verifyOtp = useCallback(
    async (mobile: string, code: string) => {
      const loggedIn = await authService.verifyOtp(mobile, code);
      setUser(loggedIn);
      // Real mode: hydrate the ledger from Postgres. Mock mode: keep
      // whatever's in localStorage.
      if (!USE_MOCKS) {
        const [platforms, records] = await Promise.all([
          platformService.list(),
          apiListRecords(),
        ]);
        if (platforms) setPlatforms(platforms);
        if (records) setRecords(records);
      }
      return loggedIn;
    },
    [setUser, setPlatforms, setRecords]
  );

  const updateProfile = useCallback(
    async (patch: { name?: string; email?: string; gstin?: string }) => {
      const updated = await authService.updateProfile(patch);
      setUser(updated);
      setProfile((p) => ({
        ...p,
        name: patch.name ?? p.name,
        email: patch.email ?? p.email,
      }));
      return updated;
    },
    [setUser, setProfile]
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    mockSessionStore.clear();
    setStatus("ready");
  }, [setUser]);

  return { user, status, requestOtp, verifyOtp, updateProfile, logout };
}

async function apiListRecords() {
  try {
    const res = await api.get<{ records: never[] }>("/records");
    return res.records;
  } catch {
    return null;
  }
}
