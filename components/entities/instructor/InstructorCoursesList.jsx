import Image from "next/image";
import Link from "next/link";

export default function InstructorCoursesList({ courses, isLoading }) {
  const skeletonRows = [1, 2, 3];
  const shimmer =
    "animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200";

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {skeletonRows.map((row) => (
          <div
            key={`skeleton-${row}`}
            className="flex flex-col md:flex-row border border-[oklch(86.72%_0.0192_282.72deg)]"
          >
            <div className="w-full md:w-[150px]">
              <div className={`${shimmer} w-full h-[140px] md:h-[100px]`} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 flex-1">
              <div className="col-span-1 md:col-span-2 p-[20px] space-y-3">
                <div className={`${shimmer} h-5 w-[70%] rounded`} />
                <div className={`${shimmer} h-4 w-[35%] rounded`} />
                <div className={`${shimmer} h-3 w-[60%] rounded`} />
              </div>

              <div className="p-[20px] border-t md:border-t-0 md:border-l border-[oklch(90%_0.01_280deg)] space-y-3">
                <div className={`${shimmer} h-7 w-14 rounded`} />
                <div className={`${shimmer} h-4 w-[80%] rounded`} />
              </div>

              <div className="p-[20px] border-t md:border-t-0 md:border-l border-[oklch(90%_0.01_280deg)] space-y-3">
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
    <div className="grid gap-4 relative">
      {courses.length ? (
        courses.map((course) => (
          <div
            key={course.id}
            className="flex flex-col md:flex-row border-[1px] border-solid border-[oklch(86.72%_0.0192_282.72deg)]"
          >
            <div className="w-full md:w-[150px] h-full">
              <Image
                width={320}
                height={100}
                src={
                  course?.cover_image?.path
                    ? course.cover_image.path
                    : "/placeholder-cover.webp"
                }
                alt={course.title}
                className="w-full object-cover h-[140px] md:h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 flex-1">
              {/* MANAGE COURSE */}
              <div className="relative group flex col-span-1 md:col-span-2 flex-col justify-between py-[15px] px-[20px]">
                <div className="group-hover:flex text-[20px] absolute top-0 left-0 w-full h-full hidden">
                  <Link
                    href={"/instructor/courses/" + course.uuid + "/basics"}
                    className="text-[#0056D2] flex items-center justify-center w-full h-full font-semibold px-[20px] py-[10px] rounded-[5px] hover:opacity-90 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <span className="bg-white opacity-70 absolute top-0 left-0 w-full h-full z-[-1]" />
                    Edit/Manage Course
                  </Link>
                </div>
                <span className="font-bold">{course.title}</span>
                <div className="flex mt-3  gap-[15px] items-center">
                  <span className="font-bold uppercase">
                    {course?.published === "0" ? "Draft" : "Published"}
                  </span>
                  {course?.published === "0" && (
                    <span className="text-[12px]">
                      Only visible to you and your students
                    </span>
                  )}
                </div>
              </div>
              <div className="relative col-span-1 group flex flex-col justify-between py-[15px] px-[20px] border-t md:border-t-0 md:border-l border-[oklch(90%_0.01_280deg)]">
                <div className="group-hover:flex text-[20px] absolute top-0 left-0 w-full h-full hidden">
                  <Link
                    href={"/instructor/courses/" + course.uuid + "/students"}
                    className="text-[#0056D2] flex items-center justify-center w-full h-full font-semibold px-[20px] py-[10px] rounded-[5px] hover:opacity-90 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <span className="bg-white opacity-70 absolute top-0 left-0 w-full h-full z-[-1]" />
                    See Students
                  </Link>
                </div>
                <div className="font-semibold text-[25px]">0</div>
                <div className="text-[15px]">Enrollments this month</div>
              </div>
              <div className="relative col-span-1 group flex flex-col justify-between py-[15px] px-[20px] border-t md:border-t-0 md:border-l border-[oklch(90%_0.01_280deg)]">
                <div className="group-hover:flex text-[20px] absolute top-0 left-0 w-full h-full hidden">
                  <Link
                    href={"/instructor/courses/" + course.uuid + "/reviews"}
                    className="text-[#0056D2] flex items-center justify-center w-full h-full font-semibold px-[20px] py-[10px] rounded-[5px] hover:opacity-90 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <span className="bg-white opacity-70 absolute top-0 left-0 w-full h-full z-[-1]" />
                    See Reviews
                  </Link>
                </div>
                <div className="font-semibold text-[25px]">0.00</div>
                <div className="text-[15px]">Course Rating</div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <>{!isLoading && <p>No courses found.</p>}</>
      )}
    </div>
  );
}
