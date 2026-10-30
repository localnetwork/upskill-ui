import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import persistentStore from "@/lib/store/persistentStore";

const toNumber = (value) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
};
const formatNumber = (value) => toNumber(value).toLocaleString("en-PH");
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(toNumber(value));

const STAR_COLORS = {
  5: "#10b981",
  4: "#84cc16",
  3: "#f59e0b",
  2: "#f97316",
  1: "#ef4444",
};

const FAILED_STATUSES = ["FAILED", "REJECTED", "CANCELLED"];

const STATUS_SERIES = [
  { key: "paid", name: "Paid out", color: "#10b981" },
  { key: "pending", name: "Pending", color: "#f59e0b" },
  { key: "failed", name: "Failed / rejected", color: "#ef4444" },
];

const SEVERITY_STYLES = {
  high: "bg-rose-50 text-rose-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-sky-50 text-sky-700",
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function Panel({ title, subtitle, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function EmptyNote({ children }) {
  return <p className="py-10 text-center text-sm text-slate-500">{children}</p>;
}

// Mini bar strip; each bar is one course so the card has a quick visual shape.
function Spark({ values, color }) {
  const max = Math.max(...values, 1);
  if (!values.length) return <div className="h-8" />;
  return (
    <div className="flex h-8 items-end gap-[3px]">
      {values.map((value, index) => (
        <span
          key={index}
          className="w-[6px] rounded-sm"
          style={{
            height: `${Math.max(8, (value / max) * 100)}%`,
            backgroundColor: color,
            opacity: value > 0 ? 1 : 0.25,
          }}
        />
      ))}
    </div>
  );
}

function Kpi({ label, value, hint, values, color, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg text-base font-bold"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          {icon}
        </span>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-black text-slate-900">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      <div className="mt-3">
        <Spark values={values} color={color} />
      </div>
    </div>
  );
}

export default function OverviewDashboard({
  courses,
  courseStats,
  payoutRows,
  payoutSummary,
  overview,
  reviewDistribution,
  qualityRows,
}) {
  const profile = persistentStore((state) => state.profile);
  const displayName =
    profile?.firstName ||
    profile?.first_name ||
    profile?.name?.split(" ")[0] ||
    profile?.username ||
    "";

  const perCourse = useMemo(
    () =>
      courseStats.map((row) => {
        const students = toNumber(row?.overview?.total_students);
        const impressions = toNumber(row?.overview?.total_impressions);
        return {
          name: row?.title || "Course",
          students,
          revenue: toNumber(row?.overview?.total_revenue),
          impressions,
          rating: toNumber(row?.overview?.average_rating),
          reviews: toNumber(row?.overview?.total_reviews),
          newThisMonth: toNumber(row?.overview?.enrollments_this_month),
          conversion: impressions > 0 ? (students / impressions) * 100 : 0,
        };
      }),
    [courseStats],
  );

  const conversionRate =
    overview.totalImpressions > 0
      ? (overview.totalStudents / overview.totalImpressions) * 100
      : 0;

  const monthly = useMemo(() => {
    const byMonth = new Map();
    for (const row of payoutRows) {
      const at = row?.requestedAt || row?.createdAt;
      const date = new Date(at);
      if (!at || Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth.has(key)) {
        byMonth.set(key, {
          key,
          label: new Intl.DateTimeFormat("en-PH", { month: "short" }).format(date),
          paid: 0,
          pending: 0,
          failed: 0,
        });
      }
      const entry = byMonth.get(key);
      const status = String(row?.status || "").toUpperCase();
      const amount = toNumber(row?.amount);
      if (status === "EXECUTED") entry.paid += amount;
      else if (FAILED_STATUSES.includes(status)) entry.failed += amount;
      else entry.pending += amount;
    }
    return Array.from(byMonth.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-8);
  }, [payoutRows]);

  const attention = useMemo(() => {
    const items = [];
    for (const row of qualityRows) {
      if (row.score < row.max) {
        items.push({
          severity: row.score <= 2 ? "high" : "medium",
          tag: row.score <= 2 ? "Incomplete" : "Polish",
          title: `${row.name} is missing ${row.missing.join(", ")}`,
        });
      }
    }
    for (const row of perCourse) {
      if (row.reviews >= 3 && row.rating > 0 && row.rating < 4) {
        items.push({
          severity: "high",
          tag: "Low rating",
          title: `${row.name} averages ${row.rating.toFixed(1)}★ from ${row.reviews} reviews`,
        });
      }
      if (row.impressions >= 50 && row.conversion < 1) {
        items.push({
          severity: "medium",
          tag: "Conversion",
          title: `${row.name} converts ${row.conversion.toFixed(1)}% of ${formatNumber(row.impressions)} views`,
        });
      }
      if (row.students === 0 && row.impressions === 0) {
        items.push({ severity: "low", tag: "No traffic", title: `${row.name} has no views yet` });
      }
    }
    if (toNumber(payoutSummary?.availableBalance) > 0) {
      items.push({
        severity: "low",
        tag: "Payout",
        title: `${formatCurrency(payoutSummary.availableBalance)} is ready to withdraw`,
      });
    }
    const order = { high: 0, medium: 1, low: 2 };
    return items.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 6);
  }, [qualityRows, perCourse, payoutSummary]);

  const topCourses = useMemo(
    () => [...perCourse].sort((a, b) => b.students - a.students).slice(0, 5),
    [perCourse],
  );
  const maxStudents = Math.max(...topCourses.map((row) => row.students), 1);

  const ratingData = reviewDistribution.map((row) => ({
    ...row,
    star: Number(String(row.rating).replace("★", "")),
  }));
  const totalReviews = ratingData.reduce((sum, row) => sum + row.count, 0);

  const recentPayouts = useMemo(
    () =>
      [...payoutRows]
        .sort(
          (a, b) =>
            new Date(b?.requestedAt || b?.createdAt || 0) -
            new Date(a?.requestedAt || a?.createdAt || 0),
        )
        .slice(0, 5),
    [payoutRows],
  );

  const courseValues = (key) => perCourse.slice(0, 24).map((row) => row[key]);
  const needsAttentionCount = attention.filter((item) => item.severity !== "low").length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-slate-900">
          {greeting()}
          {displayName ? `, ${displayName}` : ""}
        </h2>
        <p className="text-sm text-slate-500">
          {courses.length} courses, {formatNumber(overview.totalStudents)} learners,{" "}
          {needsAttentionCount} items need attention.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Total students"
          value={formatNumber(overview.totalStudents)}
          hint={`+${formatNumber(perCourse.reduce((sum, row) => sum + row.newThisMonth, 0))} this month`}
          values={courseValues("students")}
          color="#2563eb"
          icon="👥"
        />
        <Kpi
          label="Revenue"
          value={formatCurrency(overview.totalRevenue)}
          hint={`${formatCurrency(payoutSummary?.availableBalance)} available`}
          values={courseValues("revenue")}
          color="#f59e0b"
          icon="₱"
        />
        <Kpi
          label="Average rating"
          value={`${overview.avgRating.toFixed(2)}★`}
          hint={`${formatNumber(overview.totalReviews)} reviews`}
          values={courseValues("rating")}
          color="#8b5cf6"
          icon="★"
        />
        <Kpi
          label="Conversion"
          value={`${conversionRate.toFixed(1)}%`}
          hint={`${formatNumber(overview.totalImpressions)} impressions`}
          values={courseValues("conversion")}
          color="#06b6d4"
          icon="⇄"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Earnings by month" subtitle="Payout requests grouped by status.">
          {monthly.length === 0 ? (
            <EmptyNote>No earnings recorded yet.</EmptyNote>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} />
                  <YAxis tickFormatter={formatCurrency} width={80} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  {STATUS_SERIES.map((item, index) => (
                    <Bar
                      key={item.key}
                      dataKey={item.key}
                      name={item.name}
                      stackId="status"
                      fill={item.color}
                      radius={index === STATUS_SERIES.length - 1 ? [4, 4, 0, 0] : 0}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Needs attention" subtitle="Highest priority first.">
          {attention.length === 0 ? (
            <EmptyNote>Everything looks healthy.</EmptyNote>
          ) : (
            <ul className="space-y-3">
              {attention.map((item, index) => (
                <li key={index} className="flex items-start justify-between gap-3">
                  <p className="text-sm text-slate-700">{item.title}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${SEVERITY_STYLES[item.severity]}`}
                  >
                    {item.tag}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Top courses" subtitle="Learners enrolled.">
          {topCourses.length === 0 ? (
            <EmptyNote>No courses yet.</EmptyNote>
          ) : (
            <ul className="space-y-4">
              {topCourses.map((row) => (
                <li key={row.name}>
                  <div className="mb-1 flex justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-slate-800">{row.name}</span>
                    <span className="shrink-0 text-slate-500">{formatNumber(row.students)}</span>
                  </div>
                  <div className="h-1.5 rounded bg-slate-100">
                    <div
                      className="h-1.5 rounded bg-blue-600"
                      style={{ width: `${(row.students / maxStudents) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Rating breakdown" subtitle="Reviews across all courses.">
          {totalReviews === 0 ? (
            <EmptyNote>No reviews yet.</EmptyNote>
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ratingData}
                      dataKey="count"
                      nameKey="rating"
                      innerRadius={48}
                      outerRadius={70}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {ratingData.map((row) => (
                        <Cell key={row.star} fill={STAR_COLORS[row.star]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-slate-900">{overview.avgRating.toFixed(1)}</span>
                  <span className="text-[11px] text-slate-500">{formatNumber(totalReviews)} reviews</span>
                </div>
              </div>
              <ul className="flex-1 space-y-1.5 text-sm">
                {ratingData.map((row) => (
                  <li key={row.star} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STAR_COLORS[row.star] }} />
                      {row.rating}
                    </span>
                    <span className="text-slate-500">
                      {formatNumber(row.count)} · {Math.round((row.count / totalReviews) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <Panel title="Recent payouts" subtitle="Latest requests and their status.">
          {recentPayouts.length === 0 ? (
            <EmptyNote>No payouts yet.</EmptyNote>
          ) : (
            <ul className="space-y-3">
              {recentPayouts.map((row) => {
                const status = String(row?.status || "").toUpperCase();
                const dot =
                  status === "EXECUTED"
                    ? "bg-emerald-500"
                    : FAILED_STATUSES.includes(status)
                      ? "bg-rose-500"
                      : "bg-amber-500";
                return (
                  <li key={row.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-slate-700">
                      <span className={`h-2 w-2 rounded-full ${dot}`} />
                      {formatCurrency(row.amount)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {status.charAt(0) + status.slice(1).toLowerCase()} ·{" "}
                      {new Date(row?.requestedAt || row?.createdAt).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
