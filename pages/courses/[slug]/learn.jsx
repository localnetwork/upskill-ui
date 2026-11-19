import CourseLearnSidebar from "@/components/entities/course/learn/CourseLearnSidebar";
import BaseApi from "@/lib/api/_base.api";
import { setContext } from "@/lib/api/interceptor";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import CourseAssetPreview from "@/components/entities/course/learn/CourseAssetPreview";
import { ChevronLeft, Flag, List as ListIcon, Users } from "lucide-react";
import modalState from "@/lib/store/modalState";
import persistentStore from "@/lib/store/persistentStore";
import Link from "next/link";
import CourseOverview from "@/components/entities/course/learn/CourseOverview";
import learnTabs from "@/lib/menu/learnNavTabs.json";
import CourseNotes from "@/components/entities/course/learn/CourseNotes";
import CourseQA from "@/components/entities/course/learn/CourseQA";
import CourseAnnouncements from "@/components/entities/course/learn/CourseAnnouncements";
import CourseReviews from "@/components/entities/course/show/CourseReviews";
import CourseLearnAIAssistantDrawer from "@/components/entities/course/learn/CourseLearnAIAssistantDrawer";
import CourseSuspendedNotice from "@/components/entities/course/CourseSuspendedNotice";
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

    // No live enrollment (never enrolled, or trial/subscription access ended): back to the course page to buy or subscribe.
    if (status === 403 || status === 404) {
      return {
        redirect: {
          destination: `/courses/${encodeURIComponent(slug)}`,
          permanent: false,
        },
      };
    }

    return { notFound: true };
  }
}

