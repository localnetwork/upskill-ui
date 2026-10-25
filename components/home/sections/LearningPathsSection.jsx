import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, PlayCircle } from "lucide-react";
import BaseApi from "@/lib/api/_base.api";
import persistentStore from "@/lib/store/persistentStore";

const nextStepLabel = {
  in_progress: "Continue",
  enrolled: "Start",
  not_enrolled: "Next up",
};

function PathCard({ path }) {
  const next = path.next_course;
  const isEnrolledNext = next && next.status !== "not_enrolled";
  const href = next
    ? isEnrolledNext
      ? `/courses/${next.slug}/learn`
      : `/courses/${next.slug}`
    : "/courses";

  return (
    <div className="flex flex-col rounded-xl bg-slate-50 p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">
            {path.category?.name}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {path.completed_courses}/{path.total_courses} courses completed
          </p>
        </div>
        {path.reason === "wishlist" && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            Suggested
          </span>
        )}
      </div>
      {path.levels_label && (
        <p className="mt-2 text-xs font-medium text-slate-700">
          {path.levels_label}
        </p>
      )}
      <div className="mt-4 h-1.5 w-full rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${path.progress_pct}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        {path.progress_pct}% complete
      </p>

      {next && (
        <Link
          href={href}
          className="mt-4 flex items-center gap-3 rounded-lg bg-white p-2 hover:bg-slate-100"
        >
          <Image
            src={next.cover_image?.path || "/placeholder-cover.webp"}
            alt={next.title}
            width={56}
            height={40}
            className="h-10 w-14 shrink-0 rounded object-cover"
          />
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase text-primary">
              <PlayCircle size={12} />
              {nextStepLabel[next.status]}
            </p>
            <p className="line-clamp-1 text-xs font-medium text-slate-900">
              {next.title}
            </p>
          </div>
        </Link>
      )}
    </div>
  );
}

export default function LearningPathsSection() {
  const profile = persistentStore((state) => state.profile);
  const [mounted, setMounted] = useState(false);
  const [paths, setPaths] = useState([]);
  const isLearner = Boolean(
    profile?.permissions?.includes("view-own-learnings"),
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !isLearner) return;
    BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/learning-paths/me`)
      .then((response) => setPaths(response?.data?.data?.paths || []))
      .catch(() => setPaths([]));
  }, [mounted, isLearner]);

  if (!mounted || !isLearner || !paths.length) return null;

  return (
    <section data-home-section="" className="bg-white py-12">
      <div className="container">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            Your learning paths
          </h2>
          <Link
            href="/my-courses/learning"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            View my learning <ArrowRight size={14} />
          </Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {paths.map((path) => (
            <PathCard key={path.id} path={path} />
          ))}
        </div>
      </div>
    </section>
  );
}
