import clsx from "clsx";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  prefix?: string;
}

export function TextInput({ label, error, prefix, className, id, ...rest }: TextInputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs font-medium text-ledger-muted">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ledger-muted">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={clsx(
            "w-full rounded-md border bg-ledger-base px-3 py-2 text-sm text-ledger-text outline-none transition-colors placeholder:text-ledger-muted/60",
            "focus:border-signal-info/70",
            error ? "border-signal-overdue/70" : "border-ledger-line",
            prefix && "pl-7",
            className
          )}
          {...rest}
        />
      </div>
      {error && <span className="text-xs text-signal-overdue">{error}</span>}
    </div>
  );
}
