import CourseManagementLayout from "@/components/partials/CourseManagementLayout";
import Select from "@/components/forms/Select";
import BaseApi from "@/lib/api/_base.api";
import { setContext } from "@/lib/api/interceptor";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function renderStars(rating) {
  const safe = Number(rating || 0);
  return "★".repeat(safe) + "☆".repeat(Math.max(5 - safe, 0));
}

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
        courseSlug: slug,
      },
    };
  } catch (_error) {
    return { notFound: true };
  }
}

export default function CourseReviewsManagement({ course, courseSlug }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("");
  const [sort, setSort] = useState("recent");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ averageRating: 0, totalReviews: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 1,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(String(searchInput || "").trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!courseSlug) return;
      setIsLoading(true);
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/reviews/instructor/courses/${encodeURIComponent(courseSlug)}`,
          {
            params: {
              page,
              limit: pagination.limit,
              sort,
              rating: rating || undefined,
              search: search || undefined,
            },
          },
        );

        setRows(Array.isArray(response?.data?.data) ? response.data.data : []);
        setSummary(
          response?.data?.summary || { averageRating: 0, totalReviews: 0 },
        );
        setPagination((prev) => ({
          page: Number(response?.data?.pagination?.page || prev.page || 1),
          limit: Number(response?.data?.pagination?.limit || prev.limit || 10),
          total: Number(response?.data?.pagination?.total || 0),
          total_pages: Math.max(
            1,
            Number(response?.data?.pagination?.totalPages || 1),
          ),
        }));
      } catch (_error) {
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [courseSlug, page, sort, rating, search]);

  const totalPages = Math.max(1, Number(pagination.total_pages || 1));
  const currentPage = Math.min(Math.max(Number(pagination.page || 1), 1), totalPages);
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

  return (
    <CourseManagementLayout course={course} title="Reviews">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-5">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">
            Average Rating
          </p>
          <p className="mt-2 text-3xl font-black text-on-surface">
            {Number(summary?.averageRating || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-[#e2e8f0] p-5">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant">
            Total Reviews
          </p>
          <p className="mt-2 text-3xl font-black text-on-surface">
            {Number(summary?.totalReviews || 0)}
          </p>
        </div>
      </section>

      <section className="bg-white rounded-lg border border-[#e2e8f0] overflow-hidden">
        <div className="p-6 border-b border-[#e2e8f0] flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              className="w-full pl-12 pr-4 py-3 bg-[#F8FAFC] border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 placeholder:text-[#94a3b8]"
              placeholder="Search by learner, title, or review content..."
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <Select
            value={rating}
            onChange={(e) => {
              setPage(1);
              setRating(e.target.value);
            }}
            className="border border-[#e2e8f0] rounded-md px-3 py-2 text-sm"
          >
            <option value="">All ratings</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </Select>

          <Select
            value={sort}
            onChange={(e) => {
              setPage(1);
              setSort(e.target.value);
            }}
            className="border border-[#e2e8f0] rounded-md px-3 py-2 text-sm"
          >
            <option value="recent">Most recent</option>
            <option value="highest">Highest rated</option>
            <option value="lowest">Lowest rated</option>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f4f4f4] border-[#e2e8f0] border-b">
              <tr>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                  Learner
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                  Rating
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                  Review
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`review-loading-${index}`}>
                    <td className="px-6 py-5">
                      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-sm text-on-surface-variant"
                  >
                    No reviews found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-5 text-sm font-semibold">
                      {row?.author?.fullName || row?.author?.username || "Learner"}
                    </td>
                    <td className="px-6 py-5 text-[#C4710D] font-semibold">
                      {renderStars(row?.rating)}
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-semibold text-sm text-on-surface">
                        {row?.title || "Untitled review"}
                      </p>
                      <p className="text-sm text-on-surface-variant mt-1 whitespace-pre-wrap">
                        {row?.comment || "No written comment."}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-sm text-on-surface-variant">
                      {formatDate(row?.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-[#e2e8f0] flex items-center justify-between">
          <span className="text-xs font-bold text-on-surface-variant">
            Showing {startItem} to {endItem} of {pagination.total} reviews
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
