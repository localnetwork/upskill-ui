import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Search, SlidersHorizontal, Star, X } from "lucide-react";
import CourseCard from "@/components/entities/course/CourseCard";
import Select from "@/components/forms/Select";
import Checkbox from "@/components/forms/Checkbox";
import Radio from "@/components/forms/Radio";
import BaseApi from "@/lib/api/_base.api";

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

function TrendGroup({ title, rows = [], toHref }) {
  if (!rows.length) return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {rows.map((row) => (
          <Link
            key={row.id}
            href={toHref(row)}
            className="px-3 py-1.5 rounded-full border border-slate-200 text-sm text-slate-700 hover:border-primary hover:text-primary transition-colors"
          >
            {row.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("Most Relevant");
  const [discovery, setDiscovery] = useState(null);
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
    const fetchDiscovery = async () => {
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/discovery`,
          { params: { q: router.query.search || "", limit: 8, nocache: true } },
        );
        setDiscovery(response?.data?.data || null);
      } catch (_error) {
        setDiscovery(null);
      }
    };

    fetchDiscovery();
  }, [router.query.search]);

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
            ...(sortBy === "Newest" ? { sortBy: "newest" } : { sortBy: "best_selling" }),
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

  const trendingTags = useMemo(
    () => asArray(discovery?.trending_topics).slice(0, 6),
    [discovery?.trending_topics],
  );

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

          {trendingTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-400 mr-2 self-center uppercase tracking-wider">
                Trending topics:
              </span>
              {trendingTags.map((topic) => (
                <Link
                  key={topic.id}
                  className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium hover:border-primary transition-colors"
                  href={`/courses?topic=${encodeURIComponent(topic.slug)}`}
                >
                  {topic.title}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-8">
          <TrendGroup
            title="Trending categories"
            rows={asArray(discovery?.trending_categories).slice(0, 8)}
            toHref={(row) => `/categories/${row.slug}`}
          />
          <TrendGroup
            title="Trending subcategories"
            rows={asArray(discovery?.trending_subcategories).slice(0, 8)}
            toHref={(row) => `/categories/${row.slug}`}
          />
          <TrendGroup
            title="Trending topics"
            rows={asArray(discovery?.trending_topics).slice(0, 8)}
            toHref={(row) => `/courses?topic=${encodeURIComponent(row.slug)}`}
          />
        </div>

        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 serif-heading">
              Showing {total} results
            </h2>
            <button
              className="cursor-pointer p-3 bg-primary text-white rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center shadow-lg shadow-blue-200 active:scale-95 group"
              onClick={() => setIsFilterDrawerOpen(true)}
              type="button"
            >
              <SlidersHorizontal size={20} className="group-hover:animate-pulse" />
              <span className="ml-2 font-bold text-sm hidden sm:inline">Filter</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Sort by:</span>
            <Select
              className="text-sm font-bold bg-transparent border-none focus:ring-0 cursor-pointer"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option>Most Relevant</option>
              <option>Newest</option>
            </Select>
          </div>
        </div>

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
              <CourseCard key={course.id} course={course} />
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
