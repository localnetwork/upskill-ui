import BaseApi from "@/lib/api/_base.api";
import modalState from "@/lib/store/modalState";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const COURSE_STATUS_TABS = [
  { key: "ALL", label: "All Courses", status: null },
  { key: "PUBLISHED", label: "Published", status: "PUBLISHED" },
  { key: "PENDING", label: "Pending Review", status: "PENDING_APPROVAL" },
  { key: "DRAFT", label: "Drafts", status: "DRAFT" },
  { key: "ARCHIVED", label: "Archived", status: "REJECTED" },
];

const STATUS_STYLES = {
  Published: "bg-emerald-50 text-emerald-700 before:bg-emerald-500",
  "Pending Review": "bg-amber-50 text-amber-700 before:bg-amber-500",
  Draft: "bg-slate-100 text-slate-600 before:bg-slate-400",
  Approved: "bg-blue-50 text-blue-700 before:bg-blue-500",
  Archived: "bg-rose-50 text-rose-700 before:bg-rose-500",
};

function mapWorkflowStatusLabel(workflowStatus) {
  const normalized = String(workflowStatus || "").toUpperCase();
  if (normalized === "PUBLISHED") return "Published";
  if (normalized === "PENDING_APPROVAL") return "Pending Review";
  if (normalized === "APPROVED") return "Approved";
  if (normalized === "REJECTED") return "Archived";
  return "Draft";
}

function getApiOrigin() {
  const apiUrl = String(process.env.NEXT_PUBLIC_API_URL || "");
  return apiUrl.replace(/\/api\/?$/, "");
}

