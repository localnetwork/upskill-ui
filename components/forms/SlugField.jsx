import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";

function slugify(value = "", maxLength = 150) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, maxLength);
}

function toStableSlugBase(value = "", maxLength = 150) {
  const normalized = slugify(value, maxLength);
  if (!normalized) return "";

  const withoutYearSuffix = normalized.replace(/(?:-(?:19|20)\d{2})+$/g, "");
  const withoutNumericSuffix = withoutYearSuffix.replace(/(?:-\d+)+$/g, "");

  let base = withoutNumericSuffix;
  const knownSuffixes = [
    "course",
    "basics",
    "guide",
    "masterclass",
    "for-beginners",
  ];

  let changed = true;
  while (changed && base) {
    changed = false;
    for (const suffix of knownSuffixes) {
      const postfix = `-${suffix}`;
      if (base.endsWith(postfix)) {
        base = base.slice(0, -postfix.length);
        changed = true;
      }
    }
  }

  return base || normalized;
}

function buildSlugSuggestions(sourceValue = "", currentValue = "", maxLength = 150) {
  const fromTitle = slugify(sourceValue, maxLength);
  const fromCurrent = slugify(currentValue, maxLength);
  const titleBase = toStableSlugBase(fromTitle, maxLength);
  const currentBase = toStableSlugBase(fromCurrent, maxLength);
  const base = titleBase || currentBase;

  const suffixes = ["course", "basics", "guide", "masterclass", "for-beginners"];
  const suggestions = [
    fromTitle,
    fromCurrent,
    currentBase && currentBase !== fromTitle && currentBase !== fromCurrent
      ? currentBase
      : "",
    base ? `${base}-${new Date().getFullYear()}` : "",
    base ? `${base}-1` : "",
    ...suffixes.map((suffix) => (base ? `${base}-${suffix}` : "")),
  ]
    .map((item) => slugify(item, maxLength))
    .filter(Boolean);

  return Array.from(new Set(suggestions)).slice(0, 8);
}

