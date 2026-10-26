import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react";
import BaseApi from "@/lib/api/_base.api";

function FeaturedCard({ course }) {
  const rating = Number(
    course?.stats?.average_rating ?? course?.average_rating ?? 0,
  );
  const reviews = Number(
    course?.stats?.total_reviews ?? course?.total_reviews ?? 0,
  );
  const instructor =
    `${course?.author?.data?.firstname || ""} ${course?.author?.data?.lastname || ""}`.trim();
  const author = course?.author?.data;
  const initials =
    `${author?.firstname?.[0] || ""}${author?.lastname?.[0] || ""}`.toUpperCase();
  const rawPicture = author?.user_picture?.path;
  const picturePath =
    rawPicture && !/^https?:\/\//.test(rawPicture)
      ? `${process.env.NEXT_PUBLIC_API_DOMAIN || ""}${rawPicture}`
      : rawPicture;
  const price = course?.price_tier?.price;
  const isFree = price === "0.00";

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="w-[240px] shrink-0 snap-start overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-lg"
    >
      <Image
        src={course?.cover_image?.path || "/placeholder-cover.webp"}
        alt={course.title}
        width={400}
        height={200}
        className="h-[130px] w-full object-cover"
      />
      <div className="p-4">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-900">
          {course.title}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          {picturePath ? (
            <Image
              src={picturePath}
              alt={instructor || "Instructor"}
              width={24}
              height={24}
              className="h-6 w-6 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
              {initials || "?"}
            </span>
          )}
          <div className="min-w-0">
            <p className="line-clamp-1 text-xs text-slate-500 !mb-0">
              {instructor || "Instructor"}
            </p>
            {author?.headline && (
              <p className="line-clamp-1 text-[11px] text-slate-400">
                {author.headline}
              </p>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs">
          <span className="font-semibold">{rating.toFixed(1)}</span>
          <Star size={12} className="fill-yellow-400 text-yellow-400" />
          <span className="text-slate-400">
            ({reviews.toLocaleString("en-PH")})
          </span>
        </div>
        <p className="mt-3 text-base font-bold text-slate-900">
          {isFree ? "Free" : `₱${price || "0.00"}`}
        </p>
      </div>
    </Link>
  );
}

export default function FeaturedCoursesCarouselSection() {
  const trackRef = useRef(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/courses`)
      .then((response) => setCourses(response?.data?.data || []))
      .catch((error) => console.error("Error fetching courses:", error));
  }, []);

  const scrollBy = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * 500, behavior: "smooth" });
  };

  if (!courses.length) return null;

  return (
    <section data-home-section="" className="bg-white py-12">
      <div className="container">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            Featured courses
          </h2>
          <Link
            href="/courses"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            View all courses <ArrowRight size={14} />
          </Link>
        </div>
        <div className="relative mt-5">
          <button
            type="button"
            aria-label="Previous courses"
            onClick={() => scrollBy(-1)}
            className="absolute -left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md hover:bg-slate-50 md:flex"
          >
            <ChevronLeft size={18} />
          </button>
          <div
            ref={trackRef}
            className="flex snap-x gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {courses.map((course) => (
              <FeaturedCard key={course.id} course={course} />
            ))}
          </div>
          <button
            type="button"
            aria-label="Next courses"
            onClick={() => scrollBy(1)}
            className="absolute -right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md hover:bg-slate-50 md:flex"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
