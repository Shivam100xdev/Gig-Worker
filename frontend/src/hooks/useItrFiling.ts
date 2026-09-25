import { useAtomValue, useSetAtom } from "jotai";
import {
  isItrSummaryModalOpenAtom,
  isSubmittingItrAtom,
  itrFilingStatusAtom,
  submitErrorAtom,
} from "@/store/atoms";
import { itrPayloadAtom, isReadyToFileAtom } from "@/store/derivedAtoms";
import { itrService } from "@/lib/api/itrService";

export function useItrFiling() {
  const payload = useAtomValue(itrPayloadAtom);
  const isReady = useAtomValue(isReadyToFileAtom);
  const isSubmitting = useAtomValue(isSubmittingItrAtom);
  const error = useAtomValue(submitErrorAtom);
  const setSubmitting = useSetAtom(isSubmittingItrAtom);
  const setError = useSetAtom(submitErrorAtom);
  const setStatus = useSetAtom(itrFilingStatusAtom);
  const setModalOpen = useSetAtom(isItrSummaryModalOpenAtom);

  function openSummary() {
    setError(null);
    setModalOpen(true);
  }

  function closeSummary() {
    setModalOpen(false);
  }

  async function submitFiling() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await itrService.file(payload);
      setStatus(result.status);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Filing failed. Try again.");
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  async function downloadSummary() {
    const blob = await itrService.exportSummary(payload);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `itr-summary-${payload.assessmentYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    payload,
    isReady,
    isSubmitting,
    error,
    openSummary,
    closeSummary,
    submitFiling,
    downloadSummary,
  };
}
