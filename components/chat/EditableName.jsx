import { useEffect, useRef, useState } from "react";

export default function EditableName({
  value = "",
  placeholder = "",
  onSave,
  disabled = false,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const finish = (commitValue) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setEditing(false);
    setDraft(value);
    if (commitValue !== null) {
      const next = String(commitValue).trim();
      if (next !== String(value || "").trim()) {
        onSave?.(next);
      }
    }
    setTimeout(() => {
      submittedRef.current = false;
    }, 0);
  };

  if (disabled) {
    return <span>{value || placeholder}</span>;
  }

  if (!editing) {
    return (
      <span
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        title="Click to edit"
        className="cursor-pointer"
      >
        {value || placeholder}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => finish(draft)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          finish(draft);
        } else if (event.key === "Escape") {
          event.preventDefault();
          finish(null);
        }
      }}
      placeholder={placeholder}
      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm outline-none"
    />
  );
}
