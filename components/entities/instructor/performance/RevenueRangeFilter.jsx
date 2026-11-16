import { useEffect, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

export const QUICK_RANGES = [
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "28d", label: "28 days" },
  { value: "3m", label: "3 months" },
];

const MORE_RANGES = [
  { value: "6m", label: "Last 6 months" },
  { value: "12m", label: "Last 12 months" },
  { value: "custom", label: "Custom" },
];

const pad = (n) => String(n).padStart(2, "0");
export const toDateKey = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const parseDateKey = (key) => {
  const [y, m, d] = String(key).split("-").map(Number);
  return new Date(y, m - 1, d);
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "short" });
const DAY_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

// Resolves a range selection to { start, end, granularity }.
export function resolveRange(range, customStart, customEnd, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthsBack = (n) =>
    new Date(today.getFullYear(), today.getMonth() - (n - 1), 1);

  switch (range) {
    case "24h":
      return { start: today, end: today, granularity: "day" };
    case "7d":
      return { start: addDays(today, -6), end: today, granularity: "day" };
    case "28d":
      return { start: addDays(today, -27), end: today, granularity: "day" };
    case "3m":
      return { start: monthsBack(3), end: today, granularity: "month" };
    case "6m":
      return { start: monthsBack(6), end: today, granularity: "month" };
    case "12m":
      return { start: monthsBack(12), end: today, granularity: "month" };
    default: {
      const start = customStart ? parseDateKey(customStart) : addDays(today, -27);
      const end = customEnd ? parseDateKey(customEnd) : today;
      const spanDays = Math.round((end - start) / 86400000);
      return {
        start,
        end,
        granularity: spanDays > 92 ? "month" : "day",
      };
    }
  }
}

// dailyMap: Map<"YYYY-MM-DD", revenue>
export function buildRevenueSeries(dailyMap, range, customStart, customEnd) {
  const { start, end, granularity } = resolveRange(range, customStart, customEnd);
  if (end < start) return [];

  if (granularity === "day") {
    const rows = [];
    for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
      rows.push({
        label: DAY_FMT.format(d),
        revenue: dailyMap.get(toDateKey(d)) || 0,
      });
    }
    return rows;
  }

  const rows = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    let revenue = 0;
    dailyMap.forEach((value, key) => {
      const d = parseDateKey(key);
      if (d.getFullYear() === y && d.getMonth() === m && d >= start && d <= end) {
        revenue += value;
      }
    });
    rows.push({ label: `${MONTH_FMT.format(cursor)} ${y}`, revenue });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return rows;
}

export function describeRange(range, customStart, customEnd) {
  const quick = QUICK_RANGES.find((r) => r.value === range);
  if (quick) return quick.label;
  if (range === "custom") return `${customStart || "…"} – ${customEnd || "…"}`;
  return MORE_RANGES.find((r) => r.value === range)?.label || "More";
}

function DateRangeDialog({ range, customStart, customEnd, onApply, onClose }) {
  const [draft, setDraft] = useState(
    QUICK_RANGES.some((r) => r.value === range) ? "6m" : range,
  );
  const [start, setStart] = useState(customStart);
  const [end, setEnd] = useState(customEnd);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const customInvalid =
    draft === "custom" && (!start || !end || end < start);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Date range"
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <h2 className="text-2xl text-slate-900">Date range</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 border-b border-slate-200 pb-1 text-sm font-semibold text-primary">
          Filter
        </div>

        <div className="mt-4 space-y-1">
          {MORE_RANGES.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-2.5 text-slate-800 hover:bg-slate-50"
            >
              <input
                type="radio"
                name="revenue-range"
                value={option.value}
                checked={draft === option.value}
                onChange={() => setDraft(option.value)}
                className="h-5 w-5 accent-[#0052cc]"
              />
              {option.label}
            </label>
          ))}
        </div>

        {draft === "custom" ? (
          <div className="mt-2 flex items-center gap-2">
            <label className="flex-1 text-xs text-slate-500">
              Start date
              <input
                type="date"
                value={start}
                max={end || undefined}
                onChange={(e) => setStart(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-400 px-3 py-3 text-sm text-slate-900"
              />
            </label>
            <span className="pt-5 text-slate-500">-</span>
            <label className="flex-1 text-xs text-slate-500">
              End date
              <input
                type="date"
                value={end}
                min={start || undefined}
                onChange={(e) => setEnd(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-400 px-3 py-3 text-sm text-slate-900"
              />
            </label>
          </div>
        ) : null}

        <div className="mt-8 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-primary hover:bg-blue-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={customInvalid}
            onClick={() => onApply(draft, start, end)}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RevenueRangeFilter({
  range,
  customStart,
  customEnd,
  onChange,
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const moreActive = !QUICK_RANGES.some((r) => r.value === range);

  return (
    <>
      <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 bg-white text-sm">
        {QUICK_RANGES.map((option) => {
          const active = range === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value, customStart, customEnd)}
              aria-pressed={active}
              className={`flex items-center gap-1.5 border-r border-slate-300 px-4 py-2 font-medium ${
                active
                  ? "bg-blue-100 text-primary"
                  : "text-slate-800 hover:bg-slate-50"
              }`}
            >
              {active ? <Check className="h-4 w-4" /> : null}
              {option.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className={`flex items-center gap-1.5 px-4 py-2 font-medium ${
            moreActive ? "bg-blue-100 text-primary" : "text-slate-800 hover:bg-slate-50"
          }`}
        >
          {moreActive ? <Check className="h-4 w-4" /> : null}
          {moreActive ? describeRange(range, customStart, customEnd) : "More"}
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {dialogOpen ? (
        <DateRangeDialog
          range={range}
          customStart={customStart}
          customEnd={customEnd}
          onClose={() => setDialogOpen(false)}
          onApply={(nextRange, start, end) => {
            onChange(nextRange, start, end);
            setDialogOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
