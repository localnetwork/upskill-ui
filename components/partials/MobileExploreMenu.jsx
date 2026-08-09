import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, X } from "lucide-react";
import categories from "@/lib/preBuildScripts/static/categories.json";

/**
 * Shared level header — back button (optional), title, close button.
 * Keeps every drill-down level visually consistent.
 */
function LevelHeader({ title, onBack, onClose }) {
  return (
    <div className="flex items-center gap-1 px-2 py-3 border-b border-gray-100">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
      ) : (
        <span className="w-8 shrink-0" aria-hidden="true" />
      )}
      <h2 className="flex-1 min-w-0 truncate text-sm font-bold text-slate-800">
        {title}
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close explore menu"
        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <X size={20} className="text-slate-600" />
      </button>
    </div>
  );
}

export default function MobileExploreMenu({ open, onClose, onNavigate }) {
  const [stack, setStack] = useState([{ kind: "root" }]);
  const current = stack[stack.length - 1];

  const push = (entry) => setStack((prev) => [...prev, entry]);
  const pop = () =>
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  const close = () => {
    setStack([{ kind: "root" }]);
    onClose();
  };

  const navigate = () => {
    setStack([{ kind: "root" }]);
    onNavigate();
  };

  const rowClasses =
    "flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer";

  return (
    <div
      id="mobile-explore"
      aria-hidden={!open}
      inert={!open}
      className={`absolute inset-0 z-10 bg-white flex flex-col transition-transform duration-300 ease-in-out motion-reduce:transition-none ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* ROOT — all categories */}
      {current.kind === "root" && (
        <>
          <LevelHeader title="Explore" onClose={close} />
          <nav
            className="flex-1 overflow-y-auto py-1"
            aria-label="Explore categories"
          >
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => push({ kind: "children", category })}
                className={`w-full text-left ${rowClasses}`}
              >
                <span className="text-sm font-medium text-slate-700">
                  {category.title}
                </span>
                <ChevronRight size={18} className="text-slate-400 shrink-0" />
              </button>
            ))}
          </nav>
        </>
      )}

      {/* CHILDREN — sub-categories of the selected category */}
      {current.kind === "children" && (
        <>
          <LevelHeader
            title={current.category.title}
            onBack={pop}
            onClose={close}
          />
          <nav
            className="flex-1 overflow-y-auto py-1"
            aria-label={`${current.category.title} sub-categories`}
          >
            {(current.category.children || []).map((child) =>
              child?.topics?.length ? (
                <button
                  key={child.id || child.slug}
                  type="button"
                  onClick={() =>
                    push({ kind: "topics", child, parent: current.category })
                  }
                  className={`w-full text-left ${rowClasses}`}
                >
                  <span className="text-sm font-medium text-slate-700">
                    {child.title}
                  </span>
                  <ChevronRight size={18} className="text-slate-400 shrink-0" />
                </button>
              ) : (
                <Link
                  key={child.id || child.slug}
                  href={`/categories/${child.slug}`}
                  onClick={navigate}
                  className={rowClasses}
                >
                  <span className="text-sm font-medium text-slate-700">
                    {child.title}
                  </span>
                  <ChevronRight size={18} className="text-slate-400 shrink-0" />
                </Link>
              ),
            )}
          </nav>
        </>
      )}

      {/* TOPICS — topic chips for the selected child */}
      {current.kind === "topics" && (
        <>
          <LevelHeader
            title={current.child.title}
            onBack={pop}
            onClose={close}
          />
          <nav
            className="flex-1 overflow-y-auto p-4"
            aria-label={`${current.child.title} topics`}
          >
            <div className="flex flex-wrap gap-2">
              {(current.child.topics || []).slice(0, 12).map((topic) => (
                <Link
                  key={topic.id || topic.slug}
                  href={`/topics/${topic.slug}`}
                  onClick={navigate}
                  className="px-2.5 py-1 rounded-full border border-gray-300 text-sm hover:bg-gray-50 transition-colors"
                >
                  {topic.title}
                </Link>
              ))}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
