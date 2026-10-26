import BaseApi from "@/lib/api/_base.api";
import { Search, Star } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  ModalReviewCard,
  normalizeReview,
  useReviewActions,
} from "./reviewShared";

const PAGE_SIZE = 10;

const SORT_OPTIONS = [
  { value: "recent", label: "Most recent" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
];

function getPageNumbers(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const result = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("gap");
    result.push(page);
  });
  return result;
}

function formatPercentage(value) {
  const number = Number(value || 0);
  if (number > 0 && number < 1) return "< 1%";
  return `${Math.round(number)}%`;
}

export default function ReviewsListView({ courseId, initialSort = "recent" }) {
  const [sort, setSort] = useState(initialSort);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ totalPages: 1, total: 0 });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const actions = useReviewActions(setRows);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          sort,
        });
        if (ratingFilter) params.set("rating", String(ratingFilter));
        if (searchTerm) params.set("q", searchTerm);
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/reviews/courses/${encodeURIComponent(courseId)}?${params.toString()}`,
        );
        if (cancelled) return;
        setRows(
          Array.isArray(response?.data?.data)
            ? response.data.data.map(normalizeReview)
            : [],
        );
        setMeta({
          totalPages: Math.max(
            1,
            Number(response?.data?.meta?.totalPages || 1),
          ),
          total: Number(response?.data?.meta?.total || 0),
        });
        setSummary(response?.data?.summary || null);
      } catch (error) {
        if (!cancelled)
          toast.error(error?.data?.message || "Unable to load reviews.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId, sort, ratingFilter, searchTerm, page]);

  const distribution = Array.isArray(summary?.ratingDistribution)
    ? summary.ratingDistribution
    : [];
  const averageRating = Number(summary?.averageRating || 0);
  const totalRatings = Number(summary?.totalReviews || 0);

  const toggleRating = (rating) => {
    setRatingFilter((current) => (current === rating ? 0 : rating));
    setPage(1);
  };

  const goToPage = (target) => {
    setPage(Math.min(Math.max(1, target), meta.totalPages));
  };

  const isFiltered = Boolean(ratingFilter || searchTerm);

  return (
    <div>
      <h2 className="-mt-1 mb-6 flex flex-wrap items-center gap-x-2 pr-8 text-xl font-bold text-slate-900 sm:text-2xl">
        <Star size={22} className="fill-amber-700 text-amber-700" />
        <span>{averageRating.toFixed(1)} course rating</span>
        <span className="text-slate-500">•</span>
        <span>{totalRatings.toLocaleString()} ratings</span>
      </h2>

      <div className="grid gap-6 sm:grid-cols-[260px_minmax(0,1fr)] sm:items-start sm:gap-8 lg:gap-10">
        <aside className="space-y-6 sm:sticky sm:top-0">
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const row = distribution.find((item) => item.rating === rating);
              const percentage = Number(row?.percentage || 0);
              const active = ratingFilter === rating;
              return (
                <button
                  key={`filter-${rating}`}
                  type="button"
                  onClick={() => toggleRating(rating)}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-3 rounded text-left ${
                    active ? "bg-slate-100" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="h-2 w-[90px] shrink-0 overflow-hidden rounded-sm bg-slate-200 sm:w-[100px]">
                    <span
                      className="block h-full bg-slate-500"
                      style={{
                        width: `${Math.min(100, Math.max(0, percentage))}%`,
                      }}
                    />
                  </span>
                  <span className="flex shrink-0 items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={`bar-star-${rating}-${index}`}
                        size={12}
                        className={
                          index < rating
                            ? "fill-amber-700 text-amber-700"
                            : "text-amber-700"
                        }
                      />
                    ))}
                  </span>
                  <span className="text-sm font-medium text-primary underline">
                    {formatPercentage(percentage)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search reviews"
              aria-label="Search reviews"
              className="w-full rounded-lg border border-slate-300 py-3 pl-4 pr-10 text-sm text-slate-700 outline-none focus:border-slate-900"
            />
            <Search
              size={18}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-900"
            />
          </div>

          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm text-slate-700"
            aria-label="Sort reviews"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </aside>

        <div className="min-w-0">
          <div className="flex items-center justify-between border-b border-slate-300 pb-3 text-sm text-slate-500">
            <span>
              {meta.total
                ? `${meta.total.toLocaleString()} review${meta.total === 1 ? "" : "s"}${isFiltered ? " found" : ""}`
                : loading
                  ? "Loading reviews..."
                  : "No reviews found."}
            </span>
            {isFiltered ? (
              <button
                type="button"
                onClick={() => {
                  setRatingFilter(0);
                  setSearchInput("");
                  setSearchTerm("");
                  setPage(1);
                }}
                className="font-semibold text-primary underline"
              >
                Clear filters
              </button>
            ) : null}
          </div>

          <div
            className={`max-h-[55vh] overflow-y-auto pr-2 ${loading ? "opacity-60" : ""}`}
          >
            {rows.map((review) => (
              <ModalReviewCard
                key={review.id}
                review={review}
                actions={actions}
              />
            ))}
          </div>

          {meta.totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-slate-300 pt-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-40"
              >
                Prev
              </button>
              {getPageNumbers(page, meta.totalPages).map((item, index) =>
                item === "gap" ? (
                  <span key={`gap-${index}`} className="px-1 text-slate-400">
                    …
                  </span>
                ) : (
                  <button
                    key={`review-page-${item}`}
                    type="button"
                    onClick={() => goToPage(item)}
                    className={`rounded border px-3 py-1 text-sm ${
                      item === page
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => goToPage(page + 1)}
                className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
