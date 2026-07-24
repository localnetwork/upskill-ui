import { useMemo } from "react";
import ReactSelect from "react-select";

function normalizeOption(option) {
  return {
    value: String(option?.id ?? option?.value ?? ""),
    label: String(option?.label ?? option?.title ?? ""),
    meta: option,
  };
}

export default function TagAutocompleteMultiSelect({
  value = [],
  options = [],
  onChange,
  placeholder = "Search and select topics...",
  noOptionsMessage = "No matching topics",
  disabled = false,
}) {
  const normalizedOptions = useMemo(
    () => options.map(normalizeOption).filter((option) => option.value),
    [options],
  );

  const selectedValues = useMemo(() => {
    const selectedIds = new Set((Array.isArray(value) ? value : []).map((item) => String(item)));
    return normalizedOptions.filter((option) => selectedIds.has(option.value));
  }, [normalizedOptions, value]);

  return (
    <ReactSelect
      isMulti
      isSearchable
      isDisabled={disabled}
      options={normalizedOptions}
      value={selectedValues}
      onChange={(selected) => {
        const ids = Array.isArray(selected)
          ? selected.map((item) => String(item.value))
          : [];
        onChange?.(ids);
      }}
      placeholder={placeholder}
      noOptionsMessage={() => noOptionsMessage}
      formatOptionLabel={(option) => {
        const meta = option.meta || {};
        const trail = meta.parent_category_title
          ? `${meta.parent_category_title} > ${meta.category_title}`
          : meta.category_title || "";
        return (
          <div className="flex flex-col">
            <span>{option.label}</span>
            {trail ? <span className="text-xs text-slate-500">{trail}</span> : null}
          </div>
        );
      }}
      unstyled
      classNames={{
        control: (state) =>
          `border rounded px-2 py-1 min-h-[42px] ${state.isFocused ? "border-[#0056D2] ring-2 ring-[#0056D2]/20" : "border-slate-300"}`,
        valueContainer: () => "gap-1",
        multiValue: () => "bg-[#EEF4FF] text-[#0056D2] rounded px-1 py-0.5",
        multiValueLabel: () => "text-xs",
        multiValueRemove: () => "hover:bg-[#dbeafe] rounded px-1 cursor-pointer",
        placeholder: () => "text-slate-400 text-sm",
        menu: () =>
          "mt-1 rounded-md border border-[#e2e8f0] bg-white shadow-lg overflow-hidden z-20",
        menuList: () => "py-1 max-h-56",
        option: (state) =>
          `px-3 py-2 text-sm cursor-pointer ${
            state.isFocused ? "bg-[#f1f5f9]" : "bg-white"
          } ${state.isSelected ? "bg-[#e2e8f0]" : ""}`,
      }}
    />
  );
}
