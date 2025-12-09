interface AdminInputProps {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}

export function AdminInput({ placeholder, value, onChange, type = "text" }: AdminInputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="console-input w-full text-sm"
    />
  );
}
