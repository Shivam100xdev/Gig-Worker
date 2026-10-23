import { useAtom } from "jotai";
import { taxpayerProfileAtom, sessionUserAtom } from "@/store/atoms";
import { validatePan } from "@/lib/validation";
import { authService } from "@/lib/api/authService";
import { TextInput } from "@/components/common/TextInput";
import { ToggleSwitch } from "@/components/common/ToggleSwitch";

/** Identity fields stored on the User row in Postgres (or mock-local). */
type IdentityField = "name" | "pan" | "email";

export function TaxpayerBar() {
  const [profile, setProfile] = useAtom(taxpayerProfileAtom);
  const [user, setUser] = useAtom(sessionUserAtom);
  const panError = profile.pan.length > 0 && !validatePan(profile.pan) ? "Format: AAAAA9999A" : undefined;

  /** Persist an identity edit to the DB (debounced), then mirror the
   * confirmed value into both the local profile and the session user. */
  function editIdentity(field: IdentityField, rawValue: string) {
    const value = field === "pan" ? rawValue.toUpperCase() : rawValue;
    setProfile((p) => ({ ...p, [field]: value }));

    if (!user) return;
    window.clearTimeout(pendingTimers[field]);
    pendingTimers[field] = window.setTimeout(() => {
      authService
        .updateProfile({ [field]: value })
        .then((updated) => {
          setUser(updated);
          setProfile((p) => ({ ...p, [field]: updated[field] ?? value }));
        })
        .catch(() => undefined); // local edit stands; retried on next keystroke
    }, 600);
  }

  return (
    <div className="grid grid-cols-2 gap-3 border-b border-ledger-line bg-ledger-panel/60 px-6 py-3 sm:grid-cols-4">
      <TextInput
        label="Full name"
        value={profile.name}
        onChange={(e) => editIdentity("name", e.target.value)}
        placeholder="As on PAN"
      />
      <TextInput
        label="PAN"
        value={profile.pan}
        error={panError}
        onChange={(e) => editIdentity("pan", e.target.value)}
        placeholder="AAAAA9999A"
        maxLength={10}
      />
      <TextInput
        label="Email"
        type="email"
        value={profile.email}
        onChange={(e) => editIdentity("email", e.target.value)}
        placeholder="you@example.com"
      />
      <ToggleSwitch
        label="Tax regime"
        value={profile.regime}
        onChange={(regime) => setProfile((p) => ({ ...p, regime }))}
        options={[
          { value: "new", label: "New" },
          { value: "old", label: "Old" },
        ]}
      />
    </div>
  );
}

const pendingTimers: Record<IdentityField, number> = { name: 0, pan: 0, email: 0 };
