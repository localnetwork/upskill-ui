import Link from "next/link";
import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countFilled(items = []) {
  if (!Array.isArray(items)) return 0;
  return items.filter((item) => String(item || "").trim().length > 0).length;
}

function hasMedia(value) {
  if (!value) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "object") {
    return Boolean(value.id || value.path);
  }
  return false;
}

function getSectionCurriculums(section) {
  if (Array.isArray(section?.curriculums)) return section.curriculums;
  if (Array.isArray(section?.lessons)) return section.lessons;
  if (Array.isArray(section?.items)) return section.items;
  return [];
}

function getCurriculumResourceType(curriculum = {}) {
  const directType = String(curriculum?.curriculum_resource_type || "").trim();
  if (directType) return directType;

  const normalizedType = String(
    curriculum?.curriculum_type || curriculum?.type || "",
  )
    .trim()
    .toLowerCase();

  if (normalizedType === "quiz") return "quiz";
  if (normalizedType === "coding_exercise") return "coding_exercise";
  if (normalizedType === "assignment") return "article";
  if (normalizedType === "lecture") return "null";
  return "null";
}

function hasMissingCurriculumContent(curriculum = {}) {
  const resourceType = getCurriculumResourceType(curriculum);
  const asset = curriculum?.asset || {};

  if (resourceType === "video") {
    return !String(asset?.path || "").trim();
  }

  if (resourceType === "article") {
    return !String(asset?.content || "").trim();
  }

  if (resourceType === "quiz") {
    const questions = Array.isArray(asset?.questions) ? asset.questions : [];
    return questions.length === 0;
  }

  if (resourceType === "coding_exercise") {
    const stepChallenges =
      asset?.step_challenges && typeof asset.step_challenges === "object"
        ? asset.step_challenges
        : {};
    const hasAnyStepChallenges = Object.values(stepChallenges).some(
      (steps) => Array.isArray(steps) && steps.length > 0,
    );
    return !hasAnyStepChallenges;
  }

  return true;
}

function buildMissingCurriculumSummary(course) {
  const sections = Array.isArray(course?.sections) ? course.sections : [];
  const sectionIssues = [];
  let totalMissingCurriculums = 0;

  for (const section of sections) {
    const curriculums = getSectionCurriculums(section);
    const missingCount = curriculums.filter(hasMissingCurriculumContent).length;
    if (missingCount > 0) {
      totalMissingCurriculums += missingCount;
      sectionIssues.push({
        id: String(section?.id || "").trim() || `section-${sectionIssues.length + 1}`,
        title: String(section?.title || "Untitled section").trim(),
        missingCount,
      });
    }
  }

  return {
    totalMissingCurriculums,
    sectionIssues,
  };
}

export function getApprovalChecks(course, baseUuid) {
  const title = String(course?.title || "").trim();
  const subtitle = String(course?.subtitle || "").trim();
  const descriptionWords = stripHtml(course?.description).split(/\s+/).filter(Boolean).length;
  const sectionCount = Number(course?.resources_count?.section_count || course?.sections?.length || 0);
  const lessonCount = Number(course?.resources_count?.curriculum_count || 0);
  const learningsCount = countFilled(course?.goals?.what_you_will_learn_data);
  const requirementsCount = countFilled(course?.goals?.requirements_data);
  const audienceCount = countFilled(course?.goals?.who_should_attend_data);
  const hasCategory = Array.isArray(course?.category_ids) && course.category_ids.length > 0;
  const { totalMissingCurriculums } = buildMissingCurriculumSummary(course);
  const levelId =
    course?.instructional_level?.id ||
    course?.instructional_level ||
    course?.levelId;
  const language = String(course?.language || "").trim();

  return [
    {
      key: "title",
      label: "Add a clear course title",
      done: title.length >= 10,
      href: `/instructor/courses/${baseUuid}/basics`,
    },
    {
      key: "subtitle",
      label: "Write a compelling subtitle",
      done: subtitle.length >= 30,
      href: `/instructor/courses/${baseUuid}/basics`,
    },
    {
      key: "description",
      label: "Write a full description (200+ words)",
      done: descriptionWords >= 200,
      href: `/instructor/courses/${baseUuid}/basics`,
    },
    {
      key: "image",
      label: "Upload a course image",
      done: hasMedia(course?.cover_image),
      href: `/instructor/courses/${baseUuid}/basics`,
    },
    {
      key: "promo-video",
      label: "Upload a promotional video",
      done: hasMedia(course?.promo_video),
      href: `/instructor/courses/${baseUuid}/basics`,
    },
    {
      key: "category",
      label: "Set category and level",
      done: Boolean(hasCategory && levelId),
      href: `/instructor/courses/${baseUuid}/basics`,
    },
    {
      key: "language",
      label: "Select course language",
      done: language.length > 0,
      href: `/instructor/courses/${baseUuid}/basics`,
    },
    {
      key: "curriculum",
      label: "Build curriculum (1+ section, 5+ lessons)",
      done: sectionCount >= 1 && lessonCount >= 5,
      href: `/instructor/courses/${baseUuid}/curriculum`,
    },
    {
      key: "curriculum-content",
      label: "Complete all curriculum content items",
      done: totalMissingCurriculums === 0,
      href: `/instructor/courses/${baseUuid}/curriculum`,
    },
    {
      key: "learnings",
      label: "Add what students will learn (4+ items)",
      done: learningsCount >= 4,
      href: `/instructor/courses/${baseUuid}/intended-learners`,
    },
    {
      key: "requirements",
      label: "Add at least 1 requirement",
      done: requirementsCount >= 1,
      href: `/instructor/courses/${baseUuid}/intended-learners`,
    },
    {
      key: "audience",
      label: "Define your target learners",
      done: audienceCount >= 1,
      href: `/instructor/courses/${baseUuid}/intended-learners`,
    },
    {
      key: "pricing",
      label: "Set pricing tier",
      done: Boolean(course?.price_tier?.id),
      href: `/instructor/courses/${baseUuid}/pricing`,
    },
  ];
}

