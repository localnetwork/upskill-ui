import Link from "next/link";
import { useMemo } from "react";

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
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
