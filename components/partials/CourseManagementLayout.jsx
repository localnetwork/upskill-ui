import { useEffect } from "react";
import CourseSidebar from "../entities/course/CourseSidebar";
import CourseStripBar from "../entities/course/CourseStripbar";
import courseStore from "@/lib/store/courseStore";
export default function CourseManagementLayout({ children, course, title }) {
  const courseManagement = courseStore((state) => state.courseManagement);

  useEffect(() => {
    courseStore.setState({ courseManagement: course });
  }, [course]);

  return (
    <div className="flex flex-col text-[17px] font-light">
      <CourseStripBar course={course} />
      <div className="flex flex-wrap">
        <CourseSidebar course={course} />

        <div className="p-[50px] w-[calc(100%-300px)]">
          <div className="shadow-box p-[50px]">
            <div className="border-b px-[50px] mx-[-50px] mt-[-50px] py-[30px] border-bottom">
              <h1 className="text-3xl font-semibold">{title}</h1>
            </div>
            <div className="mt-[50px]">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
