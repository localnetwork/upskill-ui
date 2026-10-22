import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, SlidersHorizontal, Star, X } from "lucide-react";
import BaseApi from "@/lib/api/_base.api";

const PAGE_SIZE = 10;

const RATING_OPTIONS = [
  { label: "4.5 & up", value: "4.5" },
  { label: "4.0 & up", value: "4" },
  { label: "3.5 & up", value: "3.5" },
  { label: "3.0 & up", value: "3" },
];

const LEVEL_OPTIONS = [
  { label: "Beginner", value: "1" },
  { label: "Intermediate", value: "2" },
  { label: "Expert", value: "3" },
];

const PRICE_OPTIONS = [
  { label: "Paid", value: "paid" },
  { label: "Free", value: "free" },
];

const HANDS_ON_OPTIONS = [
  { label: "Quizzes", value: "quizzes" },
  { label: "Coding exercise", value: "coding-exercise" },
  { label: "Practice tests", value: "practice-tests" },
  { label: "Role plays", value: "role-plays" },
];

const SORT_OPTIONS = [
  { label: "Most Popular", value: "best_selling" },
  { label: "Newest", value: "newest" },
];

const EMPTY_FILTERS = {
  rating: "",
  levelId: "",
  price: [],
  language: [],
  handsOn: [],
};

