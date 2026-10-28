import BaseApi from "@/lib/api/_base.api";
import { Star, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

function formatDuration(totalSeconds) {
  const hours = Number(totalSeconds || 0) / 3600;
  if (hours <= 0) return null;
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} mins`;
  return `${Number(hours.toFixed(1))} hours`;
}

function formatUpdated(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getMonth() + 1}/${date.getFullYear()}`;
}

export default function CourseMoreByAuthor({ slug, author }) {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    if (!slug) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/${encodeURIComponent(slug)}/more-by-author?limit=10`,
        );
        if (!cancelled) {
          setCourses(Array.isArray(response?.data?.data) ? response.data.data : []);
        }
      } catch (_error) {
        if (!cancelled) setCourses([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!courses.length) return null;

  const fullName = `${author?.firstname || ""} ${author?.lastname || ""}`.trim();

  return (
    <section id="more-by-author" className="mt-10">
      <h2 className="mb-6 font-secondary text-3xl font-black">
        More Courses by {fullName || "the Instructor"}
      </h2>
      <div className="flex flex-col gap-4">
        {courses.map((course) => {
          const duration = formatDuration(course.total_duration_seconds);
          const updated = formatUpdated(course.updated_at);
          const price = Number(course.price_tier?.price || 0);
          return (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="flex items-stretch gap-4 rounded-2xl border border-gray-200 bg-white p-4 transition hover:bg-slate-50 sm:gap-5 sm:p-5"
            >
              <Image
                alt={course.title}
                width={120}
                height={120}
                className="h-[60px] w-[60px] shrink-0 rounded-lg object-cover"
                src={course.cover_image?.path || "/placeholder-cover.webp"}
              />
              <div className="min-w-0 flex-1">
                <h3 className="mb-3 text-lg font-bold leading-snug text-slate-900 sm:text-xl">
                  {course.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 font-bold text-amber-700">
                    {Number(course.average_rating || 0).toFixed(1)}
                    <Star size={13} className="fill-amber-600 text-amber-600" />
                  </span>
                  <span className="flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 font-bold text-slate-700">
                    <UsersRound size={14} className="text-slate-500" />
                    {Number(course.total_learners || 0).toLocaleString()}
                  </span>
                  {duration ? (
                    <span className="rounded border border-gray-300 px-2 py-0.5 text-slate-500">
                      {duration}
                    </span>
                  ) : null}
                  {updated ? (
                    <span className="rounded border border-gray-300 px-2 py-0.5 text-slate-500">
                      Updated: {updated}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center border-l border-gray-200 pl-4 sm:pl-6">
                <span className="text-lg font-black text-slate-900">
                  {price > 0 ? `₱${price.toLocaleString()}` : "Free"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
