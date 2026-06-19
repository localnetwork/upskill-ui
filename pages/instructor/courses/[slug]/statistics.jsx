import CourseManagementLayout from "@/components/partials/CourseManagementLayout";
import BaseApi from "@/lib/api/_base.api";
import { setContext } from "@/lib/api/interceptor";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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

export default function CourseStatisticsManagement({ course }) {
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
      total_page_views: 0,
      unique_impression_visitors: 0,
      unique_page_view_visitors: 0,
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
        setStats(response?.data?.data || {
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
            total_page_views: 0,
            unique_impression_visitors: 0,
            unique_page_view_visitors: 0,
          },
          distribution: {
            rating_distribution: [],
          },
          trends: {
            monthly_enrollments: [],
          },
        });
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
        label: "Total students",
        value: Number(stats?.overview?.total_students || 0),
      },
      {
        label: "New enrollments this month",
        value: Number(stats?.overview?.enrollments_this_month || 0),
      },
      {
        label: "Course completion rate",
        value: `${Math.round(Number(stats?.overview?.completion_rate_pct || 0))}%`,
      },
      {
        label: "Average learner progress",
        value: `${Math.round(Number(stats?.overview?.average_progress_pct || 0))}%`,
      },
      {
        label: "Average rating",
        value: Number(stats?.overview?.average_rating || 0).toFixed(2),
      },
      {
        label: "Total reviews",
        value: Number(stats?.overview?.total_reviews || 0),
      },
      {
        label: "Total revenue",
        value: formatCurrency(stats?.overview?.total_revenue || 0),
      },
      {
        label: "Revenue this month",
        value: formatCurrency(stats?.overview?.revenue_this_month || 0),
      },
      {
        label: "Course card impressions",
        value: Number(stats?.overview?.total_impressions || 0),
      },
      {
        label: "Course page views",
        value: Number(stats?.overview?.total_page_views || 0),
      },
      {
        label: "Unique impression visitors",
        value: Number(stats?.overview?.unique_impression_visitors || 0),
      },
      {
        label: "Unique page visitors",
        value: Number(stats?.overview?.unique_page_view_visitors || 0),
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
  const trendChartData = useMemo(
    () =>
      (stats?.trends?.monthly_enrollments || []).map((row) => ({
        label: row.label,
        enrollments: Number(row.count || 0),
      })),
    [stats],
  );

  return (
    <CourseManagementLayout course={course} activeTab="statistics" title="Statistics">
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
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

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                        row.label === "5★"
                          ? "#0056D2"
                          : row.label === "4★"
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

        <div className="bg-white rounded-lg border border-[#e2e8f0] p-6">
          <h2 className="text-xl font-bold mb-4">Enrollment trend (last 6 months)</h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value} enrollments`, "Enrollments"]} />
                <Line
                  type="monotone"
                  dataKey="enrollments"
                  stroke="#C4710D"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#C4710D" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </CourseManagementLayout>
  );
}
