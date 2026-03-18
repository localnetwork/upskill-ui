import CourseCard from "@/components/entities/course/CourseCard";
import BaseApi from "@/lib/api/_base.api";
import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

export default function Browse() {
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
    <div className="py-[50px] bg-[#F9FAFB]">
      <div className="container">
        <div class="w-full mb-12">
          <div class="relative flex items-center bg-white shadow-xl shadow-slate-200/50 rounded-2xl border border-gray-100 p-2">
            <Search class="absolute left-4 text-gray-400" size={20} />
            <input
              class="w-full pl-14 pr-32 py-4 bg-transparent border-none focus:ring-0 text-lg placeholder:text-slate-400"
              placeholder="Search for courses, skills, or mentors..."
              type="text"
            />
            <button class="absolute right-2 bg-primary text-white font-bold px-8 py-3.5 rounded-xl hover:brightness-110 active:scale-95 transition-all">
              Search
            </button>
          </div>
          <div class="mt-4 flex flex-wrap gap-2">
            <span class="text-xs font-bold text-slate-400 mr-2 self-center uppercase tracking-wider">
              Trending:
            </span>
            <a
              class="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium hover:border-primary transition-colors"
              href="#"
            >
              Python Mastery
            </a>
            <a
              class="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium hover:border-primary transition-colors"
              href="#"
            >
              Digital Marketing
            </a>
            <a
              class="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium hover:border-primary transition-colors"
              href="#"
            >
              Cybersecurity
            </a>
            <a
              class="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium hover:border-primary transition-colors"
              href="#"
            >
              UX Design
            </a>
          </div>
        </div>
        <div class="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div class="flex items-center gap-4">
            <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 serif-heading">
              Showing 142 results
            </h2>
            <label
              class="cursor-pointer p-3 bg-primary text-white rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center shadow-lg shadow-blue-200 active:scale-95 group"
              for="filter-modal-toggle"
            >
              <SlidersHorizontal size={20} class="group-hover:animate-pulse" />
              <span class="ml-2 font-bold text-sm hidden sm:inline">
                Filter
              </span>
            </label>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-slate-500">Sort by:</span>
            <select class="text-sm font-bold bg-transparent border-none focus:ring-0 cursor-pointer">
              <option>Most Relevant</option>
              <option>Newest</option>
              <option>Highest Rated</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-[15px]">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </div>
  );
}
