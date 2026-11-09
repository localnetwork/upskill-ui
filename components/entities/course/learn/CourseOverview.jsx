import {
  ChartNoAxesColumnIncreasing,
  Clock,
  Globe,
  Users,
  Star,
  CircleCheck,
  Medal,
} from "lucide-react";
import { useState, useRef } from "react";
import UserAvatar from "../../user/UserAvatar";
import Link from "next/link";
import { useRouter } from "next/router";
import BaseApi from "@/lib/api/_base.api";
import toast from "react-hot-toast";
import OfflineDownloadButton from "./OfflineDownloadButton";

export default function CourseOverview({ lecture, course }) {
  const { subtitle, instructional_level, description, author } = course;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCertificateLoading, setIsCertificateLoading] = useState(false);
  const [generatedCertificateSlug, setGeneratedCertificateSlug] = useState(null);
  const certificateSlug = generatedCertificateSlug || course?.certificate_slug || null;
  const certificateButtonClass =
    "inline-flex items-center justify-center px-4 py-1.5 border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium text-xs rounded transition shrink-0";
  const containerRef = useRef(null); // ✅ fixed typing for JS/TS
  const router = useRouter();

  const toggleExpanded = () => {
    if (isExpanded && containerRef.current) {
      const container = containerRef.current;
      setIsExpanded(false);
      // allow collapse animation to finish before scrolling
      setTimeout(() => {
        container.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 300);
    } else {
      setIsExpanded(true);
    }
  };

  const allCurriculums =
    course?.sections?.flatMap((section) => section?.curriculums || []) || [];
  const completedCurriculumsCount = allCurriculums.filter(
    (curriculum) =>
      curriculum?.completed ||
      curriculum?.is_taken ||
      Number(curriculum?.progress_pct || 0) >= 100,
  ).length;
  const isCourseCompleted =
    allCurriculums.length > 0 &&
    completedCurriculumsCount >= allCurriculums.length;

  const handleGenerateCertificate = async () => {
    if (!course?.slug) return;
    if (!isCourseCompleted) {
      toast.error("Complete the full course to generate your certificate.");
      return;
    }

    try {
      setIsCertificateLoading(true);
      const response = await BaseApi.post("/api/certification", {
        courseSlug: course.slug,
      });
      const certificate = response?.data?.data;
      if (!certificate?.slug) {
        toast.error("Unable to generate certificate right now.");
        return;
      }
      setGeneratedCertificateSlug(certificate.slug);
      router.push(`/certifications/${certificate.slug}`);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to generate certificate.");
    } finally {
      setIsCertificateLoading(false);
    }
  };

  const curriculumTags = (
    Array.isArray(lecture?.topics) && lecture.topics.length > 0
      ? lecture.topics
      : lecture?.topic
        ? [lecture.topic]
        : []
  ).filter((tag) => tag?.title);

  const totalDurationSeconds = allCurriculums.reduce(
    (sum, curriculum) => sum + Number(curriculum?.estimated_duration || 0),
    0,
  );
  const durationLabel = (() => {
    if (!totalDurationSeconds) return "Not available";
    const totalMinutes = Math.max(1, Math.round(totalDurationSeconds / 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (!hours) return `${minutes} min total`;
    return minutes ? `${hours} hr ${minutes} min total` : `${hours} hr total`;
  })();
  const levelLabel = instructional_level?.title || "All Levels";
  const languageLabel = course?.language || "English";
  const totalEnrollees = Number(course?.stats?.total_enrollees || 0);
  const averageRating = Number(course?.stats?.average_rating || 0);
  const totalReviews = Number(course?.stats?.total_reviews || 0);
  const progressPercent = allCurriculums.length
    ? Math.round((completedCurriculumsCount / allCurriculums.length) * 100)
    : 0;
  const instructor = author?.data || {};

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-xl font-bold">About this lesson</h2>
        <div
          className="text-slate-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: lecture?.curriculum_description }}
        />

        <OfflineDownloadButton lecture={lecture} course={course} />

        {curriculumTags.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4 curriculumn-tags">
            {curriculumTags.map((tag) => (
              <span
                key={tag.id || tag.slug || tag.title}
                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider"
              >
                {tag.title}
              </span>
            ))}
          </div>
        )}
        <div className="pt-8 mt-8 border-t border-primary/10">
          <h2 className="text-xl font-bold mb-6">About this course</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Level */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <ChartNoAxesColumnIncreasing className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Level
                </p>
                <p className="text-sm font-bold text-slate-800">{levelLabel}</p>
              </div>
            </div>

            {/* Duration */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Duration
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {durationLabel}
                </p>
              </div>
            </div>

            {/* Languages */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Languages
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {languageLabel}
                </p>
              </div>
            </div>

            {/* Students */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Students
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {totalEnrollees.toLocaleString()} enrolled
                </p>
              </div>
            </div>

            {/* Rating */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Rating
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {totalReviews ? (
                    <>
                      {averageRating.toFixed(1)} ★{" "}
                      <span className="text-xs font-normal text-slate-500">
                        ({totalReviews.toLocaleString()})
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-normal text-slate-500">
                      No ratings yet
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CircleCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Progress
                  </p>
                  <span className="text-xs font-bold text-emerald-600">
                    {progressPercent}%
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800 truncate">
                  {completedCurriculumsCount} / {allCurriculums.length}{" "}
                  Completed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*  */}

      <div ref={containerRef} className="py-[50px] overflow-hidden">
        <h2 className="text-xl font-bold mb-3">{subtitle}</h2>

        <div className="border-t border-slate-200 pt-6 space-y-6">
          {/* Row: By the numbers */}

          {/* Row: Certificate */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm items-center">
            <div className="font-semibold text-slate-900">Certificate</div>

            <div className="sm:col-span-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-slate-600">
                {certificateSlug
                  ? "You've earned your Upskill certificate"
                  : "Get Upskill certificate by completing entire course"}
              </span>

              {certificateSlug ? (
                <Link
                  href={`/certifications/${certificateSlug}`}
                  className={certificateButtonClass}
                >
                  <Medal className="w-4 h-4 mr-1.5" />
                  Upskill Certificate
                </Link>
              ) : (
                <button
                  onClick={handleGenerateCertificate}
                  disabled={isCertificateLoading || !isCourseCompleted}
                  title={
                    isCourseCompleted
                      ? undefined
                      : "Complete the entire course to unlock your certificate"
                  }
                  className={`${certificateButtonClass} disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
                >
                  <Medal className="w-4 h-4 mr-1.5" />
                  {isCertificateLoading ? "Generating..." : "Upskill Certificate"}
                </button>
              )}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Row: Description */}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm">
            <div className="font-semibold text-slate-900">Description</div>
            <div
              className={`sm:col-span-3 text-slate-600 space-y-3 leading-relaxed `}
              dangerouslySetInnerHTML={{ __html: course?.description }}
            ></div>
          </div>

          <hr className="border-slate-100" />

          {/* Row: Instructor */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm">
            <div className="font-semibold text-slate-900">Instructor</div>

            <div className="sm:col-span-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                <div className="flex items-center space-x-3">
                  <UserAvatar profile={instructor} size="md" />

                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      {instructor.fullName ||
                        instructor.username ||
                        "Instructor"}
                    </h4>
                    {instructor.headline && (
                      <p className="text-xs text-slate-500">
                        {instructor.headline}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    About the instructor
                  </p>
                  {instructor.biography ? (
                    <div
                      className="text-slate-600 text-sm leading-relaxed whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: instructor.biography }}
                    />
                  ) : (
                    <p className="text-sm text-slate-400">
                      This instructor hasn't added a biography yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
