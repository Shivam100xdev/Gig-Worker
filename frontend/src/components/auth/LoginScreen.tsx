import { useState } from "react";
import { Landmark, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { TextInput } from "@/components/common/TextInput";
import { Button } from "@/components/common/Button";
import { useSession } from "@/hooks/useSession";

/**
 * Mobile-OTP login — the only door into the app. Two steps:
 *   1. enter mobile -> request OTP (Redis-backed, 5-min TTL server-side)
 *   2. enter the 6-digit code -> verified, session cookie issued
 * First login creates the account; there is no separate signup.
 */
export function LoginScreen() {
  const { requestOtp, verifyOtp } = useSession();
  const [step, setStep] = useState<"mobile" | "code">("mobile");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const mobileValid = /^(\+91)?[6-9]\d{9}$/.test(mobile.replace(/[\s-]/g, ""));

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!mobileValid) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await requestOtp(mobile);
      setDevCode(res.devCode ?? null);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the OTP. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await verifyOtp(mobile, code.trim());
      // App re-renders from the session atom; nothing to do here.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ledger-base px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rupee-soft text-rupee">
            <Landmark size={22} />
          </div>
          <h1 className="mt-4 font-display text-xl font-600 text-ledger-text">Sign in to Gig</h1>
          <p className="mt-1.5 text-sm text-ledger-muted">
            One ledger for every platform you earn from — and your ITR, filed from it.
          </p>
        </div>

        <div className="rounded-lg border border-ledger-line bg-ledger-panel p-6">
          {step === "mobile" ? (
            <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
              <TextInput
                label="Mobile number"
                value={mobile}
                error={error ?? undefined}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="98XXXXXXXX"
                inputMode="tel"
                maxLength={13}
                autoFocus
              />
              <Button type="submit" variant="primary" loading={busy} disabled={!mobileValid}>
                Send OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs text-ledger-muted">
                <button
                  type="button"
                  onClick={() => { setStep("mobile"); setCode(""); setError(null); }}
                  className="flex items-center gap-1 text-signal-info transition-colors hover:text-ledger-text"
                >
                  <ArrowLeft size={12} />
                  {mobile}
                </button>
              </div>
              <TextInput
                label="6-digit OTP"
                value={code}
                error={error ?? undefined}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                inputMode="numeric"
                maxLength={6}
                autoFocus
              />
              {devCode && (
                <div className="flex items-start gap-2 rounded-md border border-signal-info/40 bg-signal-info/10 px-3 py-2 text-xs text-signal-info">
                  <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                  <span>
                    Dev mode — SMS isn't wired up, your OTP is <span className="font-mono font-semibold">{devCode}</span>
                  </span>
                </div>
              )}
              <Button type="submit" variant="primary" loading={busy} disabled={code.length !== 6}>
                Verify & sign in
              </Button>
              {busy && step === "code" && (
                <p className="flex items-center justify-center gap-1.5 text-xs text-ledger-muted">
                  <Loader2 size={12} className="animate-spin" /> Checking against Redis…
                </p>
              )}
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-ledger-muted">
          New here? Signing in with your mobile creates your account — no password to forget or leak.
        </p>
      </div>
    </div>
  );
}
