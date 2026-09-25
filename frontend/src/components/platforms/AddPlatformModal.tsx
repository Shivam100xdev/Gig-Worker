import { useState } from "react";
import { useAtom } from "jotai";
import { isAddPlatformModalOpenAtom } from "@/store/atoms";
import { usePlatformActions } from "@/hooks/usePlatformActions";
import { Modal } from "@/components/common/Modal";
import { TextInput } from "@/components/common/TextInput";
import { Button } from "@/components/common/Button";
import { PLATFORM_CATEGORY_LABELS } from "@/lib/constants";
import type { PlatformCategory } from "@/types";

const CATEGORIES = Object.entries(PLATFORM_CATEGORY_LABELS) as [PlatformCategory, string][];

export function AddPlatformModal() {
  const [isOpen, setIsOpen] = useAtom(isAddPlatformModalOpenAtom);
  const { addPlatform } = usePlatformActions();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PlatformCategory>("freelance");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    await addPlatform(name, category);
    setSubmitting(false);
    setName("");
  }

  return (
    <Modal
      title="Add a platform"
      subtitle="Register where you earn from. You'll log income against it next."
      onClose={() => setIsOpen(false)}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextInput
          label="Platform name"
          placeholder="e.g. Swiggy, Upwork, Ola"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-ledger-muted">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PlatformCategory)}
            className="w-full rounded-md border border-ledger-line bg-ledger-base px-3 py-2 text-sm text-ledger-text outline-none focus:border-signal-info/70"
          >
            {CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting} disabled={!name.trim()}>
            Add platform
          </Button>
        </div>
      </form>
    </Modal>
  );
}
