import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown, ChevronRight, Info } from "lucide-react";

const ACCENT = "#0052cc";

const RANGES = [
  { value: 12, label: "Last 12 months" },
  { value: 6, label: "Last 6 months" },
  { value: 3, label: "Last 3 months" },
];

const toNumber = (value) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
};
const formatNumber = (value) => toNumber(value).toLocaleString("en-PH");
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value));

const isPublished = (course) =>
  course?.isPublished === true ||
  String(
    course?.workflowStatus || course?.workflow_status || "",
  ).toUpperCase() === "PUBLISHED";

function useClickAway(ref, onAway) {
  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onAway();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onAway]);
}

function Dropdown({ label, children, buttonClassName }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickAway(ref, () => setOpen(false));
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={buttonClassName}
        aria-expanded={open}
      >
        {label}
        <ChevronDown className="h-4 w-4 shrink-0" />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-20 mt-2 max-h-[320px] min-w-[200px] max-w-[360px] overflow-y-auto rounded-lg border border-slate-200 bg-white py-2 shadow-lg">
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${
        active ? "font-bold text-slate-900" : "text-slate-600"
      }`}
    >
      {children}
    </button>
  );
}

function MenuHeading({ children }) {
  return (
    <div className="mt-1 border-t border-slate-200 px-4 pb-1 pt-3 text-sm font-bold text-slate-900">
      {children}
    </div>
  );
}

function StatCard({ title, value, caption, active, onClick, info }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border bg-white p-5 text-left transition-colors ${
        active ? "border-primary" : "border-slate-200 hover:border-slate-400"
      }`}
    >
      <p className="flex items-center gap-2 font-bold text-slate-900">
        {title}
        {info ? (
          <span title={info}>
            <Info className="h-4 w-4 text-slate-500" />
          </span>
        ) : null}
      </p>
      <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-3 text-sm text-slate-700">{caption}</p>
    </button>
  );
}

