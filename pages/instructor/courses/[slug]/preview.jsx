import CourseLearnSidebar from "@/components/entities/course/learn/CourseLearnSidebar";
import CourseOverview from "@/components/entities/course/learn/CourseOverview";
import SecureVideo from "@/components/video-players/SecureVideo";
import BaseApi from "@/lib/api/_base.api";
import { setContext } from "@/lib/api/interceptor";
import { Code, FileText, HelpCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

function normalizeRoleNames(roles) {
  if (!Array.isArray(roles)) return [];
  return roles
    .map((role) => {
      if (!role) return "";
      if (typeof role === "string") return role.toUpperCase();
      if (typeof role === "object") {
        if (role.name) return String(role.name).toUpperCase();
        if (role.role_name) return String(role.role_name).toUpperCase();
        if (role.role) return String(role.role).toUpperCase();
      }
      return "";
    })
    .filter(Boolean);
}

function normalizeCurriculumType(type) {
  const normalizedType = String(type || "").toLowerCase();
  if (normalizedType === "resource") return "article";
  return normalizedType || "video";
}

function safeParseMaybeJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
}

function normalizeSections(rawSections = []) {
  return (Array.isArray(rawSections) ? rawSections : []).map((section) => {
    const lessons = Array.isArray(section?.lessons) ? section.lessons : [];
    const baseCurriculums = Array.isArray(section?.curriculums)
      ? section.curriculums
      : lessons;

    return {
      ...section,
      curriculums: baseCurriculums.map((curriculum) => ({
        ...curriculum,
        id: curriculum?.id || curriculum?.uuid,
        uuid: curriculum?.uuid || curriculum?.id,
        curriculum_resource_type:
          curriculum?.curriculum_resource_type ||
          (curriculum?.type === "QUIZ"
            ? "quiz"
            : curriculum?.type === "CODING_EXERCISE"
              ? "coding_exercise"
              : curriculum?.videoUrl || curriculum?.type === "VIDEO"
                ? "video"
                : curriculum?.assignmentText || curriculum?.type === "RESOURCE"
                  ? "article"
                  : normalizeCurriculumType(curriculum?.type)),
        asset:
          curriculum?.asset ||
          (curriculum?.type === "QUIZ"
            ? {
                questions: Array.isArray(safeParseMaybeJson(curriculum?.quizQuestions))
                  ? safeParseMaybeJson(curriculum?.quizQuestions)
                  : safeParseMaybeJson(curriculum?.quizQuestions)?.questions || [],
              }
            : curriculum?.type === "CODING_EXERCISE"
              ? {
                  instructions: curriculum?.codingInstructions || "",
                  starter_code:
                    safeParseMaybeJson(curriculum?.codingStarterCode)?.starter_code ||
                    safeParseMaybeJson(curriculum?.codingStarterCode) ||
                    {},
                  languages:
                    safeParseMaybeJson(curriculum?.codingStarterCode)?.languages || [],
                }
              : curriculum?.videoUrl || curriculum?.type === "VIDEO"
                ? {
                    id: curriculum?.id || curriculum?.uuid,
                    path: `/stream.php?id=${encodeURIComponent(curriculum?.id || curriculum?.uuid || "")}`,
                  }
                : curriculum?.assignmentText
                  ? { id: curriculum?.id || curriculum?.uuid, content: curriculum.assignmentText }
                  : null),
      })),
    };
  });
}

