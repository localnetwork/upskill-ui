import CourseManagementLayout from "@/components/partials/CourseManagementLayout";
import BaseApi from "@/lib/api/_base.api";
import { setContext } from "@/lib/api/interceptor";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export async function getServerSideProps(context) {
  const { slug } = context.params;
  setContext(context);

  let course = null;
  try {
    const response = await BaseApi.get(
      process.env.NEXT_PUBLIC_API_URL + `/courses/${slug}/manage`,
    );
    course = response?.data?.data;
  } catch (error) {
    console.log("Error fetching course:", error);
    return {
      notFound: true,
    };
  }

  return {
    props: {
      course,
    },
  };
}

export default function Students({ course }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1,
  });
  const [stats, setStats] = useState({
    total_students: 0,
    increase_this_month: 0,
    average_progress_pct: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!course?.slug) return;
      try {
        setIsLoading(true);
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/${course.slug}/students`,
          {
            params: {
              page,
              limit: pagination.limit,
              search,
            },
          },
        );

        setStudents(
          Array.isArray(response?.data?.data) ? response.data.data : [],
        );
        setStats(
          response?.data?.stats || {
            total_students: 0,
            increase_this_month: 0,
            average_progress_pct: 0,
          },
        );
        setPagination((prev) => ({
          page: Number(response?.data?.pagination?.page || prev.page || 1),
          limit: Number(response?.data?.pagination?.limit || prev.limit || 10),
          total: Number(response?.data?.pagination?.total || 0),
          total_pages: Math.max(
            1,
            Number(response?.data?.pagination?.total_pages || 1),
          ),
        }));
      } catch (error) {
        console.error("Failed to fetch course students:", error);
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [course?.slug, page, search]);

  const totalPages = Math.max(1, Number(pagination.total_pages || 1));
  const currentPage = Math.min(
    Math.max(Number(pagination.page || 1), 1),
    totalPages,
  );
  const startItem = pagination.total
    ? (currentPage - 1) * pagination.limit + 1
    : 0;
  const endItem = pagination.total
    ? Math.min(currentPage * pagination.limit, pagination.total)
    : 0;

  const visiblePages = useMemo(() => {
    const spread = 2;
    const pages = [];
    const start = Math.max(1, currentPage - spread);
    const end = Math.min(totalPages, currentPage + spread);
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [currentPage, totalPages]);

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const getStudentInitials = (name) =>
    String(name || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "ST";

  const getProgressMeta = (student) => {
    const progressPct = Number(student?.progress?.progress_pct || 0);
    if (progressPct >= 100 || student?.progress?.completed) {
      return {
        label: "Completed",
        badgeClass: "bg-blue-100 text-blue-700",
        barClass: "bg-blue-600",
        valueClass: "text-blue-700",
      };
    }
    if (progressPct >= 70) {
      return {
        label: "Active",
        badgeClass: "bg-emerald-100 text-emerald-700",
        barClass: "bg-primary",
        valueClass: "text-primary",
      };
    }
    return {
      label: "Behind Schedule",
      badgeClass: "bg-orange-100 text-tertiary",
      barClass: "bg-tertiary",
      valueClass: "text-tertiary",
    };
  };

  return (
    <CourseManagementLayout
      course={course}
      activeTab="students"
      title="Students"
    >
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-5">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">
            Total students
          </p>
          <p className="mt-2 text-3xl font-black text-on-surface">
            {stats.total_students || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-5">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">
            New this month
          </p>
          <p className="mt-2 text-3xl font-black text-on-surface">
            +{stats.increase_this_month || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-5">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">
            Average progress
          </p>
          <p className="mt-2 text-3xl font-black text-on-surface">
            {Math.round(Number(stats.average_progress_pct || 0))}%
          </p>
        </div>
      </section>

      <section className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
        <div className="p-6 border-b border-[#e2e8f0] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              className="w-full pl-12 pr-4 py-3 bg-[#F8FAFC] border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-[#94a3b8]"
              placeholder="Search by name or username..."
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                  Student
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                  Enrollment Date
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                  Progress
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                  Status
                </th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`student-loading-${index}`}>
                    <td className="px-6 py-5">
                      <div className="animate-pulse flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200" />
                        <div className="space-y-2">
                          <div className="h-4 w-36 bg-gray-200 rounded" />
                          <div className="h-3 w-44 bg-gray-200 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
                    </td>
                    <td className="px-6 py-5" />
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-on-surface-variant"
                  >
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((row) => {
                  const meta = getProgressMeta(row);
                  const progressValue = Math.max(
                    0,
                    Math.min(
                      100,
                      Math.round(Number(row?.progress?.progress_pct || 0)),
                    ),
                  );
                  return (
                    <tr
                      key={row.enrollment_id}
                      className="hover:bg-surface-container-low transition-colors group"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
                            {getStudentInitials(row?.student?.name)}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface">
                              {row?.student?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-on-surface-variant">
                              @{row?.student?.username || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-on-surface-variant font-medium">
                        {formatDate(row?.enrollment_date)}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5 w-32">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className={meta.valueClass}>
                              {progressValue}%
                            </span>
                          </div>
                          <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`${meta.barClass} h-full rounded-full`}
                              style={{ width: `${progressValue}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right" />
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t border-[#e2e8f0] flex items-center justify-between">
          <span className="text-xs font-bold text-on-surface-variant">
            Showing {startItem} to {endItem} of {pagination.total} students
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-[#e2e8f0] text-on-surface-variant enabled:hover:bg-surface-container-low transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft />
            </button>
            {visiblePages.map((pageNumber) => (
              <button
                key={`page-${pageNumber}`}
                onClick={() => setPage(pageNumber)}
                disabled={isLoading}
                className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-xs transition-all ${
                  pageNumber === currentPage
                    ? "bg-primary text-white"
                    : "border border-[#e2e8f0] text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-[#e2e8f0] text-on-surface-variant enabled:hover:bg-surface-container-low transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </section>
    </CourseManagementLayout>
  );
}
