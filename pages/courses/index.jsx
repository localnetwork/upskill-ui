import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Search, SlidersHorizontal } from "lucide-react";
import CourseCard from "@/components/entities/course/CourseCard";
import Select from "@/components/forms/Select";
import BaseApi from "@/lib/api/_base.api";

function asArray(value) {
  return Array.isArray(value) ? value : [];
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

  useEffect(() => {
    setQuery(String(router.query.search || ""));
  }, [router.query.search]);

  useEffect(() => {
    const fetchDiscovery = async () => {
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/discovery`,
          { params: { q: router.query.search || "", limit: 8 } },
        );
        setDiscovery(response?.data?.data || null);
      } catch (_error) {
        setDiscovery(null);
      }
    };

    fetchDiscovery();
  }, [router.query.search]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const [coursesResult, cartResult, enrollmentsResult] = await Promise.allSettled([
          BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
            params: {
              ...(router.query.search ? { search: router.query.search } : {}),
              ...(router.query.topic ? { topic: router.query.topic } : {}),
            },
          }),
          BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/cart`),
          BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/enrollments`),
        ]);

        const baseCourses =
          coursesResult.status === "fulfilled"
            ? asArray(coursesResult.value?.data?.data)
            : [];

        const cartCourseIds =
          cartResult.status === "fulfilled"
            ? new Set(
                asArray(cartResult.value?.data?.data?.cartItems)
                  .map((item) => item?.course?.id)
                  .filter(Boolean),
              )
            : new Set();

        const enrolledCourseIds =
          enrollmentsResult.status === "fulfilled"
            ? new Set(
                asArray(enrollmentsResult.value?.data?.data)
                  .map((item) => item?.course?.id)
                  .filter(Boolean),
              )
            : new Set();

        const mergedCourses = baseCourses.map((course) => ({
          ...course,
          is_in_cart: Boolean(course?.is_in_cart || cartCourseIds.has(course.id)),
          is_enrolled: Boolean(course?.is_enrolled || enrolledCourseIds.has(course.id)),
        }));

        setCourses(mergedCourses);
        setTotal(Number(coursesResult?.value?.data?.meta?.total || mergedCourses.length));
      } catch (_error) {
        setCourses([]);
        setTotal(0);
      }
    };

    fetchCourses();
  }, [router.query.search, router.query.topic]);

  const trendingTags = useMemo(
    () => asArray(discovery?.trending_topics).slice(0, 6),
    [discovery?.trending_topics],
  );

  const filteredCourses = useMemo(() => {
    const rows = [...courses];
    if (sortBy === "Newest") {
      rows.sort(
        (a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime(),
      );
    }
    return rows;
  }, [courses, sortBy]);

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
                  const trimmed = query.trim();
                  router.push(
                    trimmed
                      ? `/courses?search=${encodeURIComponent(trimmed)}`
                      : "/courses",
                  );
                }
              }}
            />
            <button
              className="absolute right-2 bg-primary text-white font-bold px-8 py-3.5 rounded-xl hover:brightness-110 active:scale-95 transition-all"
              onClick={() => {
                const trimmed = query.trim();
                router.push(
                  trimmed
                    ? `/courses?search=${encodeURIComponent(trimmed)}`
                    : "/courses",
                );
              }}
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
            <label
              className="cursor-pointer p-3 bg-primary text-white rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center shadow-lg shadow-blue-200 active:scale-95 group"
              htmlFor="filter-modal-toggle"
            >
              <SlidersHorizontal size={20} className="group-hover:animate-pulse" />
              <span className="ml-2 font-bold text-sm hidden sm:inline">Filter</span>
            </label>
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

        <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-[15px]">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </div>
  );
}
