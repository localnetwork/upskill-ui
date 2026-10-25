import { useEffect, useRef, useState } from "react";
import CourseBuilder from "@/components/entities/course/form/CourseBuilder";
import CourseManagementLayout from "@/components/partials/CourseManagementLayout";
import InstructorLayout from "@/components/partials/InstructorLayout";
import BaseApi from "@/lib/api/_base.api";

import { setContext } from "@/lib/api/interceptor";
export async function getServerSideProps(context) {
  const { slug } = context.params;

  setContext(context);

  let course = null;
  try {
    const response = await BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/courses/${slug}/manage`,
    );
    course = response?.data?.data;
  } catch (error) {
    console.error("Error fetching course:", error);
    return { notFound: true };
  }

  return {
    props: { course },
  };
}

export default function CurriculumPage({ course }) {
  const [liveJob, setLiveJob] = useState(null);
  const [liveTick, setLiveTick] = useState(0);
  const wasLiveRef = useRef(false);

  // While an AI draft is generating this course, poll the job and refresh the curriculum.
  useEffect(() => {
    let stopped = false;
    const poll = async () => {
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/ai-draft/jobs/latest`,
        );
        const job = response?.data?.data || null;
        if (stopped) return;
        const isThisCourse =
          job?.course &&
          (job.course.id === course?.id || job.course.slug === course?.slug);
        if (isThisCourse) {
          wasLiveRef.current = true;
          setLiveJob(job);
          setLiveTick((tick) => tick + 1);
        } else if (wasLiveRef.current) {
          // Job finished: one last refresh to pick up the final items.
          wasLiveRef.current = false;
          setLiveJob(null);
          setLiveTick((tick) => tick + 1);
        }
      } catch (_error) {}
    };
    poll();
    const timer = setInterval(poll, 3000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [course?.id, course?.slug]);

  const draftProgress = liveJob?.draftProgress;

  return (
    <CourseManagementLayout
      course={course}
      activeTab="curriculum"
      title="Curriculum"
    >
      {liveJob && (
        <div className="mb-6 rounded-xl border border-[#dbeafe] bg-[#eff6ff] p-4">
          <p className="font-semibold text-[#1d4ed8]">
            AI is still drafting this curriculum. New items appear as they are
            generated.
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#bfdbfe]">
            <div
              className="h-full rounded-full bg-[#2563eb] transition-all duration-500"
              style={{
                width: `${Math.max(8, Math.min(100, Number(liveJob.progressPercent || 0)))}%`,
              }}
            />
          </div>
          <p className="mt-2 text-[13px] text-slate-600">{liveJob.message}</p>
          {draftProgress && (
            <p className="text-[12px] text-slate-500 mt-1">
              Sections: {draftProgress.sectionsCreated}/{draftProgress.totalSections} ·
              Curriculums: {draftProgress.lessonsCreated}/{draftProgress.totalLessons}
            </p>
          )}
        </div>
      )}

      <p className="mb-6">
        Start putting together your course by creating sections, lectures and
        practice (quizzes, coding exercises and assignments).
      </p>

      <CourseBuilder courseId={course?.id} liveTick={liveTick} />
    </CourseManagementLayout>
  );
}
