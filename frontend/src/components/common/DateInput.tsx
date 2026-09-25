import { TextInput } from "@/components/common/TextInput";

interface DateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function DateInput({ label, value, onChange, error }: DateInputProps) {
  return (
    <TextInput
      label={label}
      type="date"
      value={value}
      error={error}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
