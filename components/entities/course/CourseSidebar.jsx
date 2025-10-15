import Link from "next/link";
import { useRouter } from "next/router";
export default function CourseSidebar({ course }) {
  const router = useRouter();
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
          <button className="bg-[#0056D2] font-semibold text-white px-[20px] py-[10px] rounded-[5px] w-full hover:bg-[#1d6de0]">
            Publish Course
          </button>
        </div>
      </div>
    </div>
  );
}