export default function SlugField({
  label = "Slug",
  value = "",
  sourceValue = "",
  placeholder = "my-slug",
  maxLength = 150,
  disabled = false,
  resetKey = "",
  onChange,
  onStatusChange,
  checkAvailability,
  enableCustomizeToggle = false,
  customizeLabel = "Customize slug",
}) {
  const [isAutoMode, setIsAutoMode] = useState(!value);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [status, setStatus] = useState({
    isChecking: false,
    isAvailable: true,
    isValid: true,
    message: "",
  });

  const requestIdRef = useRef(0);
  const normalizedValue = useMemo(() => slugify(value, maxLength), [value, maxLength]);
  const suggestedSlug = useMemo(
    () => toStableSlugBase(sourceValue || "", maxLength) || slugify(sourceValue || "", maxLength),
    [sourceValue, maxLength],
  );
  const suggestionOptions = useMemo(
    () => buildSlugSuggestions(sourceValue, normalizedValue, maxLength),
    [sourceValue, normalizedValue, maxLength],
  );
  const inputDisabled = disabled || (enableCustomizeToggle && !isCustomMode);

  useEffect(() => {
    setIsAutoMode(!value);
  }, [resetKey]);

  useEffect(() => {
    if (!enableCustomizeToggle) return;
    if (!isCustomMode) return;
    if (!value) {
      setIsAutoMode(true);
    }
  }, [value, enableCustomizeToggle, isCustomMode]);

  useEffect(() => {
    if (enableCustomizeToggle) return;
    setIsAutoMode(!value);
  }, [value, enableCustomizeToggle]);

  useEffect(() => {
    if (!enableCustomizeToggle) {
      setIsCustomMode(false);
    }
  }, [enableCustomizeToggle]);

  useEffect(() => {
    setIsCustomMode(false);
  }, [resetKey]);

  useEffect(() => {
    if (normalizedValue === String(value || "")) return;
    onChange?.(normalizedValue);
  }, [normalizedValue, onChange, value]);

  useEffect(() => {
    if (enableCustomizeToggle) {
      if (isCustomMode) return;
      if (suggestedSlug === normalizedValue) return;
      onChange?.(suggestedSlug);
      return;
    }

    if (!isAutoMode) return;
    if (!suggestedSlug) return;
    if (suggestedSlug === normalizedValue) return;
    onChange?.(suggestedSlug);
  }, [
    enableCustomizeToggle,
    isCustomMode,
    isAutoMode,
    suggestedSlug,
    normalizedValue,
    onChange,
  ]);

  useEffect(() => {
    let nextStatus = null;

    if (!normalizedValue) {
      nextStatus = {
        isChecking: false,
        isAvailable: true,
        isValid: false,
        message: "Slug is required.",
      };
    } else if (normalizedValue.length > maxLength) {
      nextStatus = {
        isChecking: false,
        isAvailable: true,
        isValid: false,
        message: `Slug must be ${maxLength} characters or fewer.`,
      };
    } else {
      nextStatus = {
        isChecking: false,
        isAvailable: true,
        isValid: true,
        message: "",
      };
    }

    setStatus(nextStatus);
    onStatusChange?.(nextStatus);
  }, [normalizedValue, maxLength, onStatusChange]);

  useEffect(() => {
    if (!checkAvailability) return;
    if (!normalizedValue || normalizedValue.length > maxLength) return;

    const timeout = setTimeout(async () => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      const checkingState = {
        isChecking: true,
        isAvailable: true,
        isValid: true,
        message: "Checking slug availability...",
      };
      setStatus(checkingState);
      onStatusChange?.(checkingState);

      try {
        const result = await checkAvailability(normalizedValue);
        if (requestId !== requestIdRef.current) return;

        const available = Boolean(result?.isAvailable);
        const doneState = {
          isChecking: false,
          isAvailable: available,
          isValid: true,
          message: available ? "Slug is available." : "Slug already exists.",
        };
        setStatus(doneState);
        onStatusChange?.(doneState);
      } catch (_error) {
        if (requestId !== requestIdRef.current) return;

        const errorState = {
          isChecking: false,
          isAvailable: true,
          isValid: false,
          message: "Unable to validate slug right now.",
        };
        setStatus(errorState);
        onStatusChange?.(errorState);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [normalizedValue, maxLength, onStatusChange, checkAvailability]);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </label>
        {enableCustomizeToggle ? (
          <button
            type="button"
            disabled={disabled || !suggestedSlug}
            onClick={() => {
              if (isCustomMode) {
                setIsCustomMode(false);
                setIsAutoMode(true);
                onChange?.(suggestedSlug);
                return;
              }
              setIsCustomMode(true);
            }}
            className="text-xs font-semibold text-[#0056d2] disabled:opacity-50"
          >
            {isCustomMode ? "Use auto slug" : customizeLabel}
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled || !suggestedSlug}
            onClick={() => {
              setIsAutoMode(true);
              onChange?.(suggestedSlug);
            }}
            className="text-xs font-semibold text-[#0056d2] disabled:opacity-50"
          >
            Auto suggest
          </button>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          value={normalizedValue}
          onChange={(event) => {
            if (enableCustomizeToggle && !isCustomMode) return;
            setIsAutoMode(false);
            onChange?.(slugify(event.target.value, maxLength));
          }}
          className={`w-full rounded-md border border-slate-300 px-3 py-2 pr-10 text-sm outline-none ${
            inputDisabled ? "opacity-50" : ""
          }`}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={inputDisabled}
          required
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {status.isChecking ? (
            <Loader2 size={16} className="text-slate-400 animate-spin" />
          ) : status.isValid && status.isAvailable && normalizedValue ? (
            <Check size={16} className="text-emerald-600" />
          ) : status.message ? (
            <X size={16} className="text-rose-600" />
          ) : null}
        </span>
      </div>

      {!enableCustomizeToggle && suggestionOptions.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestionOptions.map((option) => (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => {
                setIsAutoMode(false);
                onChange?.(option);
              }}
              className={`rounded-full border px-2.5 py-1 text-xs ${
                option === normalizedValue
                  ? "border-[#0056d2] bg-[#0056d2] text-white"
                  : "border-slate-300 text-slate-600 hover:border-[#0056d2] hover:text-[#0056d2]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-1 flex items-center justify-between gap-2 text-xs">
        <span
          className={
            status.isValid
              ? status.isAvailable
                ? "text-emerald-600"
                : "text-rose-600"
              : "text-rose-600"
          }
        >
          {status.message || " "}
        </span>
        <span className="text-slate-400">
          {normalizedValue.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}
