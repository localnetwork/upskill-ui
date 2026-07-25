import { Check } from "lucide-react";

export default function Checkbox({
  checked = false,
  onChange,
  label,
  count,
  className = "",
  disabled = false,
  name,
  value,
}) {
  return (
    <label
      className={`flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm transition-colors ${
        checked ? "border-[#0056d2] bg-[#eff6ff]" : "hover:border-slate-300"
      } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      <span className="flex items-center gap-2.5">
        <span className="relative inline-flex h-5 w-5 items-center justify-center">
          <input
            type="checkbox"
            name={name}
            value={value}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="peer sr-only"
          />
          <span className="h-5 w-5 rounded-md border border-slate-300 bg-white transition-colors peer-checked:border-[#0056d2] peer-checked:bg-[#0056d2]" />
          <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
        </span>
        <span className="font-medium text-slate-700">{label}</span>
      </span>
      {count !== undefined ? (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
          {count}
        </span>
      ) : null}
    </label>
  );
}
