import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
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

function formatCount(value, singular, plural = `${singular}s`) {
  const count = Number(value || 0);
  return `${count.toLocaleString("en-PH")} ${count === 1 ? singular : plural}`;
}

function Column({ title, href, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between border-b border-slate-900 pb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
          {title}
        </h3>
        <Link
          href={href}
          className="group flex items-center gap-1 text-sm text-slate-500 hover:text-primary"
        >
          View all
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>
      <ol className="divide-y divide-slate-200">{children}</ol>
    </div>
  );
}

function Row({ href, rank, children }) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-4 py-4 transition-colors"
      >
        <span className="w-6 shrink-0 text-2xl font-bold tabular-nums text-slate-300 transition-colors group-hover:text-primary">
          {rank}
        </span>
        {children}
      </Link>
    </li>
  );
}

function CourseRow({ item, rank }) {
  return (
    <Row href={`/courses/${item.slug}`} rank={rank}>
      <div className="h-14 w-20 shrink-0 overflow-hidden rounded bg-slate-100">
        {item?.cover_image?.path && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.cover_image.path}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-semibold leading-snug text-slate-900 group-hover:text-primary">
          {item.title}
        </p>
        {item?.category?.title && (
          <p className="mt-1 line-clamp-1 text-sm text-slate-500">
            {item.category.title}
          </p>
        )}
      </div>
    </Row>
  );
}

function TopicRow({ item, rank }) {
  return (
    <Row href={`/courses?topic=${encodeURIComponent(item.slug)}`} rank={rank}>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 font-semibold text-slate-900 group-hover:text-primary">
          {item.title}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {formatCount(item.course_count, "course")} ·{" "}
          {formatCount(item.page_views, "view")}
        </p>
      </div>
    </Row>
  );
}

function EducatorRow({ item, rank }) {
  const name = fullName(item);
  return (
    <Row href={item?.username ? `/user/${item.username}` : "#"} rank={rank}>
      {item?.user_picture?.path ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.user_picture.path}
          alt=""
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
          {initials(name)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 font-semibold text-slate-900 group-hover:text-primary">
          {name}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {formatCount(item.course_count, "trending course")}
        </p>
      </div>
    </Row>
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

        setEducators(
          Array.from(educatorMap.values())
            .sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score;
              return b.course_count - a.course_count;
            })
            .slice(0, 3),
        );
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
        <div className="mb-10 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
            Popular right now
          </h2>
          <p className="mt-2 text-slate-600">
            The courses, topics and educators learners have engaged with most
            over the last 30 days.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
            {[0, 1, 2].map((col) => (
              <div key={col}>
                <div className="h-6 w-1/3 animate-pulse rounded bg-slate-100" />
                <div className="mt-4 space-y-4">
                  {[0, 1, 2].map((row) => (
                    <div
                      key={row}
                      className="h-16 animate-pulse rounded bg-slate-100"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : !hasData ? (
          <p className="text-slate-600">No popularity data available yet.</p>
        ) : (
          <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
            <Column title="Courses" href="/courses">
              {courses.map((item, index) => (
                <CourseRow key={item.id} item={item} rank={index + 1} />
              ))}
            </Column>
            <Column title="Topics" href="/courses">
              {topics.map((item, index) => (
                <TopicRow key={item.id} item={item} rank={index + 1} />
              ))}
            </Column>
            <Column title="Educators" href="/courses">
              {educators.map((item, index) => (
                <EducatorRow key={item.id} item={item} rank={index + 1} />
              ))}
            </Column>
          </div>
        )}
      </div>
    </section>
  );
}
