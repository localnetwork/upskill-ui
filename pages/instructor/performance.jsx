import { useEffect, useMemo, useState } from "react";
import InstructorLayout from "@/components/partials/InstructorLayout";
import BaseApi from "@/lib/api/_base.api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "revenue", label: "Revenue" },
  { id: "students", label: "Students" },
  { id: "reviews", label: "Reviews" },
  { id: "engagement", label: "Course engagement" },
  { id: "coding", label: "Coding exercise insights" },
  { id: "practice", label: "Practice test insights" },
  { id: "content_quality", label: "Content Quality", badge: "New" },
  { id: "traffic", label: "Traffic & conversion" },
];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

function formatMonth(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function monthKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function Card({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function shorten(text, max = 26) {
  const value = String(text || "");
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function Empty({ children }) {
  return <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">{children}</p>;
}

function Section({ title, description, children }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

// Per-course comparison: one row per course with its full name, same unit on every series.
function CourseBars({ data, series, formatter }) {
  if (!data.length) return <Empty>No data yet.</Empty>;
  return (
    <div style={{ height: data.length * (series.length > 1 ? 56 : 38) + 50 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" allowDecimals={false} tickFormatter={formatter} />
          <YAxis
            type="category"
            dataKey="name"
            width={170}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => shorten(value)}
          />
          <Tooltip formatter={formatter ? (value) => formatter(value) : undefined} />
          {series.length > 1 ? <Legend /> : null}
          {series.map((item) => (
            <Bar key={item.key} dataKey={item.key} name={item.name} fill={item.color} radius={[0, 3, 3, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ScoreBar({ value, max, color = "bg-blue-600" }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded bg-slate-100">
      <div className={`h-2 rounded ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [courseStats, setCourseStats] = useState([]);
  const [payoutRows, setPayoutRows] = useState([]);
  const [payoutSummary, setPayoutSummary] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const authoredRes = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/authored`,
          { params: { page: 1, limit: 200 } },
        );
        const authoredCourses = asArray(authoredRes?.data?.data);
        setCourses(authoredCourses);

        const statsRows = await Promise.all(
          authoredCourses.slice(0, 25).map(async (course) => {
            try {
              const response = await BaseApi.get(
                `${process.env.NEXT_PUBLIC_API_URL}/courses/${encodeURIComponent(course.slug)}/statistics`,
              );
              return {
                courseId: course.id,
                title: course.title,
                slug: course.slug,
                ...response?.data?.data,
              };
            } catch (_error) {
              return null;
            }
          }),
        );
        setCourseStats(statsRows.filter(Boolean));

        const [summaryRes, payoutsRes] = await Promise.all([
          BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/payouts/summary`),
          BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/payouts/my`, {
            params: { page: 1, limit: 200 },
          }),
        ]);

        setPayoutSummary(summaryRes?.data?.data || null);
        setPayoutRows(asArray(payoutsRes?.data?.data));
      } catch (_error) {
        setCourses([]);
        setCourseStats([]);
        setPayoutRows([]);
        setPayoutSummary(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const overview = useMemo(() => {
    const totalStudents = courseStats.reduce(
      (sum, row) => sum + toNumber(row?.overview?.total_students),
      0,
    );
    const totalRevenue = courseStats.reduce(
      (sum, row) => sum + toNumber(row?.overview?.total_revenue),
      0,
    );
    const totalImpressions = courseStats.reduce(
      (sum, row) => sum + toNumber(row?.overview?.total_impressions),
      0,
    );
    const totalUniqueVisitors = courseStats.reduce(
      (sum, row) => sum + toNumber(row?.overview?.unique_impression_visitors),
      0,
    );
    const totalReviews = courseStats.reduce(
      (sum, row) => sum + toNumber(row?.overview?.total_reviews),
      0,
    );
    const weightedRatingSum = courseStats.reduce(
      (sum, row) =>
        sum +
        toNumber(row?.overview?.average_rating) * toNumber(row?.overview?.total_reviews),
      0,
    );
    const avgRating = totalReviews ? weightedRatingSum / totalReviews : 0;

    return {
      totalStudents,
      totalRevenue,
      totalImpressions,
      totalUniqueVisitors,
      totalReviews,
      avgRating,
    };
  }, [courseStats]);

  const topCoursesByRevenue = useMemo(
    () =>
      courseStats
        .map((row) => ({
          name: row?.title || "Course",
          revenue: toNumber(row?.overview?.total_revenue),
          students: toNumber(row?.overview?.total_students),
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8),
    [courseStats],
  );

  const revenueTrend = useMemo(() => {
    const byMonth = new Map();
    for (const row of payoutRows) {
      const requestedAt = row?.requestedAt || row?.createdAt;
      if (!requestedAt) continue;
      const key = monthKey(requestedAt);
      if (!byMonth.has(key)) {
        byMonth.set(key, {
          key,
          label: formatMonth(requestedAt),
          earnings: 0,
          payouts: 0,
        });
      }
      const current = byMonth.get(key);
      current.earnings += toNumber(row?.amount);
      if (["APPROVED", "EXECUTED"].includes(String(row?.status || "").toUpperCase())) {
        current.payouts += toNumber(row?.amount);
      }
    }

    return Array.from(byMonth.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-12)
      .map((row) => ({
        ...row,
        earnings: Number(row.earnings.toFixed(2)),
        payouts: Number(row.payouts.toFixed(2)),
      }));
  }, [payoutRows]);

  const studentsByCourse = useMemo(
    () =>
      courseStats
        .map((row) => ({
          name: row?.title || "Course",
          students: toNumber(row?.overview?.total_students),
          newEnrollments: toNumber(row?.overview?.enrollments_this_month),
        }))
        .sort((a, b) => b.students - a.students)
        .slice(0, 10),
    [courseStats],
  );

  const reviewDistribution = useMemo(() => {
    const buckets = new Map([
      [5, 0],
      [4, 0],
      [3, 0],
      [2, 0],
      [1, 0],
    ]);

    for (const row of courseStats) {
      for (const bucket of asArray(row?.distribution?.rating_distribution)) {
        const key = Number(bucket?.rating);
        if (!buckets.has(key)) continue;
        buckets.set(key, buckets.get(key) + toNumber(bucket?.count));
      }
    }

    return Array.from(buckets.entries())
      .map(([rating, count]) => ({
        rating: `${rating}★`,
        count,
      }))
      .sort((a, b) => Number(b.rating.replace("★", "")) - Number(a.rating.replace("★", "")));
  }, [courseStats]);

  const engagementRows = useMemo(
    () =>
      courseStats
        .map((row) => ({
          name: row?.title || "Course",
          impressions: toNumber(row?.overview?.total_impressions),
          visitors: toNumber(row?.overview?.unique_impression_visitors),
        }))
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 10),
    [courseStats],
  );

  const codingRows = useMemo(
    () =>
      courses
        .map((course) => {
          const sections = asArray(course?.sections);
          const lessons = sections.flatMap((section) => asArray(section?.lessons));
          const codingExercises = lessons.filter(
            (lesson) => String(lesson?.type || "").toUpperCase() === "CODING_EXERCISE",
          ).length;
          const videos = lessons.filter(
            (lesson) => String(lesson?.type || "").toUpperCase() === "VIDEO",
          ).length;
          return {
            name: course?.title || "Course",
            codingExercises,
            videos,
          };
        })
        .filter((row) => row.codingExercises > 0 || row.videos > 0)
        .sort((a, b) => b.codingExercises - a.codingExercises)
        .slice(0, 10),
    [courses],
  );

  const practiceRows = useMemo(
    () =>
      courses
        .map((course) => {
          const sections = asArray(course?.sections);
          const lessons = sections.flatMap((section) => asArray(section?.lessons));
          const quizCount = lessons.filter(
            (lesson) => String(lesson?.type || "").toUpperCase() === "QUIZ",
          ).length;
          return {
            name: course?.title || "Course",
            quizzes: quizCount,
            reviews: toNumber(course?.stats?.total_reviews),
          };
        })
        .filter((row) => row.quizzes > 0)
        .sort((a, b) => b.quizzes - a.quizzes)
        .slice(0, 10),
    [courses],
  );

  const qualityRows = useMemo(
    () =>
      courses
        .map((course) => {
          const hasSubtitle = String(course?.subtitle || "").trim().length > 0 ? 1 : 0;
          const hasDescription = String(course?.description || "").trim().length > 0 ? 1 : 0;
          const hasPromo = course?.promo_video?.path ? 1 : 0;
          const goalsCount = asArray(course?.goals?.what_you_will_learn_data).length > 0 ? 1 : 0;
          const sections = toNumber(course?.resources_count?.section_count) > 0 ? 1 : 0;
          const checks = [
            ["Subtitle", hasSubtitle],
            ["Description", hasDescription],
            ["Promo video", hasPromo],
            ["Learning goals", goalsCount],
            ["Sections", sections],
          ];
          const score = checks.reduce((sum, [, ok]) => sum + ok, 0);
          return {
            name: course?.title || "Course",
            score,
            max: 5,
            missing: checks.filter(([, ok]) => !ok).map(([label]) => label),
          };
        })
        .sort((a, b) => a.score - b.score)
        .slice(0, 12),
    [courses],
  );

  const conversionRows = useMemo(
    () =>
      courseStats
        .map((row) => {
          const impressions = toNumber(row?.overview?.total_impressions);
          const students = toNumber(row?.overview?.total_students);
          const conversion = impressions > 0 ? (students / impressions) * 100 : 0;
          return {
            name: row?.title || "Course",
            impressions,
            students,
            conversion: Number(conversion.toFixed(2)),
          };
        })
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 10),
    [courseStats],
  );

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Performance</h1>
        <p className="text-sm text-slate-500 mb-6">
          Unified analytics across revenue, learners, reviews, and course health.
        </p>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-3 h-fit">
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    activeTab === item.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 lg:p-6 min-h-[560px]">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-28 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : activeTab === "overview" ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <Card label="Published courses" value={courses.length} />
                  <Card label="Total students" value={overview.totalStudents.toLocaleString("en-PH")} />
                  <Card label="Total reviews" value={overview.totalReviews.toLocaleString("en-PH")} />
                  <Card label="Average rating" value={overview.avgRating.toFixed(2)} />
                  <Card label="Revenue" value={formatCurrency(overview.totalRevenue)} />
                  <Card label="Impressions" value={overview.totalImpressions.toLocaleString("en-PH")} hint={`${overview.totalUniqueVisitors.toLocaleString("en-PH")} unique visitors`} />
                </div>
                <Section title="Revenue by course" description="Top courses by total revenue.">
                  <CourseBars
                    data={topCoursesByRevenue}
                    series={[{ key: "revenue", name: "Revenue", color: "#2563eb" }]}
                    formatter={(value) => formatCurrency(value)}
                  />
                </Section>
              </div>
            ) : null}

            {!isLoading && activeTab === "revenue" ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card label="Available for payout" value={formatCurrency(payoutSummary?.availableBalance)} />
                  <Card label="Recent income" value={formatCurrency(payoutSummary?.thisMonthEarnings)} />
                  <Card label="Payout cycle" value={String(payoutSummary?.payoutCycle || "ANYTIME")} />
                </div>
                <Section title="Earnings by month" description="Payout requests per month, with the amount already approved or paid.">
                  {revenueTrend.length === 0 ? (
                    <Empty>No earnings recorded yet.</Empty>
                  ) : (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="label" />
                          <YAxis tickFormatter={(value) => formatCurrency(value)} width={90} />
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Legend />
                          <Bar dataKey="earnings" name="Requested" fill="#93c5fd" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="payouts" name="Paid out" fill="#2563eb" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Section>
              </div>
            ) : null}

            {!isLoading && activeTab === "students" ? (
              <Section title="Students by course" description="Total learners and enrollments gained this month.">
                <CourseBars
                  data={studentsByCourse}
                  series={[
                    { key: "students", name: "Total students", color: "#2563eb" },
                    { key: "newEnrollments", name: "New this month", color: "#06b6d4" },
                  ]}
                />
              </Section>
            ) : null}

            {!isLoading && activeTab === "reviews" ? (
              <Section title="Rating distribution" description="Number of reviews per star rating across all your courses.">
                {reviewDistribution.every((row) => row.count === 0) ? (
                  <Empty>No reviews yet.</Empty>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reviewDistribution}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="rating" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" name="Reviews" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Section>
            ) : null}

            {!isLoading && activeTab === "engagement" ? (
              <Section title="Impressions and unique visitors" description="How often each course page was seen, and by how many people.">
                <CourseBars
                  data={engagementRows}
                  series={[
                    { key: "impressions", name: "Impressions", color: "#0ea5e9" },
                    { key: "visitors", name: "Unique visitors", color: "#22c55e" },
                  ]}
                />
              </Section>
            ) : null}

            {!isLoading && activeTab === "coding" ? (
              <Section title="Coding exercise coverage" description="Coding exercises versus video lessons in each course.">
                <CourseBars
                  data={codingRows}
                  series={[
                    { key: "codingExercises", name: "Coding exercises", color: "#7c3aed" },
                    { key: "videos", name: "Video lessons", color: "#94a3b8" },
                  ]}
                />
              </Section>
            ) : null}

            {!isLoading && activeTab === "practice" ? (
              <Section title="Practice tests" description="Number of quizzes in each course.">
                <CourseBars
                  data={practiceRows}
                  series={[{ key: "quizzes", name: "Quizzes", color: "#f97316" }]}
                />
              </Section>
            ) : null}

            {!isLoading && activeTab === "content_quality" ? (
              <Section
                title="Content quality"
                description="Each course is scored out of 5: subtitle, description, promo video, learning goals and sections. Weakest courses first."
              >
                {qualityRows.length === 0 ? (
                  <Empty>No courses yet.</Empty>
                ) : (
                  <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                    {qualityRows.map((row) => (
                      <li key={row.name} className="grid items-center gap-3 px-4 py-3 md:grid-cols-[1fr_160px_1fr]">
                        <span className="truncate text-sm font-semibold text-slate-900">{row.name}</span>
                        <div className="flex items-center gap-2">
                          <ScoreBar
                            value={row.score}
                            max={row.max}
                            color={row.score >= 4 ? "bg-emerald-600" : row.score >= 3 ? "bg-amber-500" : "bg-rose-500"}
                          />
                          <span className="w-8 text-xs font-semibold text-slate-600">{row.score}/{row.max}</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {row.missing.length ? `Missing: ${row.missing.join(", ")}` : "Complete"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            ) : null}

            {!isLoading && activeTab === "traffic" ? (
              <Section title="Traffic and conversion" description="Conversion is students divided by impressions.">
                {conversionRows.length === 0 ? (
                  <Empty>No traffic data yet.</Empty>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-2">Course</th>
                          <th className="px-4 py-2 text-right">Impressions</th>
                          <th className="px-4 py-2 text-right">Students</th>
                          <th className="px-4 py-2 w-48">Conversion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {conversionRows.map((row) => (
                          <tr key={row.name}>
                            <td className="max-w-xs truncate px-4 py-2 font-medium text-slate-900">{row.name}</td>
                            <td className="px-4 py-2 text-right">{row.impressions.toLocaleString("en-PH")}</td>
                            <td className="px-4 py-2 text-right">{row.students.toLocaleString("en-PH")}</td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <ScoreBar value={row.conversion} max={Math.max(10, ...conversionRows.map((item) => item.conversion))} color="bg-orange-500" />
                                <span className="w-12 text-right text-xs font-semibold">{row.conversion}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>
            ) : null}
          </section>
        </div>
      </div>
    </InstructorLayout>
  );
}
