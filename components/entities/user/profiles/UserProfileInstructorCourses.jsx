import BaseApi from "@/lib/api/_base.api";
import { useEffect, useState } from "react";
import CourseCard from "../../course/CourseCard";

export default function UserProfileInstructorCourses({ profile }) {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    async function fetchInstructorCourses() {
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/instructor/courses/${profile.id}`
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

  return (
    <div className="mt-[50px]">
      <h2 className="font-semibold text-[30px] mb-4">My Courses</h2>

      {courses.length > 0 ? (
        <div className="grid grid-cols-3 gap-[20px]">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">
          This instructor has not published any courses yet.
        </p>
      )}
    </div>
  );
}
