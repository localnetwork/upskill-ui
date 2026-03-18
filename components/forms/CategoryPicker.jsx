import { useState } from "react";
import categories from "@/lib/preBuildScripts/static/categories.json";

export default function CategoryPicker({
  label,
  name,
  value,
  onChange,
  error,
  payload,
}) {
  const [activeParent, setActiveParent] = useState(null);
  const selectedCategories = Array.isArray(value) ? value : [];

  const handleParentSelect = (cat) => {
    if (activeParent?.id === cat.id) return;
    onChange([]); // clear all on parent switch
    setActiveParent(cat);
  };

  const toggleSub = (parent, sub) => {
    const exists = selectedCategories.some(
      (s) => s.parent === parent && s.sub === sub,
    );
    if (exists) {
      onChange(
        selectedCategories.filter(
          (s) => !(s.parent === parent && s.sub === sub),
        ),
      );
    } else {
      onChange([...selectedCategories, { parent, sub }]);
    }
  };

  const removeTag = (parent, sub) => {
    onChange(
      selectedCategories.filter((s) => !(s.parent === parent && s.sub === sub)),
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-medium" htmlFor={name}>
          {label} <span className="text-red-500">*</span>
        </label>
      )}

      <div className="flex border border-gray-200 rounded-lg overflow-hidden min-h-64 text-sm">
        {/* Left: parent categories */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
          <div className="px-3 py-2 text-xs text-gray-500 font-medium bg-gray-50 border-b border-gray-200">
            Categories
          </div>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleParentSelect(cat)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${
                activeParent?.id === cat.id
                  ? "bg-violet-50 text-violet-700"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <span>{cat.title}</span>
              <span className="text-gray-400 text-xs">&#8250;</span>
            </button>
          ))}
        </div>

        {/* Right: subcategories */}
        <div className="w-1/2 overflow-y-auto">
          {!activeParent ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-xs p-4 text-center">
              ← Select a category
            </div>
          ) : (
            <>
              <div className="px-3 py-2 text-xs text-gray-500 font-medium bg-gray-50 border-b border-gray-200">
                {activeParent.title}
              </div>
              {activeParent.children.map((sub) => {
                const isSelected = selectedCategories.some(
                  (s) => s.parent === activeParent.id && s.sub === sub.id,
                );
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => toggleSub(activeParent.id, sub.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "bg-violet-50 text-violet-700"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span>{sub.title}</span>
                    {isSelected && (
                      <span className="text-violet-500 text-xs">&#10003;</span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Selected tags */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {selectedCategories.map(({ parent, sub }) => {
            const parentCat = categories.find((c) => c.id === parent);
            const subCat = parentCat?.children?.find((s) => s.id === sub);
            return (
              <span
                key={`${parent}-${sub}`}
                className="flex items-center gap-1 bg-violet-50 text-violet-700 text-xs rounded-full px-3 py-1"
              >
                {subCat?.title}
                <button
                  type="button"
                  onClick={() => removeTag(parent, sub)}
                  className="text-violet-400 hover:text-violet-700 leading-none"
                >
                  &times;
                </button>
              </span>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