function RatingStars({ value }) {
  return (
    <span className="inline-flex text-amber-500">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${
            index < Math.round(value) ? "fill-current" : "text-slate-300"
          }`}
        />
      ))}
    </span>
  );
}

function FilterSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-slate-200 py-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between text-left text-base font-bold text-slate-900"
      >
        {title}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? <div className="mt-3 space-y-2.5">{children}</div> : null}
    </section>
  );
}

function OptionRow({ type, name, checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className={`h-4 w-4 border-slate-400 text-primary focus:ring-primary ${
          type === "checkbox" ? "rounded" : ""
        }`}
      />
      <span className="flex items-center gap-1.5">{children}</span>
    </label>
  );
}

function formatPrice(course) {
  const price = Number(course?.price_tier?.price || 0);
  if (price <= 0) return "Free";
  return `₱${price.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

function CourseRow({ course }) {
  const author = course?.author?.data || {};
  const authorName = `${author.firstname || ""} ${author.lastname || ""}`.trim();
  const rating = Number(course?.stats?.average_rating || 0);
  const reviews = Number(course?.stats?.total_reviews || 0);
  const lectures = Number(course?.resources_count?.curriculum_count || 0);
  const image = course?.cover_image?.path;

  return (
    <article className="flex gap-4 border-b border-slate-200 py-5 first:pt-0 sm:gap-5">
      <Link
        href={`/courses/${course.slug}`}
        className="relative block h-[84px] w-[120px] shrink-0 overflow-hidden border border-slate-200 bg-slate-100 sm:h-[130px] sm:w-[240px] lg:h-[146px] lg:w-[260px]"
      >
        {image ? (
          <Image
            src={image}
            alt={course.title}
            fill
            sizes="(min-width: 1024px) 260px, (min-width: 640px) 240px, 120px"
            className="object-cover"
          />
        ) : null}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/courses/${course.slug}`}
              className="line-clamp-2 text-base font-bold leading-snug text-slate-900 hover:text-primary"
            >
              {course.title}
            </Link>
            {course.subtitle ? (
              <p className="mt-1 hidden line-clamp-2 text-sm text-slate-600 sm:block">
                {course.subtitle}
              </p>
            ) : null}
          </div>
          <span className="shrink-0 text-base font-bold text-slate-900 sm:hidden">
            {formatPrice(course)}
          </span>
        </div>

        {authorName ? (
          <p className="mt-1 truncate text-xs text-slate-500">{authorName}</p>
        ) : null}

        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
          {reviews > 0 ? (
            <>
              <span className="font-bold text-amber-700">
                {rating.toFixed(1)}
              </span>
              <RatingStars value={rating} />
              <span className="text-slate-500">
                ({reviews.toLocaleString("en-PH")})
              </span>
            </>
          ) : (
            <span className="text-slate-500">No ratings yet</span>
          )}
        </div>

        <p className="mt-1 text-xs text-slate-500">
          {lectures} lectures · {course?.instructional_level?.title || "All Levels"}
        </p>

        <p className="mt-2 hidden text-base font-bold text-slate-900 sm:block">
          {formatPrice(course)}
        </p>
      </div>
    </article>
  );
}

export default function TopicCourses({ topic }) {
  const topicSlug = topic?.slug;
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState("best_selling");
  const [page, setPage] = useState(1);
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [languageOptions, setLanguageOptions] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/languages`)
      .then((response) => {
        if (cancelled) return;
        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        setLanguageOptions(
          rows
            .map((row) => String(row?.label || row?.value || "").trim())
            .filter(Boolean),
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const filterKey = JSON.stringify([filters, sort, topicSlug]);

  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  useEffect(() => {
    if (!topicSlug) return undefined;
    let cancelled = false;
    setIsLoading(true);

    BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
      params: {
        topic: topicSlug,
        sortBy: sort,
        page,
        limit: PAGE_SIZE,
        nocache: true,
        ...(filters.rating ? { rating: filters.rating } : {}),
        ...(filters.levelId ? { levelId: filters.levelId } : {}),
        ...(filters.price.length ? { price: filters.price.join(",") } : {}),
        ...(filters.language.length
          ? { language: filters.language.join(",") }
          : {}),
        ...(filters.handsOn.length
          ? { handsOn: filters.handsOn.join(",") }
          : {}),
      },
    })
      .then((response) => {
        if (cancelled) return;
        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        setCourses((prev) => (page === 1 ? rows : [...prev, ...rows]));
        setTotal(Number(response?.data?.meta?.total || rows.length));
      })
      .catch(() => {
        if (cancelled) return;
        if (page === 1) setCourses([]);
        setTotal(0);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // filterKey covers filters, sort and topicSlug
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, page]);

  const activeCount = useMemo(
    () =>
      (filters.rating ? 1 : 0) +
      (filters.levelId ? 1 : 0) +
      filters.price.length +
      filters.language.length +
      filters.handsOn.length,
    [filters],
  );

  const toggleMulti = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item) => item !== value)
        : [...prev[key], value],
    }));
  };

  const hasMore = courses.length < total;

  const sidebar = (
    <div>
      <FilterSection title="Ratings">
        {RATING_OPTIONS.map((item) => (
          <OptionRow
            key={item.value}
            type="radio"
            name="topic-rating"
            checked={filters.rating === item.value}
            onChange={() =>
              setFilters((prev) => ({ ...prev, rating: item.value }))
            }
          >
            <RatingStars value={Number(item.value)} />
            {item.label}
          </OptionRow>
        ))}
      </FilterSection>

      <FilterSection title="Level">
        {LEVEL_OPTIONS.map((item) => (
          <OptionRow
            key={item.value}
            type="radio"
            name="topic-level"
            checked={filters.levelId === item.value}
            onChange={() =>
              setFilters((prev) => ({ ...prev, levelId: item.value }))
            }
          >
            {item.label}
          </OptionRow>
        ))}
      </FilterSection>

      <FilterSection title="Price">
        {PRICE_OPTIONS.map((item) => (
          <OptionRow
            key={item.value}
            type="checkbox"
            checked={filters.price.includes(item.value)}
            onChange={() => toggleMulti("price", item.value)}
          >
            {item.label}
          </OptionRow>
        ))}
      </FilterSection>

      <FilterSection title="Hands-on practice" defaultOpen={false}>
        {HANDS_ON_OPTIONS.map((item) => (
          <OptionRow
            key={item.value}
            type="checkbox"
            checked={filters.handsOn.includes(item.value)}
            onChange={() => toggleMulti("handsOn", item.value)}
          >
            {item.label}
          </OptionRow>
        ))}
      </FilterSection>

      {languageOptions.length ? (
        <FilterSection title="Language" defaultOpen={false}>
          <div className="max-h-56 space-y-2.5 overflow-y-auto pr-1">
            {languageOptions.map((label) => (
              <OptionRow
                key={label}
                type="checkbox"
                checked={filters.language.includes(label.toLowerCase())}
                onChange={() => toggleMulti("language", label.toLowerCase())}
              >
                {label}
              </OptionRow>
            ))}
          </div>
        </FilterSection>
      ) : null}
    </div>
  );

  return (
    <section className="py-12">
      <div className="container">
        <h2 className="mb-6 text-2xl font-headline font-extrabold tracking-tight text-on-surface md:text-3xl">
          All {topic?.title} courses
        </h2>

        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex items-center gap-2 border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {activeCount > 0 ? (
                <span className="rounded-full bg-primary px-1.5 text-xs text-white">
                  {activeCount}
                </span>
              ) : null}
            </button>
            <label className="flex items-center gap-2 border border-slate-300 bg-white px-3 py-2 text-sm">
              <span className="text-xs text-slate-500">Sort by</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="border-none bg-transparent py-1 pr-6 text-sm font-semibold focus:ring-0"
              >
                {SORT_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            {activeCount > 0 ? (
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Clear filters
              </button>
            ) : null}
          </div>
          <span className="text-sm font-bold text-slate-500">
            {total.toLocaleString("en-PH")} result{total === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex gap-8">
          <aside className="hidden w-[260px] shrink-0 lg:block">{sidebar}</aside>

          <div className="min-w-0 flex-1">
            {isLoading && page === 1 ? (
              <div className="space-y-5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[130px] animate-pulse border border-slate-200 bg-slate-100"
                  />
                ))}
              </div>
            ) : courses.length ? (
              <>
                {courses.map((course) => (
                  <CourseRow key={course.id} course={course} />
                ))}
                {hasMore ? (
                  <div className="pt-6 text-center">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setPage((prev) => prev + 1)}
                      className="border border-slate-900 px-6 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {isLoading ? "Loading..." : "Show more courses"}
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="border border-dashed border-slate-300 p-10 text-center text-slate-500">
                No courses match your filters.
              </div>
            )}
          </div>
        </div>
      </div>

      {isSidebarOpen ? (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-full max-w-[340px] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-bold text-slate-900">Filters</h3>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5">{sidebar}</div>
            <div className="flex gap-3 border-t border-slate-200 px-5 py-3">
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="flex-1 bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Show {total} results
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
