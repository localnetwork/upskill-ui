import {
  Code,
  List,
  MonitorPlay,
  Newspaper,
  Smartphone,
  Trophy,
} from "lucide-react";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${Math.max(minutes, 1)}m`;
}

function normalizeLessonType(lesson = {}) {
  const explicitType = String(
    lesson?.curriculum_resource_type || lesson?.type || "",
  ).toLowerCase();

  if (explicitType === "video") return "video";
  if (explicitType === "quiz") return "quiz";
  if (explicitType === "coding_exercise") return "coding_exercise";
  if (explicitType === "article" || explicitType === "resource")
    return "article";

  if (lesson?.videoUrl) return "video";
  if (lesson?.assignmentText) return "article";

  return "unknown";
}

export default function CourseInclusions({ course }) {
  const lessonRows = asArray(course?.sections).flatMap((section) => {
    const curriculums = asArray(section?.curriculums);
    if (curriculums.length) return curriculums;
    return asArray(section?.lessons);
  });

  const lectureCount =
    Number(course?.resources_count?.curriculum_count || 0) || lessonRows.length;

  const articleCount =
    Number(course?.resources_count?.article_count || 0) ||
    lessonRows.filter((lesson) => normalizeLessonType(lesson) === "article")
      .length;

  const videoLessons = lessonRows.filter(
    (lesson) => normalizeLessonType(lesson) === "video",
  );
  const videoCount =
    Number(course?.resources_count?.video_count || 0) || videoLessons.length;
  const videoDurationSeconds = videoLessons.reduce(
    (sum, lesson) =>
      sum +
      Number(lesson?.estimated_duration || lesson?.durationInSeconds || 0),
    0,
  );

  const codingExerciseCount = lessonRows.filter(
    (lesson) => normalizeLessonType(lesson) === "coding_exercise",
  ).length;
  const quizCount = lessonRows.filter(
    (lesson) => normalizeLessonType(lesson) === "quiz",
  ).length;

  return (
    <div className="grid grid-cols-2 gap-3 text-[14px]">
      {videoCount > 0 && (
        <div className="flex items-center gap-2 font-light">
          <MonitorPlay size={30} />
          {videoDurationSeconds > 0
            ? `${formatDuration(videoDurationSeconds)} on-demand video`
            : `${videoCount} on-demand video${videoCount === 1 ? "" : "s"}`}
        </div>
      )}
      {lectureCount > 0 && (
        <div className="flex items-center gap-2 font-light">
          <List size={30} />
          {lectureCount} lecture{lectureCount === 1 ? "" : "s"}
        </div>
      )}
      {articleCount > 0 && (
        <div className="flex items-center gap-2 font-light">
          <Newspaper size={30} />
          {articleCount} article{articleCount === 1 ? "" : "s"}
        </div>
      )}
      {codingExerciseCount > 0 && (
        <div className="flex items-center gap-2 font-light">
          <Code size={30} />
          {codingExerciseCount} coding exercise
          {codingExerciseCount === 1 ? "" : "s"}
        </div>
      )}
      {quizCount > 0 && (
        <div className="flex items-center gap-2 font-light">
          <List size={30} />
          {quizCount} quiz{quizCount === 1 ? "" : "zes"}
        </div>
      )}

      <div className="flex items-center gap-2 font-light">
        <Smartphone size={30} />
        Access on mobile and TV
      </div>

      <div className="flex items-center gap-2 font-light">
        <Trophy size={30} />
        Certificate of completion
      </div>
    </div>
  );
}
