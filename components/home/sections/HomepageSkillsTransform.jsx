import { useEffect, useMemo, useState } from "react";
import BaseApi from "@/lib/api/_base.api";
import CourseCard from "@/components/entities/course/CourseCard";

export default function HomepageSkillsTransform() {
  const [topics, setTopics] = useState([]);
  const [activeTopicSlug, setActiveTopicSlug] = useState("");
  const [courses, setCourses] = useState([]);
  const [isTopicsLoading, setIsTopicsLoading] = useState(true);
  const [isCoursesLoading, setIsCoursesLoading] = useState(false);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setIsTopicsLoading(true);
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/analytics/topics/trending?limit=6&days=30&nocache=true`,
        );
        const rows = Array.isArray(response?.data?.data?.topics)
          ? response.data.data.topics
          : [];
        setTopics(rows);
        setActiveTopicSlug(rows[0]?.slug || "");
      } catch (_error) {
        setTopics([]);
        setActiveTopicSlug("");
      } finally {
        setIsTopicsLoading(false);
      }
    };

    fetchTopics();
  }, []);

  useEffect(() => {
    if (!activeTopicSlug) {
      setCourses([]);
      return;
    }

    const fetchCourses = async () => {
      try {
        setIsCoursesLoading(true);
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/courses?topic=${encodeURIComponent(activeTopicSlug)}&sort=best_selling&limit=6&nocache=true`,
        );
        const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
        setCourses(rows);
      } catch (_error) {
        setCourses([]);
      } finally {
        setIsCoursesLoading(false);
      }
    };

    fetchCourses();
  }, [activeTopicSlug]);

  const activeTopic = useMemo(
    () => topics.find((item) => item.slug === activeTopicSlug) || null,
    [topics, activeTopicSlug],
  );

  return (
    <section data-home-section="" className="py-18 md:py-22 bg-slate-50">
      <div className="container">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Skills to transform your career and life
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            Explore the top 6 trending topics and their best-selling courses.
          </p>
        </div>

        {isTopicsLoading ? (
          <div className="mb-6 flex flex-wrap gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-10 w-36 animate-pulse rounded-full bg-slate-200"
              />
            ))}
          </div>
        ) : (
          <div className="mb-6 flex flex-wrap gap-3">
            {topics.map((topic) => {
              const isActive = activeTopicSlug === topic.slug;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setActiveTopicSlug(topic.slug)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "border-[#0056d2] bg-[#0056d2] text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {topic.title}
                </button>
              );
            })}
          </div>
        )}

        {activeTopic ? (
          <p className="mb-5 text-sm text-slate-500">
            Showing best-selling courses for <strong>{activeTopic.title}</strong>
          </p>
        ) : null}

        {isCoursesLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        ) : !courses.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700">
            No courses found for this topic yet.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <div key={course.id} className="course-entry">
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
