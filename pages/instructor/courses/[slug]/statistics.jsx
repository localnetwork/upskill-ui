import CourseManagementLayout from "@/components/partials/CourseManagementLayout";
import BaseApi from "@/lib/api/_base.api";
import { setContext } from "@/lib/api/interceptor";
import { useEffect, useMemo, useState } from "react";
import EngagementReport from "@/components/entities/instructor/performance/EngagementReport";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export async function getServerSideProps(context) {
  const { slug } = context.params;
  setContext(context);

  try {
    const response = await BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/courses/${slug}/manage`,
    );
    return {
      props: {
        course: response?.data?.data || null,
      },
    };
  } catch (_error) {
    return { notFound: true };
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

const STAT_TABS = [
  { id: "revenue", label: "Revenue" },
  { id: "enrollments", label: "Enrollments" },
  { id: "ratings", label: "Ratings" },
  { id: "engagement", label: "Course engagement" },
];

export default function CourseStatisticsManagement({ course }) {
  const [activeStat, setActiveStat] = useState("revenue");
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    overview: {
      total_students: 0,
      enrollments_this_month: 0,
      completed_students: 0,
      completion_rate_pct: 0,
      average_progress_pct: 0,
      average_rating: 0,
      total_reviews: 0,
      total_revenue: 0,
      revenue_this_month: 0,
      total_impressions: 0,
      unique_impression_visitors: 0,
    },
    distribution: {
      rating_distribution: [],
    },
    trends: {
      monthly_enrollments: [],
    },
  });

  useEffect(() => {
    const fetchStatistics = async () => {
      if (!course?.slug) return;
      setIsLoading(true);
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/${course.slug}/statistics`,
        );
        setStats(
          response?.data?.data || {
            overview: {
              total_students: 0,
              enrollments_this_month: 0,
              completed_students: 0,
              completion_rate_pct: 0,
              average_progress_pct: 0,
              average_rating: 0,
              total_reviews: 0,
              total_revenue: 0,
              revenue_this_month: 0,
              total_impressions: 0,
              unique_impression_visitors: 0,
            },
            distribution: {
              rating_distribution: [],
            },
            trends: {
              monthly_enrollments: [],
            },
          },
        );
      } catch (_error) {
        setStats((prev) => prev);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, [course?.slug]);

  const cards = useMemo(
    () => [
      {
        group: "enrollments",
        label: "Total students",
        value: Number(stats?.overview?.total_students || 0),
      },
      {
        group: "enrollments",
        label: "New enrollments this month",
        value: Number(stats?.overview?.enrollments_this_month || 0),
      },
      {
        group: "enrollments",
        label: "Course completion rate",
        value: `${Math.round(Number(stats?.overview?.completion_rate_pct || 0))}%`,
      },
      {
        group: "enrollments",
        label: "Average learner progress",
        value: `${Math.round(Number(stats?.overview?.average_progress_pct || 0))}%`,
      },
      {
        group: "ratings",
        label: "Average rating",
        value: Number(stats?.overview?.average_rating || 0).toFixed(2),
      },
      {
        group: "ratings",
        label: "Total reviews",
        value: Number(stats?.overview?.total_reviews || 0),
      },
      {
        group: "revenue",
        label: "Total Income",
        value: formatCurrency(stats?.overview?.total_revenue || 0),
      },
      {
        group: "revenue",
        label: "Income this month",
        value: formatCurrency(stats?.overview?.revenue_this_month || 0),
      },
      {
        group: "engagement",
        label: "Course impression",
        value: Number(stats?.overview?.total_impressions || 0),
      },
      {
        group: "engagement",
        label: "Unique impression visitors",
        value: Number(stats?.overview?.unique_impression_visitors || 0),
      },
    ],
    [stats],
  );
  const ratingChartData = useMemo(
    () =>
      (stats?.distribution?.rating_distribution || [])
        .map((row) => ({
          label: `${row.rating}★`,
          count: Number(row.count || 0),
          percentage: Number(row.percentage || 0),
        }))
        .sort((a, b) => b.count - a.count),
    [stats],
  );
  const reportSections = useMemo(() => {
    const trends = stats?.trends || {};
    const arr = (value) => (Array.isArray(value) ? value : []);
    const merge = (a, b) => {
      const byDate = new Map();
      arr(a).forEach((row) => byDate.set(row.date, { ...row }));
      arr(b).forEach((row) =>
        byDate.set(row.date, { ...(byDate.get(row.date) || {}), ...row }),
      );
      return Array.from(byDate.values());
    };
    const id = course?.id || "course";
    const title = course?.title || "Course";
    return {
      engagement: {
        metrics: [
          { key: "impressions", label: "Impressions" },
          { key: "visitors", label: "Unique visitors" },
        ],
        courses: [{ id, title, daily: arr(trends.daily_engagement) }],
      },
      enrollments: {
        metrics: [
          { key: "enrollments", label: "New enrollments" },
          { key: "completions", label: "Completions" },
        ],
        courses: [{ id, title, daily: arr(trends.daily_students) }],
      },
      revenue: {
        metrics: [
          { key: "revenue", label: "Income", currency: true },
          { key: "enrollments", label: "New enrollments" },
        ],
        courses: [
          {
            id,
            title,
            daily: merge(trends.daily_revenue, trends.daily_students),
          },
        ],
      },
    };
  }, [stats, course]);

  return (
    <CourseManagementLayout
      course={course}
      activeTab="statistics"
      title="Statistics"
    >
      <nav
        aria-label="Statistics sections"
        className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200"
      >
        {STAT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveStat(tab.id)}
            className={`-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeStat === tab.id
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards
          .filter((card) => card.group === activeStat)
          .map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-lg border border-[#e2e8f0] p-5"
            >
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-black text-on-surface">
                {isLoading ? "..." : card.value}
              </p>
            </div>
          ))}
      </section>

      {activeStat === "ratings" ? (
        <section className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg border border-[#e2e8f0] p-6">
            <h2 className="text-xl font-bold mb-4">Rating distribution</h2>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ratingChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value, _name, item) => [
                      `${value} reviews (${Number(item?.payload?.percentage || 0).toFixed(2)}%)`,
                      "Count",
                    ]}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {ratingChartData.map((row) => (
                      <Cell
                        key={`rating-cell-${row.label}`}
                        fill={
                          row.label === "5?"
                            ? "#0056D2"
                            : row.label === "4?"
                              ? "#3b82f6"
                              : "#93c5fd"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      ) : (
        <EngagementReport
          key={activeStat}
          courses={reportSections[activeStat].courses}
          metrics={reportSections[activeStat].metrics}
          hideTable
        />
      )}
    </CourseManagementLayout>
  );
}
