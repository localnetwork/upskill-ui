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

function getScoreTone(score) {
  if (score >= 80) {
    return {
      ring: "border-emerald-200",
      badge: "bg-emerald-100 text-emerald-700",
      bar: "bg-emerald-500",
    };
  }
  if (score >= 50) {
    return {
      ring: "border-amber-200",
      badge: "bg-amber-100 text-amber-700",
      bar: "bg-amber-500",
    };
  }
  return {
    ring: "border-rose-200",
    badge: "bg-rose-100 text-rose-700",
    bar: "bg-rose-500",
  };
}

export default function CourseApprovalReadiness({ course }) {
  const baseUuid = course?.uuid || course?.id;

  const checks = useMemo(() => {
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
  }, [baseUuid, course]);

  const completedCount = checks.filter((item) => item.done).length;
  const totalCount = checks.length || 1;
  const score = Math.round((completedCount / totalCount) * 100);
  const tone = getScoreTone(score);

  return (
    <section className={`mb-8 rounded-2xl border p-6 bg-white ${tone.ring}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface">Approval readiness</h2>
          <p className="text-sm text-[#64748b] mt-1">
            Complete the checklist to improve your chance of approval.
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${tone.badge}`}>
          {score}% ({completedCount}/{totalCount})
        </span>
      </div>

      <div className="mt-4 h-2 w-full bg-[#e2e8f0] rounded-full overflow-hidden">
        <div className={`h-full ${tone.bar}`} style={{ width: `${score}%` }} />
      </div>

      <div className="mt-5 grid md:grid-cols-2 gap-3">
        {checks.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="flex items-center justify-between gap-3 rounded-lg border border-[#e2e8f0] px-4 py-3 hover:bg-[#f8fafc]"
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
    </section>
  );
}

