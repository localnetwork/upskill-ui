import CourseLearnSidebar from "@/components/entities/course/learn/CourseLearnSidebar";
import BaseApi from "@/lib/api/_base.api";
import { setContext } from "@/lib/api/interceptor";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import CourseAssetPreview from "@/components/entities/course/learn/CourseAssetPreview";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import CourseOverview from "@/components/entities/course/learn/CourseOverview";
export async function getServerSideProps(context) {
  const { params, req, res } = context;
  const { slug } = params;

  // Optional: if your interceptor needs request context
  setContext({ req, res });

  try {
    const response = await BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/courses/${slug}/learn`
    );

    return {
      props: {
        data: response?.data?.data || null,
      },
    };
  } catch (error) {
    console.error("Error:", error);
    return { notFound: true };
  }
}

export default function Page({ data }) {
  const router = useRouter();
  const [currentLecture, setCurrentLecture] = useState(null);
  const [panelStatus, setPanelStatus] = useState("open");

  const findLectureByUuid = (uuid) => {
    for (const section of data.course.sections) {
      for (const curriculum of section.curriculums) {
        if (curriculum.uuid === uuid) {
          return curriculum;
        }
      }
    }
    return null;
  };

  useEffect(() => {
    if (!router.isReady) return;

    if (!router.query.lecture) {
      setCurrentLecture(data?.course?.sections?.[0]?.curriculums?.[0] || null);
      router.replace({
        pathname: router.pathname,
        query: {
          ...router.query,
          lecture: data?.course?.sections?.[0]?.curriculums?.[0]?.uuid || null,
        },
      });
    } else {
      const lecture = findLectureByUuid(router.query.lecture);
      setCurrentLecture(lecture);
    }
  }, [currentLecture, router]);

  return (
    <div>
      <div className="stripbar bg-[#16161D] px-[30px] h-[60px] flex items-center text-white border-b border-[#ddd]">
        <div className="container flex justify-between items-center h-full">
          <div className="flex items-center">
            <Link
              href={`/courses/${data?.course?.slug}`}
              className="flex gap-[5px] hover:bg-[#3588FC] px-[10px] py-[5px] rounded-[5px] items-center mr-4"
            >
              <ChevronLeft size={20} />
            </Link>
            <h2 className="font-semibold text-[20px]">
              {data?.course?.title || "Course Title"}
            </h2>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap">
        <div
          className={`w-full  min-h-[500vh] ${panelStatus === "expanded" ? "max-w-[calc(100%-900px)]" : ""} ${panelStatus === "open" ? "max-w-[calc(100%-400px)]" : ""} ${panelStatus === "closed" ? "max-w-full" : ""}`}
        >
          <CourseAssetPreview
            lecture={currentLecture}
            course={data.course}
            setCurrentLecture={setCurrentLecture}
          />
          <CourseOverview course={data.course} />
        </div>

        <div
          className={`w-full ${panelStatus === "expanded" && "max-w-[900px]"} ${panelStatus === "open" && "max-w-[400px]"} ${panelStatus === "closed" && "!hidden"}  sticky top-[95px] right-0 h-full`}
        >
          <CourseLearnSidebar
            panelStatus={panelStatus}
            setPanelStatus={setPanelStatus}
            setCurrentLecture={setCurrentLecture}
            sections={data?.course?.sections || []}
          />
        </div>
      </div>
    </div>
  );
}
