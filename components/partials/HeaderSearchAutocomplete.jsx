import { Children, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Loader2, Search } from "lucide-react";
import BaseApi from "@/lib/api/_base.api";

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

export default function HeaderSearchAutocomplete() {
  const router = useRouter();
  const containerRef = useRef(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/discovery`,
          { params: { q: query, limit: 5 } },
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
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, query]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
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
    <div className="relative w-48 lg:w-64" ref={containerRef}>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"
        size={15}
      />
      <input
        className="w-full pl-9 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-sm focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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

      {isOpen && (
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
                      className="block px-2 py-1.5 rounded-lg hover:bg-slate-50 text-sm text-slate-700"
                      onClick={() => setIsOpen(false)}
                    >
                      {topic.title}
                    </Link>
                  ))
                : null}
            </Section>

            <Section title="Matched courses">
              {matchedCourses.length > 0
                ? matchedCourses.map((course) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.slug}`}
                      className="block px-2 py-1.5 rounded-lg hover:bg-slate-50 text-sm text-slate-700"
                      onClick={() => setIsOpen(false)}
                    >
                      {course.title}
                    </Link>
                  ))
                : null}
            </Section>

            <Section title="Matched users">
              {matchedUsers.length > 0
                ? matchedUsers.map((user) => (
                    <Link
                      key={user.id}
                      href={`/user/${user.username}`}
                      className="block px-2 py-1.5 rounded-lg hover:bg-slate-50 text-sm text-slate-700"
                      onClick={() => setIsOpen(false)}
                    >
                      {user.first_name || user.last_name
                        ? `${user.first_name} ${user.last_name}`.trim()
                        : user.username}
                    </Link>
                  ))
                : null}
            </Section>

            <Section title="Suggested courses">
              {suggestedCourses.map((course) => (
                <Link
                  key={`suggested-${course.id}`}
                  href={`/courses/${course.slug}`}
                  className="block px-2 py-1.5 rounded-lg hover:bg-slate-50 text-sm text-slate-700"
                  onClick={() => setIsOpen(false)}
                >
                  {course.title}
                </Link>
              ))}
            </Section>

            <Section title="Trending courses">
              {trendingCourses.map((course) => (
                <Link
                  key={`trending-${course.id}`}
                  href={`/courses/${course.slug}`}
                  className="block px-2 py-1.5 rounded-lg hover:bg-slate-50 text-sm text-slate-700"
                  onClick={() => setIsOpen(false)}
                >
                  {course.title}
                </Link>
              ))}
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}
