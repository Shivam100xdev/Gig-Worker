import clsx from "clsx";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface ToggleSwitchProps<T extends string> {
  label?: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function ToggleSwitch<T extends string>({ label, options, value, onChange }: ToggleSwitchProps<T>) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-medium text-ledger-muted">{label}</span>}
      <div className="inline-flex w-fit rounded-md border border-ledger-line bg-ledger-base p-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={clsx(
              "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
              value === opt.value
                ? "bg-ledger-raised text-ledger-text"
                : "text-ledger-muted hover:text-ledger-text"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
