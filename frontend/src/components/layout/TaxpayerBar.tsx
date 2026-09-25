import { useAtom } from "jotai";
import { taxpayerProfileAtom } from "@/store/atoms";
import { validatePan } from "@/lib/validation";
import { TextInput } from "@/components/common/TextInput";
import { ToggleSwitch } from "@/components/common/ToggleSwitch";

export function TaxpayerBar() {
  const [profile, setProfile] = useAtom(taxpayerProfileAtom);
  const panError = profile.pan.length > 0 && !validatePan(profile.pan) ? "Format: AAAAA9999A" : undefined;

  return (
    <div className="grid grid-cols-2 gap-3 border-b border-ledger-line bg-ledger-panel/60 px-6 py-3 sm:grid-cols-4">
      <TextInput
        label="Full name"
        value={profile.name}
        onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
        placeholder="As on PAN"
      />
      <TextInput
        label="PAN"
        value={profile.pan}
        error={panError}
        onChange={(e) => setProfile((p) => ({ ...p, pan: e.target.value.toUpperCase() }))}
        placeholder="AAAAA9999A"
        maxLength={10}
      />
      <TextInput
        label="Email"
        type="email"
        value={profile.email}
        onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
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
