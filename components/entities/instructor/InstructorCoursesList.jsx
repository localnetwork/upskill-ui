import Image from "next/image";
import Link from "next/link";
import modalState from "@/lib/store/modalState";
import { Trash2, Pencil, ChartNoAxesColumn, Star } from "lucide-react";

export default function InstructorCoursesList({
  courses,
  isLoading,
  onDeleteDraftCourse,
  deletingCourseId,
}) {
  const skeletonRows = [1, 2, 3];

  const shimmer =
    "animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200";

  const formatRating = (value) => Number(value || 0).toFixed(2);

  const openDeleteModal = (course) => {
    if (typeof onDeleteDraftCourse !== "function") return;

    modalState.setState({
      modalInfo: {
        type: "INSTRUCTOR_DRAFT_COURSE_DELETE",
        title: "Delete Draft Course",
        size: "sm",
        data: {
          courseTitle: course?.title || "this draft course",
          onConfirm: async () => onDeleteDraftCourse(course?.id),
        },
      },
    });
  };

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {skeletonRows.map((row) => (
          <div
            key={`skeleton-${row}`}
            className="flex flex-col overflow-hidden border border-[oklch(86.72%_0.0192_282.72deg)] sm:flex-row"
          >
            <div className="w-full shrink-0 sm:w-[150px]">
              <div
                className={`${shimmer} h-[180px] w-full sm:h-full sm:min-h-[140px]`}
              />
            </div>

            <div className="grid min-w-0 flex-1 grid-cols-1 md:grid-cols-5">
              <div className="space-y-3 p-5 md:col-span-2">
                <div className={`${shimmer} h-5 w-[70%] rounded`} />
                <div className={`${shimmer} h-4 w-[35%] rounded`} />
                <div className={`${shimmer} h-3 w-[60%] rounded`} />
              </div>

              <div className="space-y-3 border-t border-[oklch(90%_0.01_280deg)] p-5 md:border-l md:border-t-0">
                <div className={`${shimmer} h-7 w-14 rounded`} />
                <div className={`${shimmer} h-4 w-[80%] rounded`} />
              </div>

              <div className="space-y-3 border-t border-[oklch(90%_0.01_280deg)] p-5 md:border-l md:border-t-0">
                <div className={`${shimmer} h-7 w-16 rounded`} />
                <div className={`${shimmer} h-4 w-[70%] rounded`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative grid gap-4">
      {courses?.length ? (
        courses.map((course) => {
          const totalEnrollments = Number(
            course?.stats?.total_enrollments || 0,
          );

          const canDeleteDraft =
            course?.published === "0" && totalEnrollments === 0;

          const isDeleting = deletingCourseId === course?.id;

          const basicsUrl = `/instructor/courses/${course.uuid}/basics`;
          const statisticsUrl = `/instructor/courses/${course.uuid}/statistics`;
          const reviewsUrl = `/instructor/courses/${course.uuid}/reviews`;

          return (
            <article
              key={course.id}
              className="group flex min-w-0 flex-col overflow-hidden border border-solid border-[oklch(86.72%_0.0192_282.72deg)] bg-white sm:flex-row"
            >
              {/* COURSE COVER */}
              <div className="relative w-full shrink-0 sm:w-[150px]">
                <Image
                  width={320}
                  height={180}
                  src={course?.cover_image?.path || "/placeholder-cover.webp"}
                  alt={course?.title || "Course cover"}
                  className="h-[180px] w-full object-cover sm:h-full sm:min-h-[150px]"
                />
              </div>

              <div className="grid min-w-0 flex-1 grid-cols-1 md:grid-cols-5">
                {/* COURSE DETAILS */}
                <div className="relative flex min-w-0 flex-col justify-between gap-4 p-4 sm:p-5 md:col-span-2">
                  {canDeleteDraft && (
                    <button
                      type="button"
                      className="absolute right-3 top-3 z-30 rounded-md p-2 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => openDeleteModal(course)}
                      aria-label="Delete draft course"
                      title="Delete draft course"
                      disabled={isDeleting}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}

                  <div className="min-w-0 pr-8">
                    <h3 className="break-words text-base font-bold leading-snug sm:text-lg">
                      {course.title}
                    </h3>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span
                        className={`text-xs font-bold uppercase tracking-wide ${
                          course?.published === "0"
                            ? "text-amber-700"
                            : "text-emerald-700"
                        }`}
                      >
                        {course?.published === "0" ? "Draft" : "Published"}
                      </span>

                      {course?.published === "0" && (
                        <span className="text-xs leading-relaxed text-gray-500">
                          Only visible to you and your students
                        </span>
                      )}
                    </div>
                  </div>

                  {/* MOBILE COURSE ACTION */}
                  <Link
                    href={basicsUrl}
                    className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-blue-200 px-3 py-2 text-sm font-semibold text-[#0056D2] transition hover:bg-blue-50 md:hidden"
                  >
                    <Pencil size={16} />
                    Edit / Manage Course
                  </Link>

                  {/* DESKTOP HOVER ACTION */}
                  <div className="pointer-events-none absolute inset-0 z-10 hidden items-center justify-center bg-white/90 p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex">
                    <Link
                      href={basicsUrl}
                      className="pointer-events-auto inline-flex items-center gap-2 rounded-md px-4 py-3 text-center font-semibold text-[#0056D2] hover:bg-blue-50"
                    >
                      <Pencil size={18} />
                      Edit / Manage Course
                    </Link>
                  </div>
                </div>

                {/* ENROLLMENTS */}
                <div className="group/stat relative flex min-w-0 flex-col justify-center gap-1 border-t border-[oklch(90%_0.01_280deg)] p-4 sm:p-5 md:border-l md:border-t-0">
                  <div className="text-2xl font-semibold tabular-nums">
                    {Number(course?.stats?.enrollments_this_month || 0)}
                  </div>

                  <div className="text-sm leading-snug text-gray-600">
                    Enrollments this month
                  </div>

                  {/* MOBILE STATISTICS LINK */}
                  <Link
                    href={statisticsUrl}
                    className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#0056D2] hover:underline md:hidden"
                  >
                    <ChartNoAxesColumn size={16} />
                    See Statistics
                  </Link>

                  {/* DESKTOP HOVER ACTION */}
                  <div className="pointer-events-none absolute inset-0 z-10 hidden items-center justify-center bg-white/90 p-3 opacity-0 transition-opacity duration-200 group-hover/stat:opacity-100 md:flex">
                    <Link
                      href={statisticsUrl}
                      className="pointer-events-auto rounded-md px-3 py-2 text-center text-base font-semibold text-[#0056D2] hover:bg-blue-50"
                    >
                      See Statistics
                    </Link>
                  </div>
                </div>

                {/* COURSE RATING */}
                <div className="group/review relative flex min-w-0 flex-col justify-center gap-1 border-t border-[oklch(90%_0.01_280deg)] p-4 sm:p-5 md:border-l md:border-t-0">
                  <div className="text-2xl font-semibold tabular-nums">
                    {formatRating(course?.stats?.average_rating)}
                  </div>

                  <div className="text-sm leading-snug text-gray-600">
                    Course Rating
                  </div>

                  {/* MOBILE REVIEWS LINK */}
                  <Link
                    href={reviewsUrl}
                    className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-[#0056D2] hover:underline md:hidden"
                  >
                    <Star size={16} />
                    See Reviews
                  </Link>

                  {/* DESKTOP HOVER ACTION */}
                  <div className="pointer-events-none absolute inset-0 z-10 hidden items-center justify-center bg-white/90 p-3 opacity-0 transition-opacity duration-200 group-hover/review:opacity-100 md:flex">
                    <Link
                      href={reviewsUrl}
                      className="pointer-events-auto rounded-md px-3 py-2 text-center text-base font-semibold text-[#0056D2] hover:bg-blue-50"
                    >
                      See Reviews
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })
      ) : (
        <p className="py-6 text-sm text-gray-500">No courses found.</p>
      )}
    </div>
  );
}
