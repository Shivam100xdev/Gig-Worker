import { useState } from "react";
import { Plus } from "lucide-react";
import { useIncomeRecordActions } from "@/hooks/useIncomeRecordActions";
import { validateIncomeForm, type IncomeFormValues } from "@/lib/validation";
import { TextInput } from "@/components/common/TextInput";
import { DateInput } from "@/components/common/DateInput";
import { ToggleSwitch } from "@/components/common/ToggleSwitch";
import { Button } from "@/components/common/Button";
import type { TaxDeductionSource, ValidationIssue } from "@/types";

const EMPTY_FORM: IncomeFormValues = {
  incomeAmount: "",
  correspondingTax: "",
  workStartDate: "",
  workEndDate: "",
  taxPayDeadline: "",
  clientName: "",
  clientEmail: "",
};

export function IncomeForm({ platformId }: { platformId: string }) {
  const { addRecord } = useIncomeRecordActions(platformId);
  const [values, setValues] = useState<IncomeFormValues>(EMPTY_FORM);
  const [deductionSource, setDeductionSource] = useState<TaxDeductionSource>("none");
  const [issues, setIssues] = useState<ValidationIssue[]>([]);

  function errorFor(field: string) {
    return issues.find((i) => i.field === field)?.message;
  }

  function set<K extends keyof IncomeFormValues>(field: K, value: IncomeFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateIncomeForm(values);
    setIssues(found);
    if (found.length > 0) return;
    addRecord(values, deductionSource);
    setValues(EMPTY_FORM);
    setDeductionSource("none");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-ledger-line bg-ledger-panel p-5">
      <h3 className="font-display text-sm font-600 text-ledger-text">Log income</h3>

      <div className="grid grid-cols-2 gap-3">
        <TextInput
          label="Income"
          prefix="₹"
          type="number"
          min={0}
          placeholder="0"
          value={values.incomeAmount}
          error={errorFor("incomeAmount")}
          onChange={(e) => set("incomeAmount", e.target.value)}
        />
        <TextInput
          label="Corresponding tax"
          prefix="₹"
          type="number"
          min={0}
          placeholder="0"
          value={values.correspondingTax}
          error={errorFor("correspondingTax")}
          onChange={(e) => set("correspondingTax", e.target.value)}
        />
      </div>

      <ToggleSwitch
        label="Where was this tax deducted, if any?"
        value={deductionSource}
        onChange={setDeductionSource}
        options={[
          { value: "none", label: "Not deducted" },
          { value: "platform_tds", label: "Platform TDS" },
          { value: "client_tds", label: "Client TDS" },
        ]}
      />
      {deductionSource !== "none" && (
        <p className="-mt-2 text-xs text-signal-pending">
          Sourced from a platform/client TDS entry — once this income is marked paid you'll need to confirm it against the actual tax receipt.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <DateInput
          label="Work start date"
          value={values.workStartDate}
          error={errorFor("workStartDate")}
          onChange={(v) => set("workStartDate", v)}
        />
        <DateInput
          label="Work end date"
          value={values.workEndDate}
          error={errorFor("workEndDate")}
          onChange={(v) => set("workEndDate", v)}
        />
      </div>

      <DateInput
        label="Tax pay deadline"
        value={values.taxPayDeadline}
        error={errorFor("taxPayDeadline")}
        onChange={(v) => set("taxPayDeadline", v)}
      />

      <div className="grid grid-cols-2 gap-3 border-t border-ledger-line pt-4">
        <TextInput
          label="Client name"
          placeholder="Who paid you"
          value={values.clientName}
          error={errorFor("clientName")}
          onChange={(e) => set("clientName", e.target.value)}
        />
        <TextInput
          label="Client email"
          type="email"
          placeholder="client@example.com"
          value={values.clientEmail}
          error={errorFor("clientEmail")}
          onChange={(e) => set("clientEmail", e.target.value)}
        />
      </div>

      <Button type="submit" variant="primary" className="mt-1 self-start">
        <Plus size={14} />
        Add entry
      </Button>
    </form>
  );
}
