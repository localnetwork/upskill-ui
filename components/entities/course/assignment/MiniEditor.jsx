import { useEffect, useRef } from "react";
import { Bold, Italic, List, ListOrdered } from "lucide-react";

// Minimal B / I rich-text box; value is HTML limited server-side to basic tags.
export default function MiniEditor({ value, onChange, placeholder, minHeight = 90 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || "")) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (command) => {
    ref.current?.focus();
    document.execCommand(command);
    onChange?.(ref.current?.innerHTML || "");
  };

  return (
    <div className="rounded border border-slate-300 bg-white">
      <div className="flex gap-1 border-b border-slate-200 px-2 py-1">
        {[
          ["bold", Bold],
          ["italic", Italic],
          ["insertOrderedList", ListOrdered],
          ["insertUnorderedList", List],
        ].map(([command, Icon]) => (
          <button
            key={command}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => exec(command)}
            className="rounded p-1.5 text-slate-700 hover:bg-slate-100"
            aria-label={command}
          >
            <Icon size={15} />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={() => onChange?.(ref.current?.innerHTML || "")}
        style={{ minHeight }}
        className="px-3 py-2 text-[14px] outline-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  );
}
