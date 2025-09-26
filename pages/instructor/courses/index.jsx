import InstructorCoursesList from "@/components/entities/instructor/InstructorCoursesList";
import InstructorCoursesPagination from "@/components/entities/instructor/InstructorCoursesPagination";
import InstructorLayout from "@/components/partials/InstructorLayout";
import BaseApi from "@/lib/api/_base.api";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Page() {
  const levels = [
    { title: "Beginner", value: 1 },
    { title: "Intermediate", value: 2 },
    { title: "Advanced", value: 3 },
  ];

  const [params, setParams] = useState({
    title: "",
    instructional_level: "", // no default selection
    page: 1,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAuthoredCourses = async (overrideParams = params) => {
    setIsLoading(true);
    try {
      const queryParams = {
        title: overrideParams.title,
        page: overrideParams.page,
      };
      if (overrideParams.instructional_level) {
        queryParams.instructional_level = overrideParams.instructional_level;
      }

      const query = new URLSearchParams(queryParams).toString();
      const response = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/authored?${query}`
      );

      setCourses(response.data.data || []);
      setTotalPages(response.data.pagination?.total_pages || 1);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial data on mount
  useEffect(() => {
    fetchAuthoredCourses();
  }, []);

  // Reactive fetch when instructional_level changes
  useEffect(() => {
    if (params.instructional_level) {
      fetchAuthoredCourses({ ...params, page: 1 });
    }
  }, [params.instructional_level]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedParams = { ...params, page: 1 }; // reset page to 1
    setParams(updatedParams);
    fetchAuthoredCourses(updatedParams);
  };

  const handlePageChange = (newPage) => {
    const updatedParams = { ...params, page: newPage };
    setParams(updatedParams);
    fetchAuthoredCourses(updatedParams);
  };

  return (
    <InstructorLayout>
      <div>
        <h1 className="text-[40px] font-semibold mb-4">Courses</h1>

        <div className="flex justify-between items-center mb-6 gap-4">
          <form className="flex gap-2" onSubmit={handleSubmit}>
            <input
              type="text"
              value={params.title}
              onChange={(e) => setParams({ ...params, title: e.target.value })}
              className="border min-w-[200px] border-gray-300 p-3 rounded-md"
              placeholder="Search courses..."
            />

            <select
              value={params.instructional_level}
              onChange={(e) =>
                setParams({ ...params, instructional_level: e.target.value })
              }
              className="border border-gray-300 p-3 rounded-md"
            >
              <option value="">Select level</option>
              {levels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.title}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="flex shadow-md bg-[#0056D2] text-white font-semibold px-[20px] py-[10px] rounded-[10px] items-center gap-[10px] hover:opacity-90"
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
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </button>
          </form>

          <Link
            href="/instructor/courses/create"
            className="flex shadow-md bg-[#0056D2] text-white font-semibold px-[30px] py-[10px] rounded-[10px] items-center gap-[10px] hover:opacity-90"
          >
            New Course
          </Link>
        </div>

        <InstructorCoursesList courses={courses} isLoading={isLoading} />

        <InstructorCoursesPagination
          totalPages={totalPages}
          handlePageChange={handlePageChange}
          params={params}
        />
      </div>
    </InstructorLayout>
  );
}