export default function Page({ data }) {
  const router = useRouter();
  const [currentLecture, setCurrentLecture] = useState(null);
  const [panelStatus, setPanelStatus] = useState("open");

  const [sheetReady, setSheetReady] = useState(false);

  // On mobile the course content is a floating sheet, so start it closed
  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setPanelStatus("closed");
    }
    const frame = requestAnimationFrame(() =>
      requestAnimationFrame(() => setSheetReady(true)),
    );
    return () => cancelAnimationFrame(frame);
  }, []);
  const [course, setCourse] = useState(data.course);
  const profile = persistentStore((state) => state.profile);
  const isCourseAuthor =
    Boolean(profile?.id) && String(profile.id) === String(course?.author?.data?.id || "");

  const handleReportCourse = () => {
    modalState.setState({
      modalInfo: {
        type: "REPORT_COURSE",
        title: "Report abuse",
        size: "md",
        data: { courseId: course?.id },
      },
    });
  };

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

  // Server caps each beat, so this only reports time while the lesson tab is visible.
  const heartbeatLessonId = currentLecture?.is_locked ? null : currentLecture?.uuid;
  useEffect(() => {
    if (!heartbeatLessonId) return undefined;
    const sendBeat = () => {
      if (document.visibilityState !== "visible") return;
      BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/earnings/watch/heartbeat`, {
        lessonId: heartbeatLessonId,
      }).catch(() => {});
    };
    sendBeat();
    const timer = setInterval(sendBeat, 30000);
    return () => clearInterval(timer);
  }, [heartbeatLessonId]);

  const handleTabs = (tabId) => {
    setCurrentTab(tabId);
  };

  // Coding exercises get the full width; the course outline collapses and can be reopened.
  const isCodingLecture = currentLecture?.curriculum_resource_type === "coding_exercise";
  const wasCodingRef = useRef(false);
  useEffect(() => {
    if (isCodingLecture && !wasCodingRef.current) {
      setPanelStatus("closed");
    } else if (!isCodingLecture && wasCodingRef.current) {
      if (!window.matchMedia("(max-width: 1023px)").matches) {
        setPanelStatus("open");
      }
    }
    wasCodingRef.current = isCodingLecture;
  }, [isCodingLecture]);

  return (
    <div>
      <div className="stripbar bg-[#16161D] px-3 sm:px-[30px] h-[60px] flex items-center text-white border-b border-[#ddd]">
        <div className="container flex justify-between items-center h-full gap-2">
          <div className="flex items-center min-w-0">
            <Link
              href={`/courses/${data?.course?.slug}`}
              className="flex gap-[5px] hover:bg-[#3588FC] px-[10px] py-[5px] rounded-[5px] items-center mr-2 sm:mr-4 shrink-0"
            >
              <ChevronLeft size={20} />
            </Link>
            <h2 className="font-semibold text-[15px] sm:text-[20px] truncate">
              {data?.course?.title || "Course Title"}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/courses/${data?.course?.slug}/community`}
              className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-md border border-white/30 text-sm hover:bg-white/10"
            >
              <Users size={16} />
              <span className="hidden sm:inline">Community</span>
            </Link>
            {!isCourseAuthor && (
              <button
                type="button"
                onClick={handleReportCourse}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-md border border-white/30 text-sm hover:bg-white/10"
              >
                <Flag size={16} />
                <span className="hidden sm:inline">Report</span>
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                setPanelStatus((status) => (status === "closed" ? "open" : "closed"))
              }
              className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-md border border-white/30 text-sm hover:bg-white/10"
            >
              <ListIcon size={16} />
              <span className="hidden sm:inline">{panelStatus === "closed" ? "Show course content" : "Hide course content"}</span>
            </button>
          </div>
        </div>
      </div>
      {course?.suspension ? (
        <div className="px-[15px] pt-[15px] bg-[#EDECEC]">
          <CourseSuspendedNotice suspension={course.suspension} isEnrolled />
        </div>
      ) : null}
      <div className="flex flex-wrap">
        <div
          className={`w-full min-w-0 ${panelStatus === "expanded" ? "lg:max-w-[calc(100%-900px)]" : ""} ${panelStatus === "open" ? "lg:max-w-[calc(100%-400px)]" : ""} ${panelStatus === "closed" ? "max-w-full" : ""}`}
        >
          <CourseAssetPreview
            lecture={currentLecture}
            course={course}
            setCurrentLecture={setCurrentLecture}
            setCourse={setCourse}
            panelStatus={panelStatus}
            setPanelStatus={setPanelStatus}
          />
          <div className="p-[10px] sm:p-[15px] bg-[#EDECEC]">
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-primary/5">
              <div>
                <div class="flex overflow-x-auto whitespace-nowrap border-b border-primary/10 mb-6">
                  <button
                    onClick={() => handleTabs("overview")}
                    class={`cursor-pointer px-4 sm:px-6 py-3 text-sm text-slate-500 hover:text-primary transition-colors ${currentTab === "overview" ? "text-primary border-b-2 border-primary font-bold" : "font-medium"}`}
                  >
                    OVERVIEW
                  </button>
                  <button
                    onClick={() => handleTabs("notes")}
                    class={`cursor-pointer px-4 sm:px-6 py-3 text-sm text-slate-500 hover:text-primary transition-colors ${currentTab === "notes" ? "text-primary border-b-2 border-primary font-bold" : "font-medium"}`}
                  >
                    NOTES
                  </button>
                  <button
                    onClick={() => handleTabs("qa")}
                    class={`cursor-pointer px-4 sm:px-6 py-3 text-sm text-slate-500 hover:text-primary transition-colors ${currentTab === "qa" ? "text-primary border-b-2 border-primary font-bold" : "font-medium"}`}
                  >
                    Q&amp;A
                  </button>
                  <button
                    onClick={() => handleTabs("announcements")}
                    class={`cursor-pointer px-4 sm:px-6 py-3 text-sm text-slate-500 hover:text-primary transition-colors ${currentTab === "announcements" ? "text-primary border-b-2 border-primary font-bold" : "font-medium"}`}
                  >
                    ANNOUNCEMENTS
                  </button>
                  <button
                    onClick={() => handleTabs("reviews")}
                    class={`cursor-pointer px-4 sm:px-6 py-3 text-sm text-slate-500 hover:text-primary transition-colors uppercase ${currentTab === "reviews" ? "text-primary border-b-2 border-primary font-bold" : "font-medium"}`}
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

              {currentTab === "announcements" && (
                <CourseAnnouncements courseId={course?.id} />
              )}

              {currentTab === "reviews" && (
                <CourseReviews courseId={course?.id} />
              )}
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          onClick={() => setPanelStatus("closed")}
          className={`lg:hidden fixed inset-0 z-[74] bg-slate-900/40 transition-opacity duration-300 motion-reduce:transition-none ${
            sheetReady ? "" : "invisible"
          } ${
            panelStatus === "closed"
              ? "opacity-0 pointer-events-none"
              : "opacity-100"
          }`}
        />
        <div
          inert={panelStatus === "closed"}
          className={`${sheetReady ? "" : "max-lg:invisible max-lg:!transition-none"} ${panelStatus === "expanded" ? "lg:max-w-[900px]" : ""} ${panelStatus === "open" ? "lg:max-w-[400px]" : ""} ${panelStatus === "closed" ? "translate-y-full lg:hidden lg:translate-y-0" : "translate-y-0"} fixed inset-x-0 bottom-0 z-[75] h-[75vh] w-full overflow-hidden rounded-t-2xl shadow-2xl transition-transform duration-300 ease-in-out motion-reduce:transition-none lg:transition-none lg:static lg:z-auto lg:h-full lg:overflow-visible lg:rounded-none lg:shadow-none lg:sticky lg:top-[95px]`}
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
