import { useAtomValue, useSetAtom } from "jotai";
import { incomeRecordsAtom, platformsAtom } from "@/store/atoms";
import type { IncomeFormValues } from "@/lib/validation";
import { recordService } from "@/lib/api/recordService";
import { USE_MOCKS } from "@/lib/api/client";
import type { IncomeRecord, TaxDeductionSource } from "@/types";

/**
 * Income-record mutations. Mock mode stays in localStorage atoms; real mode
 * round-trips every add/update/delete against the backend so the DB is the
 * source of truth (the ledger mirrors the API result).
 */
export function useIncomeRecordActions(platformId: string | null) {
  const records = useAtomValue(incomeRecordsAtom);
  const setRecords = useSetAtom(incomeRecordsAtom);
  const setPlatforms = useSetAtom(platformsAtom);

  async function addRecord(values: IncomeFormValues, deductionSource: TaxDeductionSource) {
    if (!platformId) return;
    const incomeAmount = Number(values.incomeAmount);
    const correspondingTax = Number(values.correspondingTax || 0);

    if (USE_MOCKS) {
      const now = new Date().toISOString();
      const record: IncomeRecord = {
        id: crypto.randomUUID(),
        platformId,
        incomeAmount,
        correspondingTax,
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
      markPlatformHasRecords();
      return;
    }

    // Real mode: the DB insert is authoritative; only mirror it locally on
    // success so a failed insert never leaves a phantom entry in the UI.
    const record = await recordService.create({
      platformId,
      incomeAmount,
      correspondingTax,
      taxDeductionSource: deductionSource,
      workStartDate: values.workStartDate,
      workEndDate: values.workEndDate,
      taxPayDeadline: values.taxPayDeadline,
      clientName: values.clientName,
      clientEmail: values.clientEmail,
    });
    setRecords((prev) => [...prev, record]);
    markPlatformHasRecords();
  }

  function markPlatformHasRecords() {
    setPlatforms((prev) =>
      prev.map((p) => (p.id === platformId ? { ...p, hasRecords: true } : p))
    );
  }

  function updateRecord(recordId: string, patch: Partial<IncomeRecord>) {
    const snapshot = records.find((r) => r.id === recordId);
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r
      )
    );
    if (USE_MOCKS) return;
    recordService
      .update(recordId, {
        paymentStatus: patch.paymentStatus,
        receiptConfirmed: patch.receiptConfirmed,
        receiptFileName: patch.receiptFileName,
      })
      .catch(() => {
        if (snapshot) {
          setRecords((prev) => prev.map((r) => (r.id === recordId ? snapshot : r)));
        }
      });
  }

  function confirmReceipt(recordId: string, fileName?: string) {
    updateRecord(recordId, { receiptConfirmed: true, receiptFileName: fileName });
  }

  function removeRecord(recordId: string) {
    const snapshot = records.find((r) => r.id === recordId);
    setRecords((prev) => prev.filter((r) => r.id !== recordId));
    if (USE_MOCKS) return;
    recordService.remove(recordId).catch(() => {
      if (snapshot) {
        setRecords((prev) => {
          if (prev.some((r) => r.id === recordId)) return prev;
          return [...prev, snapshot];
        });
      }
    });
  }

  return { addRecord, updateRecord, confirmReceipt, removeRecord };
}
