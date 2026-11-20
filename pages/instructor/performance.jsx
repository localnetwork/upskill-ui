import { useEffect, useMemo, useState } from "react";
import InstructorLayout from "@/components/partials/InstructorLayout";
import BaseApi from "@/lib/api/_base.api";
import {
  BadgeCheck,
  Banknote,
  Code2,
  Eye,
  FileCheck2,
  LayoutDashboard,
  Megaphone,
  Star,
  Users,
} from "lucide-react";
import RevenueRangeFilter, {
  buildRevenueSeries,
} from "@/components/entities/instructor/performance/RevenueRangeFilter";
import EngagementReport from "@/components/entities/instructor/performance/EngagementReport";
import ReviewsReport from "@/components/entities/instructor/performance/ReviewsReport";
import OverviewDashboard from "@/components/entities/instructor/performance/OverviewDashboard";
import {
  Area,
  AreaChart,
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
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "revenue", label: "Income", icon: Banknote },
  { id: "students", label: "Students", icon: Users },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "engagement", label: "Course engagement", icon: Eye },
  { id: "coding", label: "Coding exercise insights", icon: Code2 },
  { id: "practice", label: "Practice test insights", icon: FileCheck2 },
  { id: "content_quality", label: "Content Quality", icon: BadgeCheck, badge: "New" },
  { id: "traffic", label: "Traffic & conversion", icon: Megaphone },
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
  const [revenueRange, setRevenueRange] = useState("3m");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

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

  const dailyRevenue = useMemo(() => {
    const map = new Map();
    courseStats.forEach((row) => {
      asArray(row?.trends?.daily_revenue).forEach((entry) => {
        map.set(entry.date, (map.get(entry.date) || 0) + toNumber(entry.revenue));
      });
    });
    return map;
  }, [courseStats]);

  const filteredRevenue = useMemo(
    () => buildRevenueSeries(dailyRevenue, revenueRange, customStart, customEnd),
    [dailyRevenue, revenueRange, customStart, customEnd],
  );

  const filteredRevenueTotal = filteredRevenue.reduce((sum, row) => sum + row.revenue, 0);

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

  const engagementCourses = useMemo(
    () =>
      courseStats.map((row) => ({
        id: row.courseId,
        title: row?.title || "Course",
        daily: asArray(row?.trends?.daily_engagement),
      })),
    [courseStats],
  );

  const studentsCourses = useMemo(
    () =>
      courseStats.map((row) => ({
        id: row.courseId,
        title: row?.title || "Course",
        daily: asArray(row?.trends?.daily_students),
      })),
    [courseStats],
  );

  const reviewsCourses = useMemo(
    () =>
      courseStats.map((row) => ({
        id: row.courseId,
        title: row?.title || "Course",
        daily: asArray(row?.trends?.daily_reviews),
      })),
    [courseStats],
  );

  const trafficCourses = useMemo(
    () =>
      courseStats.map((row) => {
        const byDate = new Map();
        asArray(row?.trends?.daily_engagement).forEach((entry) => {
          byDate.set(entry.date, { date: entry.date, impressions: entry.impressions, enrollments: 0 });
        });
        asArray(row?.trends?.daily_students).forEach((entry) => {
          const current = byDate.get(entry.date) || { date: entry.date, impressions: 0, enrollments: 0 };
          current.enrollments = entry.enrollments;
          byDate.set(entry.date, current);
        });
        return { id: row.courseId, title: row?.title || "Course", daily: Array.from(byDate.values()) };
      }),
    [courseStats],
  );

  const codingEngagementCourses = useMemo(() => {
    const withCoding = new Set(
      courses
        .filter((course) =>
          asArray(course?.sections)
            .flatMap((section) => asArray(section?.lessons))
            .some((lesson) => String(lesson?.type || "").toUpperCase() === "CODING_EXERCISE"),
        )
        .map((course) => course.id),
    );
    return courseStats
      .filter((row) => withCoding.has(row.courseId))
      .map((row) => ({
        id: row.courseId,
        title: row?.title || "Course",
        daily: asArray(row?.trends?.daily_coding),
      }));
  }, [courses, courseStats]);

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
          Unified analytics across income, learners, reviews, and course health.
        </p>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <nav
            aria-label="Performance sections"
            className="flex shrink-0 gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 lg:w-60 lg:flex-col lg:overflow-visible"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badge ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <section className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-5 lg:p-6 min-h-[560px]">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-28 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : activeTab === "overview" ? (
              <OverviewDashboard
                courses={courses}
                courseStats={courseStats}
                reviewDistribution={reviewDistribution}
                onViewRevenue={() => setActiveTab("revenue")}
              />
            ) : null}

            {!isLoading && activeTab === "revenue" ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card label="Available for payout" value={formatCurrency(payoutSummary?.availableBalance)} />
                  <Card label="Recent income" value={formatCurrency(payoutSummary?.thisMonthEarnings)} />
                  <Card label="Payout cycle" value={String(payoutSummary?.payoutCycle || "ANYTIME")} />
                </div>
                <Section title="Income over time" description="Net income per month from your course sales.">
                  <div className="mb-4 flex flex-wrap items-end gap-3">
                    <RevenueRangeFilter
                      range={revenueRange}
                      customStart={customStart}
                      customEnd={customEnd}
                      onChange={(range, start, end) => {
                        setRevenueRange(range);
                        setCustomStart(start || "");
                        setCustomEnd(end || "");
                      }}
                    />
                    <p className="ml-auto text-sm text-slate-500">
                      Total: <span className="font-bold text-slate-900">{formatCurrency(filteredRevenueTotal)}</span>
                    </p>
                  </div>
                  {filteredRevenueTotal <= 0 ? (
                    <Empty>No data to display</Empty>
                  ) : (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredRevenue}>
                          <defs>
                            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#0052cc" stopOpacity={0.25} />
                              <stop offset="100%" stopColor="#0052cc" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="label" tickLine={false} tick={{ fill: "#0052cc", fontSize: 12 }} />
                          <YAxis tickFormatter={(value) => formatCurrency(value)} tickLine={false} axisLine={false} width={90} tick={{ fill: "#0052cc", fontSize: 12 }} />
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Area type="monotone" dataKey="revenue" name="Income" stroke="#0052cc" strokeWidth={2} fill="url(#revenueFill)" dot={filteredRevenue.length <= 31} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Section>
              </div>
            ) : null}

            {!isLoading && activeTab === "students" ? (
              <EngagementReport
                courses={studentsCourses}
                metrics={[
                  { key: "enrollments", label: "New enrollments" },
                  { key: "completions", label: "Completions" },
                ]}
                tableTitle="Students by course"
              />
            ) : null}

            {!isLoading && activeTab === "reviews" ? (
              <ReviewsReport courses={reviewsCourses} />
            ) : null}

            {!isLoading && activeTab === "engagement" ? (
              <EngagementReport courses={engagementCourses} />
            ) : null}

            {!isLoading && activeTab === "coding" ? (
              <div className="space-y-8">
                <EngagementReport
                  courses={codingEngagementCourses}
                  metrics={[
                    { key: "learners", label: "Active learners" },
                    { key: "completions", label: "Completions" },
                  ]}
                  tableTitle="Courses with coding exercises"
                  emptyMessage="None of your courses have coding exercises yet."
                />
              <Section title="Coding exercise coverage" description="Coding exercises versus video lessons in each course.">
                <CourseBars
                  data={codingRows}
                  series={[
                    { key: "codingExercises", name: "Coding exercises", color: "#7c3aed" },
                    { key: "videos", name: "Video lessons", color: "#94a3b8" },
                  ]}
                />
              </Section>
              </div>
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
              <EngagementReport
                courses={trafficCourses}
                metrics={[
                  { key: "impressions", label: "Impressions" },
                  { key: "enrollments", label: "New enrollments" },
                ]}
                tableTitle="Traffic and conversion by course"
                showConversion
              />
            ) : null}
          </section>
        </div>
      </div>
    </InstructorLayout>
  );
}
