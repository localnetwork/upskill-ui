import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Crown,
  Eye,
  Flame,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";
import BaseApi from "@/lib/api/_base.api";

const avatarColors = [
  "bg-slate-900",
  "bg-purple-600",
  "bg-teal-700",
  "bg-blue-600",
  "bg-rose-600",
];

const topicTints = [
  "bg-emerald-100 text-emerald-600",
  "bg-sky-100 text-sky-600",
  "bg-violet-100 text-violet-600",
];

const rankStyles = [
  "bg-amber-100 text-amber-600",
  "bg-slate-100 text-slate-500",
  "bg-orange-100 text-orange-600",
];

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

function PanelHeader({ icon: Icon, tone, title, subtitle, href, linkTone }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}
      >
        <Icon size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="line-clamp-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <Link
        href={href}
        className={`hidden shrink-0 items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold sm:flex ${linkTone}`}
      >
        View all <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function Panel({ children }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      {children}
    </div>
  );
}

function CourseCard({ item, rank }) {
  return (
    <Link
      href={`/courses/${item.slug}`}
      className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-3 transition-shadow hover:shadow-md"
    >
      <div className="relative h-[74px] w-[100px] shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-indigo-100 to-sky-100">
        {item?.cover_image?.path && (
          <img
            src={item.cover_image.path}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        )}
        <span className="absolute left-1.5 top-1.5 flex items-center gap-0.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
          <Flame size={10} /> #{rank}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-900">
          {item.title}
        </p>
        {item?.category?.title && (
          <span className="mt-1.5 inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
            {item.category.title}
          </span>
        )}
        <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
          <Users size={12} /> Popular right now
        </p>
      </div>
      <ChevronRight size={16} className="shrink-0 text-slate-400" />
    </Link>
  );
}

function TopicCard({ item, index }) {
  const Icon = index === 0 ? TrendingUp : index === 1 ? Users : Eye;
  return (
    <Link
      href={`/courses?topic=${encodeURIComponent(item.slug)}`}
      className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 transition-shadow hover:shadow-md"
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${topicTints[index % topicTints.length]}`}
      >
        <Icon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-bold text-slate-900">
          {item.title}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <Eye size={12} /> {item.course_count} courses · {item.page_views || 0}{" "}
          views
        </p>
      </div>
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
        <TrendingUp size={12} /> Trending
      </span>
      <ChevronRight size={16} className="shrink-0 text-slate-400" />
    </Link>
  );
}

function UserCard({ item, index }) {
  const name = fullName(item);
  return (
    <Link
      href={item?.username ? `/user/${item.username}` : "#"}
      className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 transition-shadow hover:shadow-md"
    >
      {item?.user_picture?.path ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.user_picture.path}
          alt={name}
          className="h-14 w-14 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ${avatarColors[index % avatarColors.length]}`}
        >
          {initials(name)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-bold text-slate-900">{name}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <BookOpen size={12} /> {item.course_count || 0} trending courses
        </p>
      </div>
      <span
        className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${rankStyles[index] || rankStyles[1]}`}
      >
        <Crown size={12} /> #{index + 1}
      </span>
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
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Flame size={28} />
            </span>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                Popular right now
              </h2>
              <p className="mt-1 text-sm text-slate-500 md:text-base">
                Live rankings powered by actual course and topic activity data.
              </p>
            </div>
          </div>
          <span className="hidden shrink-0 items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live updates
          </span>
        </div>

        {isLoading ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {["Trending Courses", "Hot Topics", "Top Educators"].map((title) => (
              <Panel key={title}>
                <div className="h-12 w-3/5 animate-pulse rounded-xl bg-slate-100" />
                <div className="mt-5 space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`${title}-${index}`}
                      className="h-[92px] animate-pulse rounded-xl bg-slate-100"
                    />
                  ))}
                </div>
              </Panel>
            ))}
          </div>
        ) : !hasData ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-slate-700">
            No popularity data available yet.
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            <Panel>
              <PanelHeader
                icon={GraduationCap}
                tone="bg-emerald-50 text-emerald-600"
                title="Trending Courses"
                subtitle="What learners are exploring right now"
                href="/courses"
                linkTone="bg-emerald-50 text-emerald-700"
              />
              <div className="mt-5 space-y-3">
                {courses.map((item, index) => (
                  <CourseCard key={item.id} item={item} rank={index + 1} />
                ))}
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                icon={Flame}
                tone="bg-violet-100 text-violet-600"
                title="Hot Topics"
                subtitle="Most active topics in the community"
                href="/courses"
                linkTone="bg-violet-50 text-violet-700"
              />
              <div className="mt-5 space-y-3">
                {topics.map((item, index) => (
                  <TopicCard key={item.id} item={item} index={index} />
                ))}
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                icon={GraduationCap}
                tone="bg-orange-50 text-orange-600"
                title="Top Educators"
                subtitle="Learn from the best in the community"
                href="/courses"
                linkTone="bg-orange-50 text-orange-700"
              />
              <div className="mt-5 space-y-3">
                {educators.map((item, index) => (
                  <UserCard key={item.id} item={item} index={index} />
                ))}
              </div>
            </Panel>
          </div>
        )}
      </div>
    </section>
  );
}
