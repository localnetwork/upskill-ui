import CourseCard from "@/components/entities/course/CourseCard";
import BaseApi from "@/lib/api/_base.api";
import { useEffect, useState } from "react";

export default function Browse() {
  const [courses, setCourses] = useState([]);
  const fetchCourses = async () => {
    try {
      const response = await BaseApi.get(
        process.env.NEXT_PUBLIC_API_URL + "/courses"
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
    <div className="py-[50px]">
      <div className="container">
        <div className="grid grid-cols-3 gap-[15px]">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </div>
  );
}
