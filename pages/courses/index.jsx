import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  ChevronDown,
  CircleHelp,
  Code2,
  Search,
  Sparkles,
  SlidersHorizontal,
  Star,
  Users,
  X,
} from "lucide-react";
import { FeaturedCard } from "@/components/home/sections/FeaturedCoursesCarouselSection";
import Select from "@/components/forms/Select";
import Checkbox from "@/components/forms/Checkbox";
import Radio from "@/components/forms/Radio";
import BaseApi from "@/lib/api/_base.api";
import Seo from "@/components/partials/Seo";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asList(value) {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item || "").split(","))
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function toSingle(value, fallback = "") {
  if (Array.isArray(value)) return String(value[0] || fallback);
  if (value === undefined || value === null) return fallback;
  return String(value);
}

const SORT_OPTIONS = [
  { value: "relevance", label: "Most Relevant" },
  { value: "most_viewed", label: "Most Viewed" },
  { value: "most_reviewed", label: "Most Reviewed" },
];

const HANDS_ON_PILLS = [
  { value: "quizzes", label: "Quizzes", Icon: CircleHelp },
  { value: "coding-exercise", label: "Coding Exercises", Icon: Code2 },
  { value: "role-plays", label: "Practice Role Plays", Icon: Users },
];

function AiOverview({ data }) {
  return (
    <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles size={22} className="fill-primary text-primary" />
        <h2 className="text-xl font-bold text-slate-900">AI Overview</h2>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        {data.summary ||
          `Here are the top matches for \u201C${data.search}\u201D.`}
      </p>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {data.picks.map(({ course, reason }, index) => {
          const lectures = Number(
            course?.stats?.total_lectures ?? course?.resources_count?.curriculum_count ?? 0,
          );
          const reviews = Number(course?.stats?.total_reviews || 0);
          const rating = Number(course?.stats?.average_rating || 0);
          return (
            <div
              key={course.id}
              className="flex flex-col rounded-xl border border-slate-200 p-5"
            >
              <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {index === 0 ? "Top pick" : `Pick #${index + 1}`}
              </span>
              <div className="mt-4 flex gap-4">
                <Image
                  src={course?.cover_image?.path || "/placeholder-cover.webp"}
                  alt={course.title}
                  width={120}
                  height={120}
                  className="h-[60px] w-[60px] shrink-0 rounded object-cover"
                />
                <div className="min-w-0">
                  <h3 className="line-clamp-2 font-bold leading-snug text-slate-900">
                    {course.title}
                  </h3>
                  {reason && <p className="mt-1 line-clamp-3 text-sm text-slate-600">{reason}</p>}
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                    {reviews > 0 && (
                      <span className="flex items-center gap-1">
                        <Star size={12} className="fill-amber-500 text-amber-500" />
                        {rating.toFixed(1)} ({reviews.toLocaleString("en-PH")})
                      </span>
                    )}
                    {lectures > 0 && <span>{lectures.toLocaleString("en-PH")} lectures</span>}
                    {course?.instructional_level?.title && (
                      <span>{course.instructional_level.title}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-auto flex justify-end pt-4">
                <Link
                  href={`/courses/${course.slug}`}
                  className="rounded-lg border border-primary px-5 py-2.5 text-sm font-bold text-primary hover:bg-blue-50"
                >
                  View course
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
function AiOverviewSkeleton() {
  const bar = "rounded bg-slate-200/70";
  return (
    <section
      className="mb-6 animate-pulse rounded-2xl bg-white p-6 shadow-sm"
      aria-busy="true"
      aria-label="Loading AI Overview"
    >
      <div className="flex items-center gap-2">
        <Sparkles size={22} className="fill-primary text-primary" />
        <h2 className="text-xl font-bold text-slate-900">AI Overview</h2>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className={`h-2 w-[65%] ${bar}`} />
        <div className={`h-2 w-[55%] ${bar}`} />
        <div className={`h-2 w-[40%] ${bar}`} />
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-slate-200 p-5">
            <div className={`h-7 w-[120px] rounded-full ${bar}`} />
            <div className="mt-5 flex gap-4">
              <div className={`h-[60px] w-[60px] shrink-0 ${bar}`} />
              <div className="flex-1 space-y-2.5">
                <div className={`h-4 w-[90%] ${bar}`} />
                <div className={`h-4 w-[60%] ${bar}`} />
                <div className={`h-3 w-[70%] ${bar}`} />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <div className={`h-10 w-[150px] rounded-md ${bar}`} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const pillClass = (active) =>
  `flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm transition-colors ${
    active
      ? "border-slate-900 bg-slate-900 text-white"
      : "border-slate-900/70 bg-white text-slate-900 hover:bg-slate-50"
  }`;

function FilterDropdown({ label, active, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" className={pillClass(active)} onClick={() => setOpen((v) => !v)}>
        {label}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 max-h-72 min-w-[220px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

function DropdownOption({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 ${
        selected ? "font-bold text-primary" : "text-slate-700"
      }`}
    >
      {children}
      {selected && <span aria-hidden>?</span>}
    </button>
  );
}

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [aiOverview, setAiOverview] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [topicOptions, setTopicOptions] = useState([]);
  const [languageOptions, setLanguageOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);

  const [draftFilters, setDraftFilters] = useState({
    levelId: "",
    rating: "",
    topics: [],
    price: [],
    language: [],
    handsOn: [],
  });

  useEffect(() => {
    setQuery(String(toSingle(router.query.search, "")));
  }, [router.query.search]);

  useEffect(() => {
    setDraftFilters({
      levelId: toSingle(router.query.levelId || router.query.instructional_level, ""),
      rating: toSingle(router.query.rating, ""),
      topics: asList(router.query.topic || router.query.topic_slug),
      price: asList(router.query.price),
      language: asList(router.query.language),
      handsOn: asList(router.query.handsOn || router.query.hands_on),
    });
  }, [router.query]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [languagesRes, languagesCatalogRes] = await Promise.all([
          BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
            params: { limit: 100, nocache: true },
          }),
          BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/languages`, {
            params: { nocache: true },
          }),
        ]);

        const allTopics = [];
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages) {
          // eslint-disable-next-line no-await-in-loop
          const topicsPageRes = await BaseApi.get(
            `${process.env.NEXT_PUBLIC_API_URL}/tags`,
            {
              params: { page, limit: 100, nocache: true },
            },
          );
          const rows = asArray(topicsPageRes?.data?.data);
          const meta = topicsPageRes?.data?.meta || {};
          totalPages = Number(meta.totalPages || 1);

          allTopics.push(
            ...rows.map((item) => ({
              id: item.id,
              slug: item.slug,
              title: item.title || item.name,
              count: Number(item.course_count || 0),
            })),
          );
          page += 1;
        }

        setTopicOptions(
          allTopics
            .filter((item) => item.slug && item.title)
            .sort((a, b) => {
              if (b.count !== a.count) return b.count - a.count;
              return String(a.title).localeCompare(String(b.title));
            }),
        );

        const languageMap = new Map();
        asArray(languagesRes?.data?.data).forEach((course) => {
          const lang = String(course?.language || "").trim();
          if (!lang) return;
          const key = lang.toLowerCase();
          if (!languageMap.has(key)) {
            languageMap.set(key, { key, label: lang, count: 0 });
          }
          const row = languageMap.get(key);
          row.count += 1;
        });
        const catalogRows = asArray(languagesCatalogRes?.data?.data);
        const catalogMap = new Map(
          catalogRows
            .map((row) => {
              const label = String(row?.label || row?.value || "").trim();
              if (!label) return null;
              return [label.toLowerCase(), label];
            })
            .filter(Boolean),
        );

        for (const [key, label] of catalogMap.entries()) {
          if (!languageMap.has(key)) {
            languageMap.set(key, { key, label, count: 0 });
          }
        }

        setLanguageOptions(
          Array.from(languageMap.values()).sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return String(a.label).localeCompare(String(b.label));
          }),
        );
      } catch (_error) {
        setTopicOptions([]);
        setLanguageOptions([]);
      }
    };

    fetchFilterOptions();
  }, []);

  const difficultyOptions = useMemo(
    () => [
      { label: "Beginners", value: "1" },
      { label: "Intermediate", value: "2" },
      { label: "Expert", value: "3" },
      { label: "All Levels", value: "" },
    ],
    [],
  );

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const response = await BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
          params: {
            ...(router.query.search ? { search: router.query.search } : {}),
            ...(router.query.topic ? { topic: router.query.topic } : {}),
            ...(router.query.levelId ? { levelId: router.query.levelId } : {}),
            ...(router.query.rating ? { rating: router.query.rating } : {}),
            ...(router.query.price ? { price: router.query.price } : {}),
            ...(router.query.language ? { language: router.query.language } : {}),
            ...(router.query.handsOn ? { handsOn: router.query.handsOn } : {}),
            sortBy,
            limit: 100,
            nocache: true,
          },
        });

        const rows = asArray(response?.data?.data);
        setCourses(rows);
        setTotal(Number(response?.data?.meta?.total || rows.length));
      } catch (_error) {
        setCourses([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [router.query, sortBy]);

  const searchTerm = toSingle(router.query.search, "").trim();

  useEffect(() => {
    if (searchTerm.length < 2) {
      setAiOverview(null);
      setIsAiLoading(false);
      return undefined;
    }
    let cancelled = false;
    setIsAiLoading(true);
    BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/courses/ai-overview`, {
      params: { q: searchTerm, nocache: true },
    })
      .then((response) => {
        if (!cancelled) setAiOverview(response?.data?.data || null);
      })
      .catch(() => {
        if (!cancelled) setAiOverview(null);
      })
      .finally(() => {
        if (!cancelled) setIsAiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchTerm]);

  const visibleTopicOptions = useMemo(
    () => (showAllTopics ? topicOptions : topicOptions.slice(0, 12)),
    [showAllTopics, topicOptions],
  );

  const applyFilters = () => {
    const nextQuery = {};

    const trimmedSearch = query.trim();
    if (trimmedSearch) nextQuery.search = trimmedSearch;

    if (draftFilters.levelId) nextQuery.levelId = draftFilters.levelId;
    if (draftFilters.rating) nextQuery.rating = draftFilters.rating;
    if (draftFilters.topics.length) nextQuery.topic = draftFilters.topics.join(",");
    if (draftFilters.price.length) nextQuery.price = draftFilters.price.join(",");
    if (draftFilters.language.length) nextQuery.language = draftFilters.language.join(",");
    if (draftFilters.handsOn.length) nextQuery.handsOn = draftFilters.handsOn.join(",");

    router.push({ pathname: "/courses", query: nextQuery });
    setIsFilterDrawerOpen(false);
  };

  const resetFilters = () => {
    setDraftFilters({
      levelId: "",
      rating: "",
      topics: [],
      price: [],
      language: [],
      handsOn: [],
    });
    const trimmedSearch = query.trim();
    router.push(trimmedSearch ? `/courses?search=${encodeURIComponent(trimmedSearch)}` : "/courses");
    setIsFilterDrawerOpen(false);
  };

  const pushQuery = (patch) => {
    const next = { ...router.query, ...patch };
    Object.keys(next).forEach((key) => {
      if (next[key] === "" || next[key] === undefined || next[key] === null) delete next[key];
    });
    router.push({ pathname: "/courses", query: next }, undefined, { shallow: true });
  };

  const activeHandsOn = asList(router.query.handsOn || router.query.hands_on);
  const activeLanguages = asList(router.query.language);
  const activeLevel = toSingle(router.query.levelId || router.query.instructional_level, "");
  const activeRating = toSingle(router.query.rating, "");

  const toggleHandsOn = (value) => {
    const next = activeHandsOn.includes(value)
      ? activeHandsOn.filter((item) => item !== value)
      : [...activeHandsOn, value];
    pushQuery({ handsOn: next.join(","), hands_on: "" });
  };

  const toggleLanguage = (key) => {
    const next = activeLanguages.includes(key)
      ? activeLanguages.filter((item) => item !== key)
      : [...activeLanguages, key];
    pushQuery({ language: next.join(",") });
  };

  const toggleMultiFilter = (key, value) => {
    setDraftFilters((prev) => {
      const existing = prev[key];
      const has = existing.includes(value);
      return {
        ...prev,
        [key]: has ? existing.filter((item) => item !== value) : [...existing, value],
      };
    });
  };

  return (
    <div className="py-[50px] bg-[#F9FAFB]">
      <Seo
        title="Browse online courses"
        description="Explore online courses in web development, design, business, data, and more. Learn from expert instructors at your own pace."
        noindex={Object.keys(router.query || {}).length > 0}
      />
      <div className="container">
        <div className="w-full mb-8">
          <div className="relative flex items-center bg-white shadow-xl shadow-slate-200/50 rounded-2xl border border-gray-100 p-2">
            <Search className="absolute left-4 text-gray-400" size={20} />
            <input
              className="w-full pl-14 pr-32 py-4 bg-transparent border-none focus:ring-0 text-lg placeholder:text-slate-400"
              placeholder="Search for courses, skills, topics..."
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applyFilters();
                }
              }}
            />
            <button
              className="absolute right-2 bg-primary text-white font-bold px-8 py-3.5 rounded-xl hover:brightness-110 active:scale-95 transition-all"
              onClick={applyFilters}
            >
              Search
            </button>
          </div>

        </div>

        {isAiLoading && <AiOverviewSkeleton />}
        {!isAiLoading && aiOverview?.picks?.length > 0 && <AiOverview data={aiOverview} />}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={pillClass(false)}
              onClick={() => setIsFilterDrawerOpen(true)}
            >
              <SlidersHorizontal size={16} />
              All filters
            </button>
            {HANDS_ON_PILLS.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                className={pillClass(activeHandsOn.includes(value))}
                onClick={() => toggleHandsOn(value)}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
            <FilterDropdown label="Language" active={activeLanguages.length > 0}>
              {languageOptions.map((language) => (
                <DropdownOption
                  key={language.key}
                  selected={activeLanguages.includes(language.key)}
                  onClick={() => toggleLanguage(language.key)}
                >
                  {language.label}
                </DropdownOption>
              ))}
            </FilterDropdown>
            <FilterDropdown label="Ratings" active={Boolean(activeRating)}>
              {(close) =>
                [
                  { label: "Any rating", value: "" },
                  { label: "4.5 stars & up", value: "4.5" },
                  { label: "4.0 stars & up", value: "4" },
                  { label: "3.5 stars & up", value: "3.5" },
                ].map((item) => (
                  <DropdownOption
                    key={item.value || "any"}
                    selected={activeRating === item.value}
                    onClick={() => {
                      pushQuery({ rating: item.value });
                      close();
                    }}
                  >
                    {item.label}
                  </DropdownOption>
                ))
              }
            </FilterDropdown>
            <FilterDropdown label="Level" active={Boolean(activeLevel)}>
              {(close) =>
                difficultyOptions.map((item) => (
                  <DropdownOption
                    key={item.label}
                    selected={activeLevel === item.value}
                    onClick={() => {
                      pushQuery({ levelId: item.value });
                      close();
                    }}
                  >
                    {item.label}
                  </DropdownOption>
                ))
              }
            </FilterDropdown>
          </div>
          <Select
            className="flex items-center gap-2 text-sm font-bold bg-transparent border-none focus:ring-0 cursor-pointer"
            value={sortBy}
            options={SORT_OPTIONS}
            onChange={(event) => setSortBy(event.target.value)}
          />
        </div>

        <h2 className="mb-6 text-2xl sm:text-3xl font-extrabold text-slate-900 serif-heading">
          Showing {total} results
        </h2>
        {isLoading ? (
          <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-[15px]">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-[15px]">
            {courses.map((course) => (
              <FeaturedCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>

      <div
        className={`fixed inset-0 z-[90] transition ${
          isFilterDrawerOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-slate-900/40 transition-opacity ${
            isFilterDrawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsFilterDrawerOpen(false)}
        />

        <aside
          className={`absolute left-0 top-0 h-full w-full max-w-[440px] bg-white shadow-2xl transition-transform duration-300 ${
            isFilterDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Filters</h3>
              <p className="text-xs text-slate-500">Refine your course results</p>
            </div>
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(false)}
              className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="h-[calc(100%-136px)] overflow-y-auto px-5 py-4 space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Difficulty level</h4>
              <div className="space-y-2.5">
                {difficultyOptions.map((level) => (
                  <Radio
                    key={level.label}
                    name="difficulty-level"
                    value={level.value}
                    checked={draftFilters.levelId === level.value}
                    onChange={() =>
                      setDraftFilters((prev) => ({ ...prev, levelId: level.value }))
                    }
                    label={level.label}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Reviews</h4>
              <div className="space-y-2.5">
                {[
                  { label: "4.5 stars & up", value: "4.5" },
                  { label: "4.0 stars & up", value: "4" },
                  { label: "3.5 stars & up", value: "3.5" },
                ].map((item) => (
                  <Radio
                    key={item.value}
                    name="rating-filter"
                    value={item.value}
                    checked={draftFilters.rating === item.value}
                    onChange={() =>
                      setDraftFilters((prev) => ({ ...prev, rating: item.value }))
                    }
                    label={item.label}
                    rightContent={
                      <span className="inline-flex text-amber-500">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={`${item.value}-${index}`}
                            className={`h-3.5 w-3.5 ${
                              index < Math.floor(Number(item.value))
                                ? "fill-current"
                                : "text-slate-300"
                            }`}
                          />
                        ))}
                      </span>
                    }
                  />
                ))}
                <button
                  type="button"
                  className="text-xs font-semibold text-primary"
                  onClick={() =>
                    setDraftFilters((prev) => ({ ...prev, rating: "" }))
                  }
                >
                  Clear rating
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Topics</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {visibleTopicOptions.map((topic) => (
                  <Checkbox
                    key={topic.id}
                    checked={draftFilters.topics.includes(topic.slug)}
                    onChange={() => toggleMultiFilter("topics", topic.slug)}
                    label={topic.title}
                    count={topic.count}
                  />
                ))}
              </div>
              {topicOptions.length > 12 ? (
                <button
                  type="button"
                  className="mt-3 text-xs font-semibold text-primary"
                  onClick={() => setShowAllTopics((prev) => !prev)}
                >
                  {showAllTopics ? "Show less topics" : "Show more topics"}
                </button>
              ) : null}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Price</h4>
              <div className="space-y-2">
                {[
                  { label: "Paid", value: "paid" },
                  { label: "Free", value: "free" },
                ].map((item) => (
                  <Checkbox
                    key={item.value}
                    checked={draftFilters.price.includes(item.value)}
                    onChange={() => toggleMultiFilter("price", item.value)}
                    label={item.label}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Language</h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {languageOptions.map((language) => (
                  <Checkbox
                    key={language.key}
                    checked={draftFilters.language.includes(language.key)}
                    onChange={() => toggleMultiFilter("language", language.key)}
                    label={language.label}
                    count={language.count}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-bold text-slate-900 mb-3">Hands-on practice</h4>
              <div className="space-y-2">
                {[
                  { label: "Quizzes", value: "quizzes" },
                  { label: "Coding exercise", value: "coding-exercise" },
                  { label: "Practice tests", value: "practice-tests" },
                  { label: "Role plays", value: "role-plays" },
                ].map((item) => (
                  <Checkbox
                    key={item.value}
                    checked={draftFilters.handsOn.includes(item.value)}
                    onChange={() => toggleMultiFilter("handsOn", item.value)}
                    label={item.label}
                  />
                ))}
              </div>
            </section>
          </div>

          <div className="h-[72px] border-t border-slate-200 bg-white px-5 py-3 flex items-center gap-3">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={applyFilters}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Apply filters
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
