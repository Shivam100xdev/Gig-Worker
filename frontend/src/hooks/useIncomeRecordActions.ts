import { useSetAtom } from "jotai";
import { incomeRecordsAtom, platformsAtom } from "@/store/atoms";
import type { IncomeFormValues } from "@/lib/validation";
import type { IncomeRecord, TaxDeductionSource } from "@/types";

export function useIncomeRecordActions(platformId: string | null) {
  const setRecords = useSetAtom(incomeRecordsAtom);
  const setPlatforms = useSetAtom(platformsAtom);

  function addRecord(values: IncomeFormValues, deductionSource: TaxDeductionSource) {
    if (!platformId) return;
    const now = new Date().toISOString();
    const record: IncomeRecord = {
      id: crypto.randomUUID(),
      platformId,
      incomeAmount: Number(values.incomeAmount),
      correspondingTax: Number(values.correspondingTax || 0),
      taxDeductionSource: deductionSource,
      paymentStatus: "not_paid",
      receiptConfirmed: deductionSource === "none",
      workStartDate: values.workStartDate,
      workEndDate: values.workEndDate,
      taxPayDeadline: values.taxPayDeadline,
      client: { name: values.clientName, email: values.clientEmail },
      createdAt: now,
      updatedAt: now,
    };
    setRecords((prev) => [...prev, record]);
    setPlatforms((prev) =>
      prev.map((p) => (p.id === platformId ? { ...p, hasRecords: true } : p))
    );
  }

  function updateRecord(recordId: string, patch: Partial<IncomeRecord>) {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r
      )
    );
  }

  function confirmReceipt(recordId: string, fileName?: string) {
    updateRecord(recordId, { receiptConfirmed: true, receiptFileName: fileName });
  }

  function removeRecord(recordId: string) {
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
  }

  return { addRecord, updateRecord, confirmReceipt, removeRecord };
}