function resolveAssetUrl(path) {
  const rawPath = String(path || "").trim();
  if (!rawPath) return "";
  if (/^https?:\/\//i.test(rawPath)) return rawPath;

  const origin = getApiOrigin();
  if (!origin) return rawPath;
  if (rawPath.startsWith("/")) return `${origin}${rawPath}`;
  return `${origin}/${rawPath}`;
}

function mapInstructorName(educator) {
  const firstName = String(educator?.firstName || "").trim();
  const lastName = String(educator?.lastName || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  return (
    fullName || educator?.username || educator?.email || "Unknown instructor"
  );
}

function normalizeCourses(rows = []) {
  return rows.map((row) => {
    const rating = Number(row?.stats?.averageRating || 0);
    const totalReviews = Number(
      row?.stats?.totalReviews || row?._count?.reviews || 0,
    );
    const totalEnrollments = Number(
      row?.stats?.totalEnrollments || row?._count?.enrollments || 0,
    );
    const totalModules = Number(
      row?.stats?.totalModules || row?._count?.sections || 0,
    );
    const status = mapWorkflowStatusLabel(row?.workflowStatus);

    return {
      ...row,
      managementSlug: row?.uuid || row?.slug || row?.id,
      courseImage: resolveAssetUrl(row?.coverImage?.path),
      categoryLabel: row?.category?.name || "Uncategorized",
      modulesLabel: `${totalModules} module${totalModules === 1 ? "" : "s"}`,
      instructorLabel: mapInstructorName(row?.educator),
      statusLabel: status,
      enrollmentLabel: totalEnrollments.toLocaleString(),
      growthLabel: "—",
      ratingLabel: rating.toFixed(1),
      reviewsLabel: `(${totalReviews})`,
      isPendingReview:
        String(row?.workflowStatus || "").toUpperCase() === "PENDING_APPROVAL",
    };
  });
}

export default function AdminCoursesManagement() {
  const [activeStatusTab, setActiveStatusTab] = useState("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [activeActionCourseId, setActiveActionCourseId] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const activeStatusFilter = useMemo(
    () =>
      COURSE_STATUS_TABS.find((tab) => tab.key === activeStatusTab)?.status ||
      null,
    [activeStatusTab],
  );

  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/courses`,
        {
          params: {
            page,
            limit: pagination.limit,
            ...(searchQuery ? { search: searchQuery } : {}),
            ...(activeStatusFilter ? { status: activeStatusFilter } : {}),
          },
        },
      );

      const rows = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
      setCourses(normalizeCourses(rows));

      const rawMeta = response?.data?.meta || response?.data?.pagination || {};
      setPagination((prev) => ({
        page: Number(rawMeta.page || prev.page || 1),
        limit: Number(rawMeta.limit || prev.limit || 10),
        total: Number(rawMeta.total || 0),
        totalPages: Math.max(
          1,
          Number(rawMeta.totalPages || rawMeta.total_pages || 1),
        ),
      }));
    } catch (error) {
      setCourses([]);
      setPagination((prev) => ({
        ...prev,
        page: 1,
        total: 0,
        totalPages: 1,
      }));
      toast.error(error?.data?.message || "Failed to fetch courses.");
    } finally {
      setIsLoading(false);
    }
  }, [activeStatusFilter, page, pagination.limit, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const reviewCourse = useCallback(
    async ({ courseId, action, note }) => {
      try {
        await BaseApi.post(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/courses/${courseId}/${action}`,
          { note },
        );
        toast.success(
          action === "approve" ? "Course approved." : "Course rejected.",
        );
        await fetchCourses();
      } catch (error) {
        toast.error(error?.data?.message || `Failed to ${action} course.`);
        throw error;
      }
    },
    [fetchCourses],
  );

  const openReviewActionModal = useCallback(
    (course, action) => {
      setActiveActionCourseId(null);
      modalState.setState({
        modalInfo: {
          type: "ADMIN_COURSE_REVIEW_ACTION",
          title: action === "approve" ? "Approve Course" : "Reject Course",
          size: "md",
          data: {
            action,
            courseTitle: course?.title || "this course",
            onConfirm: async (note) =>
              reviewCourse({
                courseId: course.id,
                action,
                note,
              }),
          },
        },
      });
    },
    [reviewCourse],
  );

  const toggleActionMenu = useCallback((courseId) => {
    setActiveActionCourseId((prev) => (prev === courseId ? null : courseId));
  }, []);

  const totalPages = Math.max(1, Number(pagination.totalPages || 1));
  const currentPage = Math.min(
    Math.max(1, Number(pagination.page || 1)),
    totalPages,
  );
  const startItem = pagination.total
    ? (currentPage - 1) * pagination.limit + 1
    : 0;
  const endItem = pagination.total
    ? Math.min(currentPage * pagination.limit, pagination.total)
    : 0;

  const visiblePages = useMemo(() => {
    if (totalPages <= 1) return [];

    const spread = 1;
    const pages = new Set([1, totalPages, currentPage]);
    for (
      let target = currentPage - spread;
      target <= currentPage + spread;
      target += 1
    ) {
      if (target > 1 && target < totalPages) pages.add(target);
    }

    const sorted = Array.from(pages).sort((a, b) => a - b);
    const composed = [];
    for (let index = 0; index < sorted.length; index += 1) {
      const value = sorted[index];
      const previous = sorted[index - 1];
      if (previous && value - previous > 1) {
        composed.push(`ellipsis-${previous}-${value}`);
      }
      composed.push(value);
    }
    return composed;
  }, [currentPage, totalPages]);

  return (
    <>
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-3 bg-[#F8FAFC] p-2 rounded-2xl flex flex-wrap items-center gap-2">
          {COURSE_STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${
                activeStatusTab === tab.key
                  ? "bg-primary text-white"
                  : "hover:bg-white text-slate-600"
              }`}
              onClick={() => {
                setPage(1);
                setActiveStatusTab(tab.key);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            className="w-full bg-[#F8FAFC] border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl py-4 pl-12 pr-4 text-sm transition-all outline-none"
            placeholder="Filter by title or instructor..."
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
      </section>

      <div className="bg-white rounded-[2rem] border border-[#e2e8f0] overflow-hidden transition-all">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC]/50">
                {[
                  "Course Details",
                  "Instructor",
                  "Status",
                  "Enrollment",
                  "Rating",
                  "Actions",
                ].map((item) => (
                  <th
                    key={item}
                    className="px-6 py-5 text-xs font-extrabold uppercase tracking-widest text-slate-500 border-b border-[#e2e8f0]"
                  >
                    {item}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-outline">
              {courses.map((course) => (
                <tr
                  key={course.id}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-12 rounded-lg overflow-hidden border border-[#e2e8f0] group-hover:scale-105 transition-transform duration-300 shadow-inner bg-slate-100">
                        {course.courseImage ? (
                          <img
                            className="w-full h-full object-cover"
                            src={course.courseImage}
                            alt="Course preview"
                          />
                        ) : null}
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-on-surface">
                          {course.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {course.categoryLabel} • {course.modulesLabel}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <span className="text-sm font-medium text-on-surface">
                      {course.instructorLabel}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <StatusBadge status={course.statusLabel} />
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">
                        {course.enrollmentLabel}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {course.growthLabel}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1">
                      <Star className="text-amber-500 text-sm" />
                      <span className="text-sm font-bold">
                        {course.ratingLabel}
                      </span>
                      <span className="text-xs text-slate-400">
                        {course.reviewsLabel}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-right">
                    <div className="relative inline-block text-left">
                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-md text-xs font-bold border border-[#e2e8f0] text-slate-700 hover:bg-slate-50"
                        onClick={() => toggleActionMenu(course.id)}
                        disabled={isLoading}
                      >
                        Actions
                      </button>

                      {activeActionCourseId === course.id && (
                        <div className="absolute right-0 z-20 mt-2 min-w-[210px] rounded-lg border border-[#e2e8f0] bg-white shadow-lg overflow-hidden">
                          <Link
                            href={`/instructor/courses/${course.managementSlug}/course-details`}
                            className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            onClick={() => setActiveActionCourseId(null)}
                          >
                            View course details
                          </Link>
                          <Link
                            href={`/instructor/courses/${course.managementSlug}/preview`}
                            className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 border-t border-[#e2e8f0]"
                            onClick={() => setActiveActionCourseId(null)}
                          >
                            Preview curriculum
                          </Link>

                          {course.isPendingReview && (
                            <>
                              <button
                                className="w-full text-left px-4 py-2 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-t border-[#e2e8f0]"
                                onClick={() =>
                                  openReviewActionModal(course, "approve")
                                }
                                disabled={isLoading}
                              >
                                Approve
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border-t border-[#e2e8f0]"
                                onClick={() =>
                                  openReviewActionModal(course, "reject")
                                }
                                disabled={isLoading}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!courses.length ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    {isLoading ? "Loading courses..." : "No courses found."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 flex items-center justify-between bg-[#F8FAFC]/30 border-t border-[#e2e8f0]">
          <p className="text-xs text-slate-500 font-medium">
            Showing{" "}
            <span className="font-bold text-on-surface">
              {startItem} - {endItem}
            </span>{" "}
            of{" "}
            <span className="font-bold text-on-surface">
              {pagination.total}
            </span>{" "}
            courses
          </p>

          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg border border-[#e2e8f0] hover:bg-white transition-colors disabled:opacity-40"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1 || isLoading}
            >
              <ChevronLeft className="text-lg" />
            </button>

            {visiblePages.map((item) =>
              typeof item === "string" ? (
                <span key={item} className="px-1">
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  className={`w-8 h-8 rounded-lg font-bold text-xs ${
                    item === currentPage
                      ? "bg-primary text-white"
                      : "border border-[#e2e8f0] hover:bg-white"
                  }`}
                  onClick={() => setPage(item)}
                  disabled={isLoading}
                >
                  {item}
                </button>
              ),
            )}

            <button
              className="p-2 rounded-lg border border-[#e2e8f0] hover:bg-white transition-colors disabled:opacity-40"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages || isLoading}
            >
              <ChevronRight className="text-lg" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
        STATUS_STYLES[status] || STATUS_STYLES.Draft
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-2 bg-current" />
      {status}
    </span>
  );
}
