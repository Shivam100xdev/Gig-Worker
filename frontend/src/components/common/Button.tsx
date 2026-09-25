import clsx from "clsx";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-rupee text-ledger-base hover:brightness-110 disabled:bg-ledger-raised disabled:text-ledger-muted",
  secondary:
    "bg-ledger-raised text-ledger-text border border-ledger-line hover:border-signal-info/60",
  ghost: "text-ledger-muted hover:text-ledger-text hover:bg-ledger-raised",
  danger: "bg-transparent text-signal-overdue border border-signal-overdue/50 hover:bg-signal-overdue/10",
};

export function Button({ variant = "secondary", loading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed",
        variantClasses[variant],
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}
