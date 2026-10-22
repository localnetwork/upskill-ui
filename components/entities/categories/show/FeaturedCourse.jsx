import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Award, Star } from "lucide-react";
import BaseApi from "@/lib/api/_base.api";

function formatPrice(course) {
  const price = Number(course?.price_tier?.price || 0);
  if (price <= 0) return "Free";
  return `₱${price.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

// Shows the top rated course for a topic (`topicSlug`) or category (`categorySlug`).
export default function FeaturedCourse({ topicSlug, categorySlug, label }) {
  const [course, setCourse] = useState(null);

  useEffect(() => {
    if (!topicSlug && !categorySlug) return undefined;
    let cancelled = false;
    BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/courses`, {
      params: {
        sortBy: "top_rated",
        limit: 1,
        nocache: true,
        ...(topicSlug ? { topic: topicSlug } : { categorySlug }),
      },
    })
      .then((response) => {
        if (cancelled) return;
        const row = response?.data?.data?.[0] || null;
        setCourse(row && Number(row?.stats?.total_reviews || 0) > 0 ? row : null);
      })
      .catch(() => {
        if (!cancelled) setCourse(null);
      });
    return () => {
      cancelled = true;
    };
  }, [topicSlug, categorySlug]);

  if (!course) return null;

  const author = course?.author?.data || {};
  const authorName = `${author.firstname || ""} ${author.lastname || ""}`.trim();
  const rating = Number(course?.stats?.average_rating || 0);
  const reviews = Number(course?.stats?.total_reviews || 0);
  const image = course?.cover_image?.path;

  return (
    <section className="pt-12">
      <div className="container">
        <h2 className="mb-6 text-2xl font-headline font-extrabold tracking-tight text-on-surface md:text-3xl">
          Featured course
        </h2>
        <Link
          href={`/courses/${course.slug}`}
          className="group grid overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-lg md:grid-cols-[minmax(0,420px)_1fr]"
        >
          <div className="relative aspect-video bg-slate-100 md:aspect-auto md:min-h-[240px]">
            {image ? (
              <Image
                src={image}
                alt={course.title}
                fill
                sizes="(min-width: 768px) 420px, 100vw"
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="flex flex-col justify-center gap-3 p-6 md:p-8">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              <Award className="h-3.5 w-3.5" />
              {label || "Highest rated"}
            </span>
            <h3 className="text-xl font-bold leading-snug text-slate-900 group-hover:text-primary md:text-2xl">
              {course.title}
            </h3>
            {course.subtitle ? (
              <p className="line-clamp-2 text-slate-600">{course.subtitle}</p>
            ) : null}
            {authorName ? (
              <p className="text-sm text-slate-500">By {authorName}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-bold text-amber-700">{rating.toFixed(1)}</span>
              <span className="inline-flex text-amber-500">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={`h-4 w-4 ${
                      index < Math.round(rating) ? "fill-current" : "text-slate-300"
                    }`}
                  />
                ))}
              </span>
              <span className="text-slate-500">
                ({reviews.toLocaleString("en-PH")} ratings)
              </span>
            </div>
            <p className="text-xl font-bold text-slate-900">{formatPrice(course)}</p>
          </div>
        </Link>
      </div>
    </section>
  );
}
