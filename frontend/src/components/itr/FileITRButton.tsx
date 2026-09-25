import { FileCheck2 } from "lucide-react";
import { useItrFiling } from "@/hooks/useItrFiling";
import { Button } from "@/components/common/Button";

/** Always opens the review modal — the modal itself explains what's
 * missing rather than leaving the person guessing why a disabled button
 * won't respond. */
export function FileITRButton() {
  const { openSummary } = useItrFiling();

  return (
    <Button variant="primary" onClick={openSummary}>
      <FileCheck2 size={15} />
      File ITR
    </Button>
  );
}