function LecturePreview({ lecture }) {
  if (!lecture) {
    return (
      <div className="w-full h-[500px] bg-[#16161D] text-white flex items-center justify-center">
        Select a lecture to preview.
      </div>
    );
  }

  if (lecture.curriculum_resource_type === "video") {
    return (
      <div className="w-full h-[500px] bg-[#16161D] p-4">
        <SecureVideo lessonId={lecture.id} className="w-full h-full object-cover" />
      </div>
    );
  }

  if (lecture.curriculum_resource_type === "article") {
    return (
      <div className="w-full h-[500px] bg-white p-6 overflow-y-auto">
        <div
          className="prose prose-slate max-w-4xl mx-auto"
          dangerouslySetInnerHTML={{
            __html:
              lecture?.asset?.content ||
              lecture?.curriculum_description ||
              "<p>No article content available.</p>",
          }}
        />
      </div>
    );
  }

  if (lecture.curriculum_resource_type === "quiz") {
    const questions = Array.isArray(lecture?.asset?.questions)
      ? lecture.asset.questions
      : [];
    return (
      <div className="w-full h-[500px] bg-white p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <HelpCircle className="mx-auto mb-3 text-slate-500" size={32} />
          <h3 className="text-xl font-semibold text-center">{lecture.title}</h3>
          {questions.length ? (
            <div className="mt-6 space-y-4">
              {questions.map((question, index) => (
                <div
                  key={`question-${index + 1}`}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    {index + 1}. {question?.question || "Untitled question"}
                  </p>
                  {Array.isArray(question?.choices) && question.choices.length ? (
                    <ul className="mt-2 text-sm text-slate-600 list-disc pl-5 space-y-1">
                      {question.choices.map((choice, choiceIndex) => (
                        <li key={`choice-${index + 1}-${choiceIndex + 1}`}>
                          {String(choice || "")}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 mt-2 text-center">No quiz questions available.</p>
          )}
        </div>
      </div>
    );
  }

  if (lecture.curriculum_resource_type === "coding_exercise") {
    const languages = Array.isArray(lecture?.asset?.languages)
      ? lecture.asset.languages
      : [];
    const defaultLanguage = languages[0] || "javascript";
    const starterCode =
      lecture?.asset?.starter_code?.[defaultLanguage] ||
      (typeof lecture?.asset?.starter_code === "string"
        ? lecture.asset.starter_code
        : "");

    return (
      <div className="w-full h-[500px] bg-white p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <Code className="mb-3 text-slate-500" size={32} />
          <h3 className="text-xl font-semibold">{lecture.title}</h3>
          <p className="text-slate-600 mt-3 whitespace-pre-wrap">
            {lecture?.asset?.instructions || "No coding instructions available."}
          </p>

          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Language
            </p>
            <p className="text-sm font-semibold text-slate-700">{defaultLanguage}</p>
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Starter code
            </p>
            <pre className="rounded-lg bg-slate-900 text-slate-100 text-xs p-4 overflow-x-auto">
              <code>{starterCode || "// No starter code provided."}</code>
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] bg-white p-6 flex items-center justify-center">
      <div className="max-w-xl text-center">
        <FileText className="mx-auto mb-3 text-slate-500" size={32} />
        <h3 className="text-xl font-semibold">{lecture.title}</h3>
        <p className="text-slate-500 mt-2">This lecture type has no inline preview yet.</p>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const { slug } = context.params;
  setContext(context);

  try {
    const meResponse = await BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`);
    const me = meResponse?.data?.data || {};
    const roles = normalizeRoleNames(me?.roles);
    const isAdmin = roles.includes("ADMIN");
    const isEducator = roles.includes("EDUCATOR");

    if (!isAdmin && !isEducator) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    const courseResponse = await BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/courses/${slug}/manage`,
    );
    const course = courseResponse?.data?.data || null;
    const authorId =
      course?.educatorId || course?.author?.data?.id || course?.educator?.id || null;
    const isOwner = Boolean(me?.id && authorId && me.id === authorId);

    if (!isAdmin && !isOwner) {
      return {
        redirect: {
          destination: "/instructor/courses",
          permanent: false,
        },
      };
    }

    return {
      props: {
        course,
      },
    };
  } catch (error) {
    if (error?.status === 401) {
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }
    if (error?.status === 403) {
      return {
        redirect: {
          destination: "/instructor/courses",
          permanent: false,
        },
      };
    }
    return { notFound: true };
  }
}

export default function CoursePreviewPage({ course }) {
  const router = useRouter();
  const [currentLecture, setCurrentLecture] = useState(null);
  const [panelStatus, setPanelStatus] = useState("open");

  const previewSections = useMemo(
    () => normalizeSections(course?.sections || []),
    [course?.sections],
  );
  const previewCourse = useMemo(
    () => ({
      ...course,
      sections: previewSections,
    }),
    [course, previewSections],
  );

  const firstLecture = useMemo(() => {
    const firstSection = previewSections[0];
    return firstSection?.curriculums?.[0] || null;
  }, [previewSections]);

  useEffect(() => {
    if (!router.isReady) return;

    const lectureFromQuery = router.query?.lecture;
    const lectureUuid = Array.isArray(lectureFromQuery)
      ? String(lectureFromQuery[0] || "")
      : String(lectureFromQuery || "");
    if (!lectureUuid) {
      setCurrentLecture(firstLecture);
      if (firstLecture?.uuid) {
        router.replace(
          {
            pathname: router.pathname,
            query: {
              slug: router.query.slug,
              lecture: firstLecture.uuid,
            },
          },
          undefined,
          { shallow: true },
        );
      }
      return;
    }

    let selected = null;
    for (const section of previewSections) {
      const match = (section?.curriculums || []).find(
        (curriculum) => curriculum?.uuid === lectureUuid,
      );
      if (match) {
        selected = match;
        break;
      }
    }

    setCurrentLecture(selected || firstLecture || null);
  }, [previewSections, firstLecture, router]);

  return (
    <div>
      <div className="stripbar bg-[#16161D] px-[30px] h-[60px] flex items-center text-white border-b border-[#ddd]">
        <div className="container flex justify-between items-center h-full">
          <div className="flex items-center">
            <Link
              href={`/instructor/courses/${course?.uuid || router.query.slug}/course-details`}
              className="flex gap-[5px] hover:bg-[#3588FC] px-[10px] py-[5px] rounded-[5px] items-center mr-4"
            >
              <ChevronLeft size={20} />
            </Link>
            <h2 className="font-semibold text-[20px]">
              {course?.title || "Course Preview"}
            </h2>
          </div>
          <span className="text-sm font-semibold px-3 py-1 rounded bg-[#3588FC]">
            Author/Admin Preview
          </span>
        </div>
      </div>

      <div className="flex flex-wrap">
        <div
          className={`w-full ${panelStatus === "expanded" ? "max-w-[calc(100%-900px)]" : ""} ${panelStatus === "open" ? "max-w-[calc(100%-400px)]" : ""} ${panelStatus === "closed" ? "max-w-full" : ""}`}
        >
          <LecturePreview lecture={currentLecture} />

          <div className="p-[15px] bg-[#EDECEC]">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-primary/5">
              <CourseOverview lecture={currentLecture} course={previewCourse} />
            </div>
          </div>
        </div>

        <div
          className={`w-full ${panelStatus === "expanded" && "max-w-[900px]"} ${panelStatus === "open" && "max-w-[400px]"} ${panelStatus === "closed" && "!hidden"} sticky top-[95px] right-0 h-full`}
        >
          <CourseLearnSidebar
            panelStatus={panelStatus}
            setPanelStatus={setPanelStatus}
            setCurrentLecture={setCurrentLecture}
            sections={previewSections}
          />
        </div>
      </div>
    </div>
  );
}
