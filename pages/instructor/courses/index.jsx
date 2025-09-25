import InstructorLayout from "@/components/partials/InstructorLayout";
import Link from "next/link";

export default function Page() {
  return (
    <InstructorLayout>
      <div>
        <h1 className="text-[40px] font-semibold">Courses</h1>

        <div className="flex justify-between">
          <div>
            <form className="flex gap-2">
              <input
                type="text"
                className="border min-w-[300px] border-[oklch(67.22%_0.0355_279.77deg)] p-3 rounded-md"
                placeholder="Search courses..."
              />
              <button
                type="submit"
                className="flex shadow-md bg-[#0056D2] w-full text-white font-semibold px-[20px] py-[10px] rounded-[10px] justify-center items-center gap-[10px] text-[18px] text-center hover:opacity-90 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-[25px] h-[25px]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </button>
            </form>
          </div>
          <div>
            <Link
              href="/instructor/courses/create"
              className="flex shadow-md bg-[#0056D2] w-full text-white font-semibold px-[30px] py-[10px] rounded-[10px] justify-center items-center gap-[10px] text-[18px] text-center hover:opacity-90 cursor-pointer"
            >
              Create
            </Link>
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
}
