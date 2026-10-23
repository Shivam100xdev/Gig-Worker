import { useCallback, useEffect, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  sessionUserAtom,
  taxpayerProfileAtom,
  platformsAtom,
  incomeRecordsAtom,
  mainSectionAtom,
} from "@/store/atoms";
import { authService } from "@/lib/api/authService";
import { platformService } from "@/lib/api/platformService";
import { recordService } from "@/lib/api/recordService";
import { USE_MOCKS, mockSessionStore } from "@/lib/api/client";

/** Legacy per-user keys that must never survive a sign-out / account switch. */
const STALE_PROFILE_KEY = "gigtax:taxpayer-profile";

export function useSession() {
  const [user, setUser] = useAtom(sessionUserAtom);
  const [status, setStatus] = useState<"loading" | "anon" | "ready">("loading");
  const setProfile = useSetAtom(taxpayerProfileAtom);
  const setPlatforms = useSetAtom(platformsAtom);
  const setRecords = useSetAtom(incomeRecordsAtom);
  const setSection = useSetAtom(mainSectionAtom);

  /** Wipe anything user-specific from localStorage before another account
   * (or a fresh first-visit) hydrates from the DB. */
  function resetLocalUserData() {
    localStorage.removeItem(STALE_PROFILE_KEY); // legacy atomWithStorage key
    setProfile((p) => ({ ...p, name: "", pan: "", email: "" }));
    setRecords([]);
    setPlatforms([]);
    setSection("dashboard");
  }

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

  // Hydrate the taxpayer profile from the signed-in user's DB row whenever
  // the session identity changes. Local edits are never merged in on top of
  // another user's identity.
  useEffect(() => {
    if (!user) return;
    setProfile((p) => ({
      ...p,
      name: user.name ?? "",
      email: user.email ?? "",
      pan: user.pan ?? "",
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
      resetLocalUserData();
      setUser(loggedIn);

      if (!USE_MOCKS) {
        // DB is the source of truth: pull this account's platforms and the
        // full income ledger before the first render of the workspace.
        try {
          const [platforms, records] = await Promise.all([
            platformService.list(),
            recordService.list(),
          ]);
          setPlatforms(platforms ?? []);
          setRecords(records);
        } catch {
          // Backend briefly down: the workspace still opens empty and the
          // ledger sections retry on their own refresh calls.
        }
      } else {
        await loadMockWorkspace();
      }
      return loggedIn;
    },
    [setUser, setProfile, setPlatforms, setRecords, setSection]
  );

  async function loadMockWorkspace() {
    const platforms = await platformService.list();
    if (platforms) setPlatforms(platforms);
  }

  const updateProfile = useCallback(
    async (patch: { name?: string; pan?: string; email?: string; gstin?: string }) => {
      const updated = await authService.updateProfile(patch);
      setUser(updated);
      setProfile((p) => ({
        ...p,
        name: updated.name ?? p.name,
        pan: updated.pan ?? p.pan,
        email: updated.email ?? p.email,
        gstin: updated.gstin,
      }));
      return updated;
    },
    [setUser, setProfile]
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    mockSessionStore.clear();
    resetLocalUserData();
    setStatus("ready");
  }, [setUser, setProfile, setRecords, setPlatforms, setSection]);

  return { user, status, requestOtp, verifyOtp, updateProfile, logout };
}
