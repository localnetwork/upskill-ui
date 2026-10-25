import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import {
  listDownloads,
  onDownloadsChange,
  removeDownload,
} from "@/lib/offline/downloads";

const formatSize = (bytes) =>
  bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : "";

export default function OfflinePage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = () => listDownloads().then(setItems).catch(() => {});
    load();
    return onDownloadsChange(load);
  }, []);

  const byCourse = items.reduce((acc, item) => {
    const key = item.courseSlug || "unknown";
    (acc[key] = acc[key] || { title: item.courseTitle, lessons: [] }).lessons.push(item);
    return acc;
  }, {});

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold">You&apos;re offline</h1>
      <p className="mt-2 text-slate-600">
        This page isn&apos;t available offline. Lessons you downloaded are
        listed below.
      </p>

      {items.length === 0 ? (
        <p className="mt-8 text-slate-500">No downloaded lessons yet.</p>
      ) : (
        Object.entries(byCourse).map(([slug, course]) => (
          <section key={slug} className="mt-8">
            <h2 className="text-lg font-semibold">{course.title || slug}</h2>
            <ul className="mt-3 divide-y rounded-xl border">
              {course.lessons.map((lesson) => (
                <li
                  key={lesson.lessonId}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <Link
                    className="text-primary hover:underline"
                    href={`/courses/${encodeURIComponent(slug)}/learn?lecture=${lesson.lessonUuid}`}
                  >
                    {lesson.title}
                  </Link>
                  <span className="flex items-center gap-3 text-sm text-slate-500">
                    {formatSize(lesson.size)}
                    <button
                      type="button"
                      aria-label="Remove download"
                      onClick={() => removeDownload(lesson.lessonId)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