export function getApprovalReadinessSummary(course) {
  const baseUuid = course?.uuid || course?.id || "";
  const checks = getApprovalChecks(course, baseUuid);
  const completedCount = checks.filter((item) => item.done).length;
  const totalCount = checks.length || 1;
  const score = Math.round((completedCount / totalCount) * 100);

  return { checks, completedCount, totalCount, score };
}

function getScoreTone(score) {
  if (score >= 80) {
    return {
      ring: "border-emerald-200",
      badge: "bg-emerald-100 text-emerald-700",
      stroke: "stroke-emerald-500",
    };
  }
  if (score >= 50) {
    return {
      ring: "border-amber-200",
      badge: "bg-amber-100 text-amber-700",
      stroke: "stroke-amber-500",
    };
  }
  return {
    ring: "border-rose-200",
    badge: "bg-rose-100 text-rose-700",
    stroke: "stroke-rose-500",
  };
}

export default function CourseApprovalReadiness({ course }) {
  const { checks, completedCount, totalCount, score } = useMemo(
    () => getApprovalReadinessSummary(course),
    [course],
  );
  const baseUuid = course?.uuid || course?.id || "";
  const { totalMissingCurriculums, sectionIssues } = useMemo(
    () => buildMissingCurriculumSummary(course),
    [course],
  );
  const normalizedScore = Math.min(100, Math.max(0, score));
  const tone = getScoreTone(score);
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <section className={`mb-8 rounded-2xl border p-6 bg-white ${tone.ring}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Approval readiness</h2>
          <p className="text-sm text-[#64748b] mt-1">
            Complete the checklist to improve your chance of approval. Hover the
            progress circle to view details.
          </p>
          {totalMissingCurriculums > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
              <AlertTriangle size={14} />
              {totalMissingCurriculums} curriculum item
              {totalMissingCurriculums > 1 ? "s" : ""} missing content
            </div>
          )}
        </div>
        <div className="relative group">
          <div className="relative h-20 w-20">
            <svg
              viewBox="0 0 80 80"
              className="h-20 w-20"
              role="img"
              aria-label={`Approval readiness ${score}%`}
            >
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="none"
                strokeWidth="8"
                className="stroke-[#e2e8f0]"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                className={tone.stroke}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: dashOffset,
                  transform: "rotate(-90deg)",
                  transformOrigin: "50% 50%",
                  transition: "stroke-dashoffset 200ms ease",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-bold text-on-surface">{score}%</span>
              <span className="text-[10px] text-[#64748b]">
                {completedCount}/{totalCount}
              </span>
            </div>
          </div>

          <div className="absolute right-0 top-full pt-2 z-20 opacity-0 pointer-events-none translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto">
            <div className="w-[min(32rem,calc(100vw-3rem))] rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-lg">
              <p className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${tone.badge}`}>
                {score}% complete
              </p>
              <div className="mt-3 grid md:grid-cols-2 gap-2">
                {checks.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#e2e8f0] px-3 py-2 hover:bg-[#f8fafc]"
                  >
                    <span className="text-sm text-on-surface">{item.label}</span>
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        item.done
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.done ? "Done" : "Needed"}
                    </span>
                  </Link>
                ))}
              </div>

              {sectionIssues.length > 0 && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
                    <AlertTriangle size={14} />
                    Sections that still need curriculum content
                  </p>
                  <div className="mt-2 space-y-2">
                    {sectionIssues.map((section) => (
                      <Link
                        key={section.id}
                        href={`/instructor/courses/${baseUuid}/curriculum`}
                        className="flex items-center justify-between rounded-md border border-red-200 bg-white px-3 py-2 text-xs hover:bg-red-50/60"
                      >
                        <span className="flex items-center gap-2 text-red-700">
                          <AlertTriangle size={12} />
                          {section.title}
                        </span>
                        <span className="rounded-full bg-red-100 px-2 py-0.5 font-bold text-red-700">
                          {section.missingCount} missing
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
