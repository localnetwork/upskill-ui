import { useEffect, useMemo, useState } from "react";
import InstructorLayout from "@/components/partials/InstructorLayout";
import BaseApi from "@/lib/api/_base.api";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
          const score = hasSubtitle + hasDescription + hasPromo + goalsCount + sections;
          return {
            name: course?.title || "Course",
            score,
            max: 5,
          };
        })
        .sort((a, b) => b.score - a.score)
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
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={topCoursesByRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" hide />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="#93c5fd" name="Revenue" />
                      <Area type="monotone" dataKey="students" stroke="#16a34a" fill="#86efac" name="Students" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}

            {!isLoading && activeTab === "revenue" ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card label="Available for payout" value={formatCurrency(payoutSummary?.availableBalance)} />
                  <Card label="Recent income" value={formatCurrency(payoutSummary?.thisMonthEarnings)} />
                  <Card label="Payout cycle" value={String(payoutSummary?.payoutCycle || "ANYTIME")} />
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Area type="monotone" dataKey="earnings" stroke="#2563eb" fill="#93c5fd" name="Earnings" />
                      <Area type="monotone" dataKey="payouts" stroke="#16a34a" fill="#86efac" name="Payouts" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}

            {!isLoading && activeTab === "students" ? (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900">Student distribution by course</h2>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={studentsByCourse}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" hide />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="students" stroke="#2563eb" fill="#93c5fd" name="Total students" />
                      <Area type="monotone" dataKey="newEnrollments" stroke="#06b6d4" fill="#67e8f9" name="New this month" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}

            {!isLoading && activeTab === "reviews" ? (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900">Rating distribution</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reviewDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#f59e0b" fill="#fde68a" name="Reviews" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}

            {!isLoading && activeTab === "engagement" ? (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900">Impressions vs unique visitors</h2>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={engagementRows}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" hide />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="impressions" stroke="#0ea5e9" fill="#7dd3fc" name="Impressions" />
                      <Area type="monotone" dataKey="visitors" stroke="#22c55e" fill="#86efac" name="Unique visitors" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}

            {!isLoading && activeTab === "coding" ? (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900">Coding exercise coverage</h2>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={codingRows}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" hide />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="codingExercises" stroke="#7c3aed" fill="#c4b5fd" name="Coding exercises" />
                      <Area type="monotone" dataKey="videos" stroke="#94a3b8" fill="#cbd5e1" name="Video lessons" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}

            {!isLoading && activeTab === "practice" ? (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900">Practice test insights</h2>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={practiceRows}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" hide />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="quizzes" stroke="#f97316" fill="#fdba74" name="Practice tests (quizzes)" />
                      <Area type="monotone" dataKey="reviews" stroke="#0ea5e9" fill="#7dd3fc" name="Reviews" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}

            {!isLoading && activeTab === "content_quality" ? (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900">Content quality score</h2>
                <p className="text-sm text-slate-500">
                  Score is based on subtitle, description, promo video, learning goals, and sections.
                </p>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={qualityRows}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" hide />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="score" stroke="#16a34a" fill="#86efac" name="Quality score" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}

            {!isLoading && activeTab === "traffic" ? (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900">Traffic & conversion</h2>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={conversionRows}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" hide />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="impressions" stroke="#0ea5e9" name="Impressions" />
                      <Line yAxisId="left" type="monotone" dataKey="students" stroke="#16a34a" name="Students" />
                      <Line yAxisId="right" type="monotone" dataKey="conversion" stroke="#f97316" name="Conversion %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </InstructorLayout>
  );
}
