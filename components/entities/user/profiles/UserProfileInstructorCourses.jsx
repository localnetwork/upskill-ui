import BaseApi from "@/lib/api/_base.api";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import CourseCard from "../../course/CourseCard";

export default function UserProfileInstructorCourses({ profile }) {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    async function fetchInstructorCourses() {
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/instructor/courses/${profile.id}`,
        );
        setCourses(response.data.data);
      } catch (error) {
        console.error("Error fetching instructor courses:", error);
      }
    }

    if (profile?.id) {
      fetchInstructorCourses();
    }
  }, [profile]);

  const featuredIds = profile?.storefront?.featured_course_ids;
  const featuredCourses = useMemo(
    () =>
      (featuredIds || [])
        .map((id) => courses.find((course) => course.id === id))
        .filter(Boolean),
    [courses, featuredIds],
  );

  const hasFeatured = featuredCourses.length > 0;

  return (
    <div className="bg-gray-50 py-[60px]">
      <div className="container px-4 sm:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-[28px] font-bold text-[#2a2b3f] lg:text-[36px]">
            Start building new skills
          </h2>
          <p className="mt-2 text-[16px] text-gray-600 lg:text-[20px]">
            Not sure where to start? Explore my full course library, anytime.
          </p>
        </div>

        {hasFeatured && (
          <div className="mb-12">
            <h3 className="mb-4 text-[20px] font-bold">Featured courses</h3>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {featuredCourses.map((course) => {
                const cover = course.cover_image?.path;
                return (
                  <Link
                    key={course.id}
                    href={`/courses/${course.slug}`}
                    className="group relative block min-h-[280px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#2a2b3f] to-[#4f46e5]"
                  >
                    {cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={course.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 p-5 text-white">
                      <div className="text-[18px] font-bold leading-snug">
                        {course.title}
                      </div>
                      {course.subtitle && (
                        <div className="mt-1 line-clamp-2 text-[14px] text-white/80">
                          {course.subtitle}
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-1 text-[13px]">
                        <Star
                          size={14}
                          fill="currentColor"
                          className="text-amber-300"
                        />
                        {Number(course.stats?.average_rating || 0).toFixed(1)}
                        <span className="text-white/70">
                          ({Number(course.stats?.total_reviews || 0)} ratings)
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <h3 className="mb-4 text-[20px] font-bold">All courses</h3>
        {courses.length > 0 ? (
          <div className="flex snap-x gap-5 overflow-x-auto pb-4">
            {courses.map((course) => (
              <div key={course.id} className="w-[290px] shrink-0 snap-start">
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            This instructor has not published any courses yet.
          </p>
        )}
      </div>
    </div>
  );
}
