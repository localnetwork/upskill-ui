import CourseLearnSidebar from "@/components/entities/course/learn/CourseLearnSidebar";
import BaseApi from "@/lib/api/_base.api";
import { setContext } from "@/lib/api/interceptor";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import CourseAssetPreview from "@/components/entities/course/learn/CourseAssetPreview";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import CourseOverview from "@/components/entities/course/learn/CourseOverview";
import learnTabs from "@/lib/menu/learnNavTabs.json";
import CourseNotes from "@/components/entities/course/learn/CourseNotes";
import CourseQA from "@/components/entities/course/learn/CourseQA";
import CourseReviews from "@/components/entities/course/show/CourseReviews";
import CourseLearnAIAssistantDrawer from "@/components/entities/course/learn/CourseLearnAIAssistantDrawer";
import { parseCookies, setCookie } from "nookies";
import {
  getAuthTokenCookieNames,
  getRefreshTokenCookieNames,
  getRefreshTokenFromCookieMap,
} from "@/lib/services/authToken";

function toCookieHeader(cookieMap = {}) {
  return Object.entries(cookieMap)
    .filter(([name, value]) => name && value !== undefined && value !== null)
    .map(([name, value]) => `${name}=${encodeURIComponent(String(value))}`)
    .join("; ");
}

