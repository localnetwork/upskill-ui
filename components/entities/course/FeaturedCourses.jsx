import { useEffect, useState } from "react";
import BaseApi from "@/lib/api/_base.api";
import CourseCard from "./CourseCard";
export default function FeaturedCourses() {
  const [courses, setCourses] = useState([]);
  const fetchCourses = async () => {
    try {
      const response = await BaseApi.get(
        process.env.NEXT_PUBLIC_API_URL + "/courses",
      );
      setCourses(response.data.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };
  useEffect(() => {
    fetchCourses();
  }, []);
  return (
    <>
      <div className="grid grid-cols-4 gap-[15px]">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </>
  );
}