function downloadCsv(filename, rows) {
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = rows.map((row) => row.map(escape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function OverviewDashboard({
  courses = [],
  courseStats = [],
  reviewDistribution = [],
  onViewRevenue,
}) {
  const [courseId, setCourseId] = useState("all");
  const [range, setRange] = useState(12);
  const [metric, setMetric] = useState("revenue");

  const published = courses.filter(isPublished);
  const unpublished = courses.filter((course) => !isPublished(course));

  const selectedStats = useMemo(
    () =>
      courseId === "all"
        ? courseStats
        : courseStats.filter((row) => row.courseId === courseId),
    [courseStats, courseId],
  );
  const selectedCourse = courses.find((course) => course.id === courseId);

  const totals = useMemo(() => {
    const totalRevenue = selectedStats.reduce(
      (sum, row) => sum + toNumber(row?.overview?.total_revenue),
      0,
    );
    const totalEnrollments = selectedStats.reduce(
      (sum, row) => sum + toNumber(row?.overview?.total_students),
      0,
    );
    const reviews = selectedStats.reduce(
      (sum, row) => sum + toNumber(row?.overview?.total_reviews),
      0,
    );
    const ratingSum = selectedStats.reduce(
      (sum, row) =>
        sum +
        toNumber(row?.overview?.average_rating) *
          toNumber(row?.overview?.total_reviews),
      0,
    );
    return {
      totalRevenue,
      totalEnrollments,
      averageRating: reviews ? ratingSum / reviews : 0,
    };
  }, [selectedStats]);

  const monthly = useMemo(() => {
    const merged = [];
    for (const row of selectedStats) {
      (row?.trends?.monthly_activity || []).forEach((entry, index) => {
        if (!merged[index]) {
          merged[index] = { label: entry.label, revenue: 0, enrollments: 0 };
        }
        merged[index].revenue += toNumber(entry.revenue);
        merged[index].enrollments += toNumber(entry.count);
      });
    }
    return merged.filter(Boolean).slice(-range);
  }, [selectedStats, range]);

  const rangeRevenue = monthly.reduce((sum, row) => sum + row.revenue, 0);
  const rangeEnrollments = monthly.reduce(
    (sum, row) => sum + row.enrollments,
    0,
  );

  const ratingData = useMemo(() => {
    if (courseId === "all") {
      return reviewDistribution.map((row) => ({
        label: row.rating,
        count: toNumber(row.count),
      }));
    }
    const buckets = new Map([5, 4, 3, 2, 1].map((star) => [star, 0]));
    for (const row of selectedStats) {
      for (const bucket of row?.distribution?.rating_distribution || []) {
        const key = Number(bucket?.rating);
        if (buckets.has(key))
          buckets.set(key, buckets.get(key) + toNumber(bucket?.count));
      }
    }
    return Array.from(buckets.entries()).map(([star, count]) => ({
      label: `${star}★`,
      count,
    }));
  }, [courseId, selectedStats, reviewDistribution]);

  const hasData =
    metric === "revenue"
      ? monthly.some((row) => row.revenue > 0)
      : metric === "enrollments"
        ? monthly.some((row) => row.enrollments > 0)
        : ratingData.some((row) => row.count > 0);

  const exportCsv = () => {
    downloadCsv("performance-overview.csv", [
      ["Month", "Revenue", "Enrollments"],
      ...monthly.map((row) => [
        row.label,
        row.revenue.toFixed(2),
        row.enrollments,
      ]),
    ]);
  };

  const chartTitle =
    metric === "revenue"
      ? "Revenue over time"
      : metric === "enrollments"
        ? "Enrollments over time"
        : "Rating distribution";

  const courseItem = (course, close) => (
    <MenuItem
      key={course.id}
      active={courseId === course.id}
      onClick={() => {
        setCourseId(course.id);
        close();
      }}
    >
      {course.title}
    </MenuItem>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          Overview
        </h2>
        <Dropdown
          buttonClassName="flex items-center gap-2 text-2xl font-bold text-primary sm:text-3xl"
          label={
            <span className="max-w-[320px] truncate">
              {selectedCourse ? selectedCourse.title : "All courses"}
            </span>
          }
        >
          {(close) => (
            <>
              <MenuItem
                active={courseId === "all"}
                onClick={() => {
                  setCourseId("all");
                  close();
                }}
              >
                All courses
              </MenuItem>
              {published.length ? <MenuHeading>Published</MenuHeading> : null}
              {published.map((course) => courseItem(course, close))}
              {unpublished.length ? (
                <MenuHeading>Unpublished</MenuHeading>
              ) : null}
              {unpublished.map((course) => courseItem(course, close))}
            </>
          )}
        </Dropdown>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Dropdown
          buttonClassName="flex items-center gap-2 rounded-md border border-primary px-4 py-3 text-sm font-bold text-primary hover:bg-violet-50"
          label={RANGES.find((item) => item.value === range)?.label}
        >
          {(close) =>
            RANGES.map((item) => (
              <MenuItem
                key={item.value}
                active={item.value === range}
                onClick={() => {
                  setRange(item.value);
                  close();
                }}
              >
                {item.label}
              </MenuItem>
            ))
          }
        </Dropdown>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-md border border-primary px-4 py-3 text-sm font-bold text-primary hover:bg-violet-50"
        >
          Export as CSV
        </button>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <StatCard
          title="Revenue"
          value={formatCurrency(rangeRevenue)}
          caption={`${formatCurrency(totals.totalRevenue)} total revenue`}
          active={metric === "revenue"}
          onClick={() => setMetric("revenue")}
        />
        <StatCard
          title="Enrollments"
          info="New enrollments in the selected period."
          value={formatNumber(rangeEnrollments)}
          caption={`${formatNumber(totals.totalEnrollments)} total enrollments`}
          active={metric === "enrollments"}
          onClick={() => setMetric("enrollments")}
        />
        <StatCard
          title="Average ratings"
          info="Average of all reviews across the selected courses."
          value={totals.averageRating.toFixed(2)}
          caption={`${totals.averageRating.toFixed(2)} average rating`}
          active={metric === "rating"}
          onClick={() => setMetric("rating")}
        />
      </div>

      <div className="mt-5 flex min-h-[460px] flex-col rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-bold text-slate-900">{chartTitle}</h3>
        <div className="flex flex-1 items-center justify-center py-6">
          {!hasData ? (
            <p className="text-slate-500">No data to display</p>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {metric === "rating" ? (
                  <BarChart data={ratingData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} tick={{ fill: ACCENT, fontSize: 12 }} />
                    <YAxis
                      tick={{ fill: ACCENT, fontSize: 12 }}
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name="Reviews"
                      fill={ACCENT}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                ) : (
                  <AreaChart data={monthly}>
                    <defs>
                      <linearGradient
                        id="overviewFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={ACCENT}
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="100%"
                          stopColor={ACCENT}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} tick={{ fill: ACCENT, fontSize: 12 }} />
                    <YAxis
                      tick={{ fill: ACCENT, fontSize: 12 }}
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      width={metric === "revenue" ? 90 : 40}
                      tickFormatter={
                        metric === "revenue" ? formatCurrency : undefined
                      }
                    />
                    <Tooltip
                      formatter={(value) =>
                        metric === "revenue"
                          ? formatCurrency(value)
                          : formatNumber(value)
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey={metric === "revenue" ? "revenue" : "enrollments"}
                      name={metric === "revenue" ? "Revenue" : "Enrollments"}
                      stroke={ACCENT}
                      strokeWidth={2}
                      fill="url(#overviewFill)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
        {onViewRevenue ? (
          <div className="text-center">
            <button
              type="button"
              onClick={onViewRevenue}
              className="inline-flex items-center gap-2 rounded-md border border-primary px-4 py-2.5 text-sm font-bold text-primary hover:bg-violet-50"
            >
              View revenue report
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