export async function getServerSideProps(context) {
  const { params } = context;
  const { slug } = params;

  setContext(context);

  const fetchCourse = async () =>
    BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/courses/${slug}/learn`);

  try {
    const response = await fetchCourse();

    return {
      props: {
        data: response?.data?.data || null,
      },
    };
  } catch (error) {
    const status = error?.status;

    if (status === 401) {
      const cookieMap = parseCookies(context);
      const refreshToken = getRefreshTokenFromCookieMap(cookieMap);

      if (refreshToken) {
        try {
          const refreshResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                cookie: context?.req?.headers?.cookie || "",
              },
              body: JSON.stringify({
                refreshToken,
                refresh_token: refreshToken,
              }),
            },
          );

          if (refreshResponse.ok) {
            const refreshJson = await refreshResponse.json();
            const payload = refreshJson?.data || refreshJson || {};
            const nextAccessToken =
              payload?.accessToken || payload?.token || null;
            const nextRefreshToken =
              payload?.refreshToken || payload?.refresh_token || refreshToken;

            if (nextAccessToken) {
              getAuthTokenCookieNames().forEach((cookieName) => {
                setCookie(context, cookieName, nextAccessToken, { path: "/" });
                cookieMap[cookieName] = nextAccessToken;
              });
              getRefreshTokenCookieNames().forEach((cookieName) => {
                setCookie(context, cookieName, nextRefreshToken, { path: "/" });
                cookieMap[cookieName] = nextRefreshToken;
              });

              setContext({
                req: {
                  headers: {
                    cookie: toCookieHeader(cookieMap),
                  },
                },
              });

              const retryResponse = await fetchCourse();
              return {
                props: {
                  data: retryResponse?.data?.data || null,
                },
              };
            }
          }
        } catch (_refreshError) {
          // fall through to regular unauthorized handling below
        }
      }
    }

    console.log("Error fetching course data:", {
      status,
      message: error?.data?.message,
    });
    const message = String(error?.data?.message || "").toLowerCase();

    if (
      status === 401 ||
      message.includes("invalid") ||
      message.includes("expired")
    ) {
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    // if (status === 403 || status === 404) {
    //   return {
    //     redirect: {
    //       destination: "/my-courses/learning",
    //       permanent: false,
    //     },
    //   };
    // }

    return { notFound: true };
  }
}

export default function Page({ data }) {
  const router = useRouter();
  const [currentLecture, setCurrentLecture] = useState(null);
  const [panelStatus, setPanelStatus] = useState("open");

  const [course, setCourse] = useState(data.course);

  const [currentTab, setCurrentTab] = useState("overview");
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

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

    const orderedCurriculums = (data?.course?.sections || []).flatMap(
      (section) => section.curriculums || [],
    );
    const firstAccessibleLecture =
      orderedCurriculums.find((curriculum) => !curriculum?.is_locked) ||
      orderedCurriculums[0] ||
      null;

    if (!router.query.lecture) {
      setCurrentLecture(firstAccessibleLecture);
      router.replace({
        pathname: router.pathname,
        query: {
          ...router.query,
          lecture: firstAccessibleLecture?.uuid || null,
        },
      });
    } else {
      const lecture = findLectureByUuid(router.query.lecture);
      setCurrentLecture(lecture);
    }
  }, [currentLecture, router]);

  const handleTabs = (tabId) => {
    setCurrentTab(tabId);
  };

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
          className={`w-full ${panelStatus === "expanded" ? "max-w-[calc(100%-900px)]" : ""} ${panelStatus === "open" ? "max-w-[calc(100%-400px)]" : ""} ${panelStatus === "closed" ? "max-w-full" : ""}`}
        >
          <CourseAssetPreview
            lecture={currentLecture}
            course={course}
            setCurrentLecture={setCurrentLecture}
            setCourse={setCourse}
          />
          <div className="p-[15px] bg-[#EDECEC]">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-primary/5">
              <div>
                <div class="flex border-b border-primary/10 mb-6">
                  <button
                    onClick={() => handleTabs("overview")}
                    class={`cursor-pointer px-6 py-3 text-sm text-slate-500 hover:text-primary transition-colors ${currentTab === "overview" ? "text-primary border-b-2 border-primary font-bold" : "font-medium"}`}
                  >
                    OVERVIEW
                  </button>
                  <button
                    onClick={() => handleTabs("notes")}
                    class={`cursor-pointer px-6 py-3 text-sm text-slate-500 hover:text-primary transition-colors ${currentTab === "notes" ? "text-primary border-b-2 border-primary font-bold" : "font-medium"}`}
                  >
                    NOTES
                  </button>
                  <button
                    onClick={() => handleTabs("qa")}
                    class={`cursor-pointer px-6 py-3 text-sm text-slate-500 hover:text-primary transition-colors ${currentTab === "qa" ? "text-primary border-b-2 border-primary font-bold" : "font-medium"}`}
                  >
                    Q&amp;A
                  </button>
                  <button
                    onClick={() => handleTabs("reviews")}
                    class={`cursor-pointer px-6 py-3 text-sm text-slate-500 hover:text-primary transition-colors uppercase ${currentTab === "reviews" ? "text-primary border-b-2 border-primary font-bold" : "font-medium"}`}
                  >
                    REVIEWS
                  </button>
                </div>
              </div>

              {currentTab === "overview" && (
                <CourseOverview lecture={currentLecture} course={course} />
              )}

              {currentTab === "notes" && <CourseNotes />}

              {currentTab === "qa" && (
                <CourseQA
                  courseSlug={course?.slug}
                  lectureId={currentLecture?.id}
                />
              )}

              {currentTab === "reviews" && (
                <CourseReviews courseId={course?.id} />
              )}
            </div>
          </div>
        </div>

        <div
          className={`w-full ${panelStatus === "expanded" && "max-w-[900px]"} ${panelStatus === "open" && "max-w-[400px]"} ${panelStatus === "closed" && "!hidden"}  sticky top-[95px] right-0 h-full`}
        >
          <CourseLearnSidebar
            panelStatus={panelStatus}
            setPanelStatus={setPanelStatus}
            setCurrentLecture={setCurrentLecture}
            sections={course?.sections || []}
            onToggleAssistant={() =>
              setIsAssistantOpen((previous) => !previous)
            }
            isAssistantOpen={isAssistantOpen}
          />
        </div>
      </div>
      <CourseLearnAIAssistantDrawer
        open={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        course={course}
        currentLecture={currentLecture}
      />
    </div>
  );
}
