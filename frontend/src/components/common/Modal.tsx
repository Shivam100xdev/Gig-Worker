import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string;
}

export function Modal({ title, subtitle, onClose, children, widthClass = "max-w-lg" }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-10"
      onClick={onClose}
    >
      <div
        className={`w-full ${widthClass} rounded-lg border border-ledger-line bg-ledger-panel shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-ledger-line px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-600 text-ledger-text">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-ledger-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-sm p-1 text-ledger-muted transition-colors hover:bg-ledger-raised hover:text-ledger-text"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
