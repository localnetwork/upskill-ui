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

const IMPRESSIONS_COLOR = "#4285f4";
const VISITORS_COLOR = "#5e35b1";

export const ENGAGEMENT_METRICS = [
  { key: "impressions", label: "Impressions" },
  { key: "visitors", label: "Unique visitors" },
];

const STYLES = [
  { color: IMPRESSIONS_COLOR, cardActive: "bg-[#5b9bf5] text-white" },
  { color: VISITORS_COLOR, cardActive: "bg-[#5e35b1] text-white" },
];

const MONTH_FMT = new Intl.DateTimeFormat("en-US", { month: "short" });
const DAY_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const formatPeso = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatCompact = (value) =>
  new Intl.NumberFormat("en-US", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 2,
  }).format(value || 0);

const parseKey = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// courses: [{ id, title, daily: [{ date, impressions, visitors }] }]
function sumInRange(daily, start, end, keys) {
  const totals = { [keys[0]]: 0, [keys[1]]: 0 };
  daily.forEach((entry) => {
    const d = parseKey(entry.date);
    if (d >= start && d <= end) {
      keys.forEach((key) => {
        totals[key] += Number(entry[key]) || 0;
      });
    }
  });
  return totals;
}

export default function EngagementReport({
  courses,
  emptyMessage,
  metrics = ENGAGEMENT_METRICS,
  tableTitle = "Top courses",
  showConversion = false,
  hideTable = false,
}) {
  const [k1, k2] = [metrics[0].key, metrics[1].key];
  const keys = [k1, k2];
  const [range, setRange] = useState("3m");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [enabled, setEnabled] = useState({ [metrics[0].key]: true, [metrics[1].key]: true });
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);

  const { start, end, granularity } = useMemo(
    () => resolveRange(range, customStart, customEnd),
    [range, customStart, customEnd],
  );

  const series = useMemo(() => {
    const byDay = new Map();
    courses.forEach((course) => {
      course.daily.forEach((entry) => {
        const current = byDay.get(entry.date) || { [k1]: 0, [k2]: 0 };
        current[k1] += Number(entry[k1]) || 0;
        current[k2] += Number(entry[k2]) || 0;
        byDay.set(entry.date, current);
      });
    });
    if (end < start) return [];

    const rows = [];
    if (granularity === "day") {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const value = byDay.get(toDateKey(d));
        rows.push({
          label: DAY_FMT.format(d),
          [k1]: value?.[k1] || 0,
          [k2]: value?.[k2] || 0,
        });
      }
      return rows;
    }

    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= end) {
      let v1 = 0;
      let v2 = 0;
      byDay.forEach((value, key) => {
        const d = parseKey(key);
        if (
          d.getFullYear() === cursor.getFullYear() &&
          d.getMonth() === cursor.getMonth() &&
          d >= start &&
          d <= end
        ) {
          v1 += value[k1];
          v2 += value[k2];
        }
      });
      rows.push({
        label: `${MONTH_FMT.format(cursor)} ${cursor.getFullYear()}`,
        [k1]: v1,
        [k2]: v2,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return rows;
  }, [courses, start, end, granularity, k1, k2]);

  const totals = useMemo(
    () => ({
      [k1]: series.reduce((sum, row) => sum + row[k1], 0),
      [k2]: series.reduce((sum, row) => sum + row[k2], 0),
    }),
    [series, k1, k2],
  );

  const tableRows = useMemo(
    () =>
      courses
        .map((course) => ({
          id: course.id,
          title: course.title,
          ...sumInRange(course.daily, start, end, keys),
        }))
        .sort((a, b) => b[k1] - a[k1]),
    [courses, start, end, k1, k2],
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
      return next[k1] || next[k2] ? next : prev;
    });

  if (!courses.length) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        {emptyMessage || "No data yet."}
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
        <div className="flex flex-wrap border-b border-slate-200">
          {metrics.map((rawMetric, index) => {
            const metric = { ...rawMetric, ...STYLES[index] };
            const active = enabled[metric.key];
            return (
              <button
                key={metric.key}
                type="button"
                onClick={() => toggle(metric.key)}
                aria-pressed={active}
                className={`min-w-[180px] px-5 py-4 text-left transition-colors ${
                  active ? metric.cardActive : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-2 text-sm">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-sm border text-[11px] leading-none ${
                      active ? "border-white bg-white" : "border-slate-400"
                    }`}
                    style={active ? { color: metric.color } : undefined}
                    aria-hidden="true"
                  >
                    {active ? "✓" : ""}
                  </span>
                  {metric.label}
                </span>
                <span className="mt-1 block text-4xl font-light">
                  {metric.currency ? formatPeso(totals[metric.key]) : formatCompact(totals[metric.key])}
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
                yAxisId="left"
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={metrics[0].currency ? 84 : 44}
                tick={{ fontSize: 11, fill: IMPRESSIONS_COLOR }}
                tickFormatter={metrics[0].currency ? formatPeso : undefined}
                hide={!enabled[k1]}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={44}
                tick={{ fontSize: 11, fill: VISITORS_COLOR }}
                tickFormatter={metrics[1].currency ? formatPeso : undefined}
                hide={!enabled[k2]}
              />
              <Tooltip
                formatter={(value, name) =>
                  metrics.find((m) => m.label === name)?.currency
                    ? formatPeso(value)
                    : value
                }
              />
              {enabled[k1] ? (
                <Line
                  yAxisId="left"
                  type="linear"
                  dataKey={k1}
                  name={metrics[0].label}
                  stroke={IMPRESSIONS_COLOR}
                  strokeWidth={2}
                  dot={series.length <= 31}
                />
              ) : null}
              {enabled[k2] ? (
                <Line
                  yAxisId="right"
                  type="linear"
                  dataKey={k2}
                  name={metrics[1].label}
                  stroke={VISITORS_COLOR}
                  strokeWidth={2}
                  dot={series.length <= 31}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {hideTable ? null : (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="px-6 py-4 font-medium">{tableTitle}</th>
              <th className="px-6 py-4 text-right font-semibold text-slate-800">
                ↓ {metrics[0].label}
              </th>
              <th className="px-6 py-4 text-right font-medium">{metrics[1].label}</th>
              {showConversion ? (
                <th className="px-6 py-4 text-right font-medium">Conversion</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 hover:bg-slate-50"
              >
                <td className="px-6 py-4 text-slate-800">{row.title}</td>
                <td
                  className="px-6 py-4 text-right"
                  style={{ color: IMPRESSIONS_COLOR }}
                >
                  {row[k1].toLocaleString()}
                </td>
                <td
                  className="px-6 py-4 text-right"
                  style={{ color: VISITORS_COLOR }}
                >
                  {row[k2].toLocaleString()}
                </td>
                {showConversion ? (
                  <td className="px-6 py-4 text-right text-slate-700">
                    {row[k1] > 0 ? `${((row[k2] / row[k1]) * 100).toFixed(2)}%` : "0%"}
                  </td>
                ) : null}
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
      )}
    </div>
  );
}
