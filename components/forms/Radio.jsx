export default function Radio({
  checked = false,
  onChange,
  label,
  description,
  className = "",
  disabled = false,
  name,
  value,
  rightContent = null,
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
            type="radio"
            name={name}
            value={value}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="peer sr-only"
          />
          <span className="h-5 w-5 rounded-full border border-slate-300 bg-white transition-colors peer-checked:border-[#0056d2]" />
          <span className="pointer-events-none absolute h-2.5 w-2.5 rounded-full bg-[#0056d2] opacity-0 transition-opacity peer-checked:opacity-100" />
        </span>
        <span>
          <span className="font-medium text-slate-700">{label}</span>
          {description ? (
            <span className="block text-xs text-slate-500">{description}</span>
          ) : null}
        </span>
      </span>
      {rightContent}
    </label>
  );
}
