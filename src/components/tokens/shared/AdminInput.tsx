interface AdminInputProps {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "number";
}

export function AdminInput({ placeholder, value, onChange, type = "text" }: AdminInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // For number type, only allow digits and a single decimal point
    if (type === "number") {
      if (val === "" || /^\d*\.?\d*$/.test(val)) {
        onChange(val);
      }
    } else {
      onChange(val);
    }
  };

  return (
    <input
      type="text"
      inputMode={type === "number" ? "decimal" : "text"}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      className="console-input w-full text-sm"
    />
  );
}
