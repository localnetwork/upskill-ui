import Link from "next/link";
import courseStore from "@/lib/store/courseStore";
export default function CourseStripBar({ course }) {
  const courseManagement = courseStore((state) => state.courseManagement);
  return (
    <div className="bg-[#16161D] z-10 sticky top-[95px] py-[20px] text-white text-[18px] divider-top">
      <div className="container flex items-center gap-[20px] justify-between">
        <div className="flex items-center gap-[10px]">
          <span>
            <Link
              href="/instructor/courses"
              className="flex gap-[5px] hover:bg-[#3588FC] px-[10px] py-[5px] rounded-[5px] items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5 8.25 12l7.5-7.5"
                />
              </svg>
              Back to courses
            </Link>
          </span>
          <span className="font-bold">
            {courseManagement?.title || course.title}
          </span>
        </div>
        <div className="pr-[30px]">
          <div className="border flex items-center border-white p-[5px] px-[20px] pr-[5px] rounded-md cursor-pointer">
            Preview
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6 ml-1"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
