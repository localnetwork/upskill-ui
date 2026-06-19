import ReactSelect from "react-select";
import { Children, isValidElement, useMemo, useState } from "react";

const DEFAULT_CONFIG = {
  isSearchable: false,
  isDisabled: false,
  isClearable: false,
  placeholder: "Select an option",
  searchPlaceholder: "Search options...",
  noOptionsLabel: "No options found",
  wrapperClassName: "",
  controlClassName: "border border-[#e2e8f0] rounded-md px-3 py-2 text-sm",
};

function normalizeOption(option) {
  if (option && typeof option === "object") {
    return {
      value: option.value ?? "",
      label: option.label ?? String(option.value ?? ""),
      isDisabled: Boolean(option.disabled || option.isDisabled),
    };
  }
  return {
    value: option ?? "",
    label: String(option ?? ""),
    isDisabled: false,
  };
}

function normalizeChildrenOptions(children) {
  return Children.toArray(children)
    .map((child) => {
      if (!isValidElement(child) || child.type !== "option") return null;
      const optionValue = child.props?.value ?? "";
      const optionChildren = Children.toArray(child.props?.children);
      const flattenedLabel = optionChildren
        .map((part) =>
          typeof part === "string" || typeof part === "number" ? String(part) : "",
        )
        .join("")
        .trim();
      const optionLabel = flattenedLabel || String(optionValue ?? "");
      return {
        value: optionValue,
        label: optionLabel,
        isDisabled: Boolean(child.props?.disabled),
      };
    })
    .filter(Boolean);
}

export default function Select({
  options = [],
  config = {},
  isSearchable,
  isDisabled,
  isClearable,
  placeholder,
  searchPlaceholder,
  noOptionsLabel,
  wrapperClassName,
  controlClassName,
  id,
  name,
  value,
  defaultValue,
  onChange,
  className,
  children,
  ...props
}) {
  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  const resolvedIsSearchable = isSearchable ?? mergedConfig.isSearchable;
  const resolvedIsDisabled = isDisabled ?? mergedConfig.isDisabled;
  const resolvedIsClearable = isClearable ?? mergedConfig.isClearable;
  const resolvedPlaceholder =
    placeholder ??
    (resolvedIsSearchable
      ? (searchPlaceholder ?? mergedConfig.searchPlaceholder)
      : mergedConfig.placeholder);
  const resolvedNoOptionsLabel = noOptionsLabel ?? mergedConfig.noOptionsLabel;
  const resolvedWrapperClassName =
    wrapperClassName ?? mergedConfig.wrapperClassName;
  const resolvedControlClassName =
    controlClassName ?? mergedConfig.controlClassName;

  const normalizedOptions = useMemo(() => {
    if (Array.isArray(options) && options.length > 0) {
      return options.map(normalizeOption);
    }
    return normalizeChildrenOptions(children);
  }, [options, children]);

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const selectedValue = isControlled ? value : internalValue;

  const selectedOption = useMemo(() => {
    if (selectedValue === null || selectedValue === undefined) return null;
    return (
      normalizedOptions.find(
        (option) => String(option.value) === String(selectedValue),
      ) || null
    );
  }, [normalizedOptions, selectedValue]);

  function handleSelectChange(selected, actionMeta) {
    const nextValue = selected?.value ?? "";
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    if (typeof onChange === "function") {
      onChange(
        {
          target: {
            name,
            id,
            value: nextValue,
          },
        },
        selected,
        actionMeta,
      );
    }
  }

  return (
    <div className={resolvedWrapperClassName}>
      {name ? (
        <input type="hidden" name={name} value={selectedOption?.value ?? ""} />
      ) : null}
      <ReactSelect
        inputId={id}
        options={normalizedOptions}
        value={selectedOption}
        onChange={handleSelectChange}
        isSearchable={resolvedIsSearchable}
        isDisabled={resolvedIsDisabled}
        isClearable={resolvedIsClearable}
        placeholder={resolvedPlaceholder}
        noOptionsMessage={() => resolvedNoOptionsLabel}
        unstyled
        classNames={{
          control: (state) =>
            `${className || resolvedControlClassName} ${
              state.isFocused ? "ring-2 ring-primary/20" : ""
            }`,
          placeholder: () => "text-[#94a3b8]",
          menu: () =>
            "mt-1 rounded-md border border-[#e2e8f0] bg-white shadow-lg overflow-hidden z-20",
          menuList: () => "py-1",
          option: (state) =>
            `px-3 py-2 text-sm cursor-pointer ${
              state.isFocused ? "bg-[#f1f5f9]" : "bg-white"
            } ${state.isSelected ? "bg-[#e2e8f0]" : ""}`,
          singleValue: () => "text-sm",
          dropdownIndicator: () => "px-2 cursor-pointer",
          clearIndicator: () => "px-2 cursor-pointer",
          valueContainer: () => "gap-1",
          indicatorsContainer: () => "gap-1",
        }}
        {...props}
      />
    </div>
  );
}
