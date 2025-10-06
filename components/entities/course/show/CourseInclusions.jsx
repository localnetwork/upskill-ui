import { MonitorPlay, Newspaper, Smartphone, Trophy } from "lucide-react";

export default function CourseInclusions({ course }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-[14px]">
      {course?.resources_count?.video_count > 0 && (
        <div className="flex items-center gap-2 font-light">
          <MonitorPlay size={30} />
          {course?.resources_count?.video_count} on-demand videos
        </div>
      )}
      {course?.resources_count?.article_count > 0 && (
        <div className="flex items-center gap-2 font-light">
          <Newspaper size={30} />
          {course?.resources_count?.article_count} articles
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
