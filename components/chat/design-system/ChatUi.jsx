import { ChevronDown, ChevronRight } from "lucide-react";

export function IconCircleButton({
  children,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`grid h-10 w-10 place-items-center rounded-full ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SectionToggle({ label, expanded, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between text-left"
    >
      <span>{label}</span>
      {expanded ? (
        <ChevronDown className="h-4 w-4 text-slate-500" />
      ) : (
        <ChevronRight className="h-4 w-4 text-slate-500" />
      )}
    </button>
  );
}
