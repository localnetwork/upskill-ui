import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BaseApi from "@/lib/api/_base.api";

function fullName(person = {}) {
  const name = `${person?.first_name || ""} ${person?.last_name || ""}`.trim();
  return name || person?.username || "Educator";
}

function initials(name = "") {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function CourseCard({ item }) {
  return (
    <Link
      href={`/courses/${item.slug}`}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300"
    >
      {item?.cover_image?.path ? (
        <img
          src={item.cover_image.path}
          alt={item.title}
          className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover"
        />
      ) : (
        <div className="h-14 w-14 shrink-0 rounded-lg bg-gradient-to-br from-indigo-100 to-sky-100" />
      )}
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-semibold text-slate-900">{item.title}</p>
        <p className="mt-1 text-xs text-slate-500">Popular right now</p>
      </div>
    </Link>
  );
}

function TopicCard({ item }) {
  return (
    <Link
      href={`/courses?topic=${encodeURIComponent(item.slug)}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300"
    >
      <div className="min-w-0">
        <p className="line-clamp-1 text-sm font-semibold text-slate-900">{item.title}</p>
        <p className="mt-1 text-xs text-slate-500">
          {item.course_count} courses · {item.page_views || 0} views
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        Trending
      </span>
    </Link>
  );
}

function UserCard({ item }) {
  const name = fullName(item);
  return (
    <Link
      href={item?.username ? `/user/${item.username}` : "#"}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
        {initials(name)}
      </div>
      <div className="min-w-0">
        <p className="line-clamp-1 text-sm font-semibold text-slate-900">{name}</p>
        <p className="mt-1 text-xs text-slate-500">
          {item.course_count || 0} trending courses
        </p>
      </div>
    </Link>
  );
}

export default function HomePopular() {
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [educators, setEducators] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [discoveryRes, topicsRes] = await Promise.all([
          BaseApi.get(
            `${process.env.NEXT_PUBLIC_API_URL}/courses/discovery?limit=8&days=30&nocache=true`,
          ),
          BaseApi.get(
            `${process.env.NEXT_PUBLIC_API_URL}/analytics/topics/trending?limit=8&days=30&nocache=true`,
          ),
        ]);

        const discovery = discoveryRes?.data?.data || {};
        const trendingCourses = Array.isArray(discovery?.trending_courses)
          ? discovery.trending_courses
          : [];
        const trendingTopics = Array.isArray(topicsRes?.data?.data?.topics)
          ? topicsRes.data.data.topics
          : Array.isArray(discovery?.trending_topics)
            ? discovery.trending_topics
            : [];

        setCourses(trendingCourses.slice(0, 3));
        setTopics(trendingTopics.slice(0, 3));

        const educatorMap = new Map();
        for (const course of trendingCourses) {
          const educator = course?.educator;
          if (!educator?.id) continue;
          if (!educatorMap.has(educator.id)) {
            educatorMap.set(educator.id, {
              ...educator,
              score: 0,
              course_count: 0,
            });
          }
          const entry = educatorMap.get(educator.id);
          entry.score += Number(course?.trend_score || 0);
          entry.course_count += 1;
        }

        const educatorRows = Array.from(educatorMap.values())
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.course_count - a.course_count;
          })
          .slice(0, 3);
        setEducators(educatorRows);
      } catch (_error) {
        setCourses([]);
        setTopics([]);
        setEducators([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const hasData = useMemo(
    () => courses.length || topics.length || educators.length,
    [courses.length, topics.length, educators.length],
  );

  return (
    <section data-home-section="" className="py-18 md:py-22">
      <div className="container">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Popular right now
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Live rankings powered by actual course and topic activity data.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-3">
            {["Trending Courses", "Hot Topics", "Top Educators"].map((title) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
                <div className="mt-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`${title}-${index}`}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
                    >
                      <div className="h-12 w-12 animate-pulse rounded-lg bg-slate-200" />
                      <div className="min-w-0 flex-1">
                        <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
                        <div className="mt-2 h-3 w-2/5 animate-pulse rounded bg-slate-200" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : !hasData ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-slate-700">
            No popularity data available yet.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-slate-900">Trending Courses</h3>
              <div className="mt-4 space-y-3">
                {courses.map((item) => (
                  <CourseCard key={item.id} item={item} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-slate-900">Hot Topics</h3>
              <div className="mt-4 space-y-3">
                {topics.map((item) => (
                  <TopicCard key={item.id} item={item} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-lg font-semibold text-slate-900">Top Educators</h3>
              <div className="mt-4 space-y-3">
                {educators.map((item) => (
                  <UserCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
