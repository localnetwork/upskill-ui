import { Children, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Loader2, Search, Tag } from "lucide-react";
import BaseApi from "@/lib/api/_base.api";

const rowClass =
  "flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-sm text-slate-700";

function CourseRow({ course, onNavigate }) {
  return (
    <Link href={`/courses/${course.slug}`} className={rowClass} onClick={onNavigate}>
      <span className="h-10 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
        {course.cover_image?.path && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.cover_image.path}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        )}
      </span>
      <span className="line-clamp-2">{course.title}</span>
    </Link>
  );
}

function Section({ title, children }) {
  if (Children.count(children) === 0) return null;
  return (
    <section className="px-3 py-2 border-b border-slate-100 last:border-b-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function HeaderSearchAutocomplete({ className }) {
  const router = useRouter();
  const containerRef = useRef(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/discovery`,
          { params: { q: debouncedQuery, limit: 5 } },
        );
        if (!cancelled) {
          setResult(response?.data?.data || null);
        }
      } catch (_error) {
        if (!cancelled) {
          setResult(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, debouncedQuery]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const suggestions = result?.suggestions || {};
  const matchedTopics = asArray(suggestions.topics);
  const matchedCourses = asArray(suggestions.courses);
  const matchedUsers = asArray(suggestions.users);
  const suggestedCourses = asArray(suggestions.suggested_courses);
  const trendingCourses = asArray(suggestions.trending_courses);
  const trendingTopics = asArray(result?.trending_topics).slice(0, 12);
  const hasMatches =
    matchedTopics.length + matchedCourses.length + matchedUsers.length > 0;

  const navigateToBrowse = () => {
    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/courses");
    } else {
      router.push(`/courses?search=${encodeURIComponent(trimmed)}`);
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className || "w-48 lg:w-64"}`} ref={containerRef}>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-[71]"
        size={15}
      />
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50"
          aria-hidden="true"
          onMouseDown={() => setIsOpen(false)}
        />
      )}
      <input
        className="relative z-[70] w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        placeholder="Search..."
        type="text"
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            navigateToBrowse();
          }
        }}
      />

      {isOpen && !query.trim() && (
        <div className="absolute top-12 right-0 w-[720px] max-w-[90vw] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[70] overflow-hidden p-6">
          {trendingTopics.length > 0 && (
            <>
              <h3 className="text-base font-bold text-slate-900 mb-3">
                Trending on Upskill
              </h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {trendingTopics.map((topic) => (
                  <Link
                    key={topic.id || topic.slug}
                    href={`/courses?topic=${encodeURIComponent(topic.slug)}`}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                    onClick={() => setIsOpen(false)}
                  >
                    {String(topic.title || "").toLowerCase()}
                  </Link>
                ))}
              </div>
            </>
          )}

          {(trendingCourses.length > 0 || loading) && (
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              Start with these learner favorites
              {loading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
            </h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {trendingCourses.slice(0, 3).map((course) => (
              <Link
                key={`fav-${course.id}`}
                href={`/courses/${course.slug}`}
                className="rounded-xl border border-slate-200 p-2.5 hover:shadow-md transition-shadow"
                onClick={() => setIsOpen(false)}
              >
                <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-slate-100">
                  {course.cover_image?.path && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.cover_image.path}
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-bold text-slate-900">
                  {course.title}
                </p>
                <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                  {[course.category?.title, course.educator && `${course.educator.first_name} ${course.educator.last_name}`.trim()]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-6 text-sm text-slate-700">
            Not sure where to start?{" "}
            <Link
              href="/courses"
              className="font-semibold text-slate-900 hover:underline"
              onClick={() => setIsOpen(false)}
            >
              Browse all courses →
            </Link>
          </div>
        </div>
      )}

      {isOpen && query.trim() && (
        <div className="absolute top-12 left-0 w-[420px] max-w-[80vw] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[70] overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={navigateToBrowse}
              className="text-xs font-semibold text-primary hover:underline"
            >
              View all courses
            </button>
            {loading && (
              <span className="inline-flex items-center text-[11px] text-slate-400">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Searching
              </span>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            <Section title="Matched topics">
              {matchedTopics.length > 0
                ? matchedTopics.map((topic) => (
                    <Link
                      key={topic.id}
                      href={`/courses?topic=${encodeURIComponent(topic.slug)}`}
                      className={rowClass}
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Tag size={18} />
                      </span>
                      <span className="line-clamp-1">{topic.title}</span>
                    </Link>
                  ))
                : null}
            </Section>

            <Section title="Matched courses">
              {matchedCourses.length > 0
                ? matchedCourses.map((course) => (
                    <CourseRow key={course.id} course={course} onNavigate={() => setIsOpen(false)} />
                  ))
                : null}
            </Section>

            <Section title="Matched users">
              {matchedUsers.length > 0
                ? matchedUsers.map((user) => {
                    const name =
                      user.first_name || user.last_name
                        ? `${user.first_name} ${user.last_name}`.trim()
                        : user.username;
                    return (
                      <Link
                        key={user.id}
                        href={`/user/${user.username}`}
                        className={rowClass}
                        onClick={() => setIsOpen(false)}
                      >
                        {user.user_picture?.path ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.user_picture.path}
                            alt={name}
                            className="h-10 w-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                            {name
                              .split(/\s+/)
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block line-clamp-1">{name}</span>
                          {user.headline && (
                            <span className="block line-clamp-1 text-xs text-slate-400">
                              {user.headline}
                            </span>
                          )}
                        </span>
                      </Link>
                    );
                  })
                : null}
            </Section>

            <Section title="Suggested courses">
              {hasMatches
                ? []
                : suggestedCourses.map((course) => (
                    <CourseRow
                      key={`suggested-${course.id}`}
                      course={course}
                      onNavigate={() => setIsOpen(false)}
                    />
                  ))}
            </Section>

            <Section title="Trending courses">
              {hasMatches
                ? []
                : trendingCourses.map((course) => (
                    <CourseRow
                      key={`trending-${course.id}`}
                      course={course}
                      onNavigate={() => setIsOpen(false)}
                    />
                  ))}
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}
