import CourseAPI from "@/lib/api/course/request";
import Link from "next/link";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import courseStore from "@/lib/store/courseStore";
export default function CourseSidebar({ course }) {
  const router = useRouter();

  const courseManagement = courseStore((state) => state.courseManagement);

  const editingLinks = [
    {
      name: "Intended Learners",
      link: `/instructor/courses/${course?.uuid}/intended-learners`,
    },
    {
      name: "Curriculum",
      link: `/instructor/courses/${course?.uuid}/curriculum`,
    },
    {
      name: "Basics",
      link: `/instructor/courses/${course?.uuid}/basics`,
    },
    {
      name: "Pricing",
      link: `/instructor/courses/${course?.uuid}/pricing`,
    },
  ];

  const managementLinks = [
    {
      name: "Students",
      link: `/instructor/courses/${course?.uuid}/students`,
    },
  ];

  const handleUnpublish = async () => {
    const confirm = window.confirm(
      "Drafting this course will remove it from public view but learners who enrolled will still have access to it. Are you sure you want to proceed?"
    );
    if (!confirm) return;

    try {
      const response = await CourseAPI.unpublish(course.uuid);
      toast.success("Course drafted successfully");
      courseStore.setState({
        courseManagement: {
          ...course,
          published: 0,
        },
      });
    } catch (error) {
      console.error("Error unpublishing course:", error);
      toast.error(error?.data?.message || "Error unpublishing course");
    }
  };

  return (
    <div className="px-[30px] pl-[50px] py-[50px] w-[300px] min-h-[calc(100vh-60px)]">
      <div className="sticky top-[190px]">
        <div className="mb-[30px]">
          <h2 className="text-[20px] font-semibold pl-[30px]">
            Course Editing
          </h2>
          <div>
            {editingLinks.map((item, index) => (
              <div key={index} className="">
                <Link
                  href={item.link}
                  className={`${
                    router.asPath === item.link ? "" : ""
                  } relative text-[17px] py-[10px] block pl-[30px] hover:bg-[#f5f5f5]`}
                >
                  {router.asPath === item.link && (
                    <span className="inline-block absolute left-0 top-0 w-[5px] bg-[#000] h-full" />
                  )}
                  {item.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-[30px]">
          <h2 className="text-[20px] font-semibold pl-[30px]">
            Course Management
          </h2>
          <div>
            {managementLinks.map((item, index) => (
              <div key={index} className="">
                <Link
                  href={item.link}
                  className={`${
                    router.asPath === item.link ? "" : ""
                  } relative text-[17px] py-[10px] block pl-[30px] hover:bg-[#f5f5f5]`}
                >
                  {router.asPath === item.link && (
                    <span className="inline-block absolute left-0 top-0 w-[5px] bg-[#000] h-full" />
                  )}
                  {item.name}
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div>
          {console.log("hhhhh", courseManagement)}
          {parseInt(courseManagement?.published) ? (
            <button
              onClick={(e) => {
                handleUnpublish();
              }}
              className="bg-[#0056D2] font-semibold text-white px-[20px] py-[10px] rounded-[5px] w-full hover:bg-[#1d6de0]"
            >
              Draft this Course
            </button>
          ) : (
            <button className="bg-[#0056D2] font-semibold text-white px-[20px] py-[10px] rounded-[5px] w-full hover:bg-[#1d6de0]">
              Request for Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
