import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import RevenueRangeFilter, {
  resolveRange,
  toDateKey,
} from "./RevenueRangeFilter";

const STARS = [
  { key: "star5", label: "5 stars", color: "#2e7d32" },
  { key: "star4", label: "4 stars", color: "#7cb342" },
  { key: "star3", label: "3 stars", color: "#f9a825" },
  { key: "star2", label: "2 stars", color: "#ef6c00" },
  { key: "star1", label: "1 star", color: "#c62828" },
];
const KEYS = STARS.map((s) => s.key);

const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "short" });
const DAY_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const parseKey = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const emptyTotals = () => Object.fromEntries(KEYS.map((key) => [key, 0]));

// courses: [{ id, title, daily: [{ date, star1..star5 }] }]
export default function ReviewsReport({ courses, emptyMessage }) {
  const [range, setRange] = useState("3m");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [enabled, setEnabled] = useState(
    Object.fromEntries(KEYS.map((key) => [key, true])),
  );
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);

  const { start, end, granularity } = useMemo(
    () => resolveRange(range, customStart, customEnd),
    [range, customStart, customEnd],
  );

  const series = useMemo(() => {
    if (end < start) return [];
    const byDay = new Map();
    courses.forEach((course) => {
      course.daily.forEach((entry) => {
        const current = byDay.get(entry.date) || emptyTotals();
        KEYS.forEach((key) => {
          current[key] += Number(entry[key]) || 0;
        });
        byDay.set(entry.date, current);
      });
    });

    const rows = [];
    if (granularity === "day") {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        rows.push({
          label: DAY_FMT.format(d),
          ...emptyTotals(),
          ...(byDay.get(toDateKey(d)) || {}),
        });
      }
      return rows;
    }

    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= end) {
      const row = {
        label: `${MONTH_FMT.format(cursor)} ${cursor.getFullYear()}`,
        ...emptyTotals(),
      };
      byDay.forEach((value, key) => {
        const d = parseKey(key);
        if (
          d.getFullYear() === cursor.getFullYear() &&
          d.getMonth() === cursor.getMonth() &&
          d >= start &&
          d <= end
        ) {
          KEYS.forEach((k) => {
            row[k] += value[k];
          });
        }
      });
      rows.push(row);
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return rows;
  }, [courses, start, end, granularity]);

  const totals = useMemo(
    () =>
      Object.fromEntries(
        KEYS.map((key) => [key, series.reduce((sum, row) => sum + row[key], 0)]),
      ),
    [series],
  );

  const tableRows = useMemo(
    () =>
      courses
        .map((course) => {
          const row = { id: course.id, title: course.title, ...emptyTotals() };
          course.daily.forEach((entry) => {
            const d = parseKey(entry.date);
            if (d >= start && d <= end) {
              KEYS.forEach((key) => {
                row[key] += Number(entry[key]) || 0;
              });
            }
          });
          row.total = KEYS.reduce((sum, key) => sum + row[key], 0);
          return row;
        })
        .sort((a, b) => b.total - a.total),
    [courses, start, end],
  );

  const pageCount = Math.max(1, Math.ceil(tableRows.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visibleRows = tableRows.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize,
  );

  const toggle = (key) =>
    setEnabled((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      return KEYS.some((k) => next[k]) ? next : prev;
    });

  if (!courses.length) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        {emptyMessage || "No reviews yet."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <RevenueRangeFilter
        range={range}
        customStart={customStart}
        customEnd={customEnd}
        onChange={(nextRange, s, e) => {
          setRange(nextRange);
          setCustomStart(s || "");
          setCustomEnd(e || "");
          setPage(0);
        }}
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid grid-cols-2 border-b border-slate-200 sm:grid-cols-3 lg:grid-cols-5">
          {STARS.map((star) => {
            const active = enabled[star.key];
            return (
              <button
                key={star.key}
                type="button"
                onClick={() => toggle(star.key)}
                aria-pressed={active}
                className={`px-5 py-4 text-left transition-colors ${
                  active ? "text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
                style={active ? { background: star.color } : undefined}
              >
                <span className="flex items-center gap-2 text-sm">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-sm border text-[11px] leading-none ${
                      active ? "border-white bg-white" : "border-slate-400"
                    }`}
                    style={active ? { color: star.color } : undefined}
                    aria-hidden="true"
                  >
                    {active ? "✓" : ""}
                  </span>
                  {star.label}
                </span>
                <span className="mt-1 block text-4xl font-light">
                  {totals[star.key].toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        <div className="h-80 px-2 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ left: 4, right: 4 }}>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: "#9ca3af" }}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                minTickGap={24}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={44}
                tick={{ fontSize: 11, fill: "#6b7280" }}
              />
              <Tooltip />
              {STARS.map((star) =>
                enabled[star.key] ? (
                  <Line
                    key={star.key}
                    type="linear"
                    dataKey={star.key}
                    name={star.label}
                    stroke={star.color}
                    strokeWidth={2}
                    dot={series.length <= 31}
                  />
                ) : null,
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="px-6 py-4 font-medium">Reviews by course</th>
              {STARS.map((star) => (
                <th key={star.key} className="px-4 py-4 text-right font-medium">
                  {star.label}
                </th>
              ))}
              <th className="px-6 py-4 text-right font-semibold text-slate-800">
                ↓ Total
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-6 py-4 text-slate-800">{row.title}</td>
                {STARS.map((star) => (
                  <td
                    key={star.key}
                    className="px-4 py-4 text-right"
                    style={{ color: star.color }}
                  >
                    {row[star.key].toLocaleString()}
                  </td>
                ))}
                <td className="px-6 py-4 text-right text-slate-800">
                  {row.total.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-end gap-6 px-6 py-3 text-xs text-slate-500">
          <label className="flex items-center gap-2">
            Rows per page:
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="rounded border border-transparent bg-transparent py-1 text-slate-700"
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <span>
            {tableRows.length === 0 ? 0 : safePage * pageSize + 1}-
            {Math.min(tableRows.length, safePage * pageSize + pageSize)} of{" "}
            {tableRows.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous page"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
              className="rounded-full p-1 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next page"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage(safePage + 1)}
              className="rounded-full p-1 hover:bg-slate-100 disabled:text-slate-300 disabled:hover:bg-transparent"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
