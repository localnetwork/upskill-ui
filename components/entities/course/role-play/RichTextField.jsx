import { useEffect, useRef, useState } from "react";
import { Bold, Italic, List, ListOrdered } from "lucide-react";

const TOOLS = [
  { command: "bold", Icon: Bold, label: "Bold" },
  { command: "italic", Icon: Italic, label: "Italic" },
  { command: "insertOrderedList", Icon: ListOrdered, label: "Numbered list" },
  { command: "insertUnorderedList", Icon: List, label: "Bulleted list" },
];

const looksLikeHtml = (value) => /<\/?[a-z][\s\S]*>/i.test(value);
const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

// Minimal rich text field (bold, italic, lists). The server strips everything else.
export default function RichTextField({ value, onChange, maxLength = 3000 }) {
  const ref = useRef(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element || element.innerHTML === value) return;
    if (document.activeElement === element) return;
    element.innerHTML = looksLikeHtml(value || "")
      ? value
      : escapeHtml(value || "");
    setCount(element.innerText.length);
  }, [value]);

  const emit = () => {
    const element = ref.current;
    setCount(element.innerText.length);
    onChange(element.innerHTML);
  };

  return (
    <div className="rounded border border-slate-300 bg-white">
      <div className="flex items-center gap-1 border-b border-slate-200 px-3 py-2">
        {TOOLS.map(({ command, Icon, label }) => (
          <button
            key={command}
            type="button"
            aria-label={label}
            onMouseDown={(event) => {
              event.preventDefault();
              document.execCommand(command);
              emit();
            }}
            className="rounded p-1.5 text-primary hover:bg-slate-100"
          >
            <Icon size={15} />
          </button>
        ))}
        <span className="ml-auto text-[12px] text-slate-500">{count}</span>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          if (ref.current.innerText.length > maxLength) return;
          emit();
        }}
        className="min-h-[140px] px-4 py-3 text-[14px] leading-relaxed text-slate-800 outline-none [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  );
}
