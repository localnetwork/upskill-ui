import MyCoursesLayout from "@/components/partials/MyCoursesLayout";
import AccessBanner from "@/components/entities/subscription/AccessBanner";
import BaseApi from "@/lib/api/_base.api";
import ORDERAPI from "@/lib/api/orders/request";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Play, Search } from "lucide-react";

const SOURCE_META = {
  PURCHASE: { label: "Purchased", className: "bg-emerald-600 text-white" },
  TRIAL: { label: "Free trial", className: "bg-amber-500 text-white" },
  SUBSCRIPTION: { label: "Subscription", className: "bg-[#0056d2] text-white" },
};

const SOURCE_FILTERS = [
  { key: "ALL", label: "All" },
  { key: "PURCHASE", label: "Purchased" },
  { key: "TRIAL", label: "Free trial" },
  { key: "SUBSCRIPTION", label: "Subscription" },
];

const PROGRESS_FILTERS = [
  { key: "ALL", label: "Any progress" },
  { key: "NOT_STARTED", label: "Not started" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "COMPLETED", label: "Completed" },
];

function progressState(item) {
  const pct = Number(item?.progress?.progress_pct || 0);
  if (pct >= 100) return "COMPLETED";
  return pct > 0 ? "IN_PROGRESS" : "NOT_STARTED";
}

function daysLeft(endsAt) {
  if (!endsAt) return null;
  const diff = new Date(endsAt).getTime() - Date.now();
  return diff > 0 ? Math.ceil(diff / 86400000) : 0;
}

export default function Page() {
  const [items, setItems] = useState([]);
  const [source, setSource] = useState("ALL");
  const [progressFilter, setProgressFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const router = useRouter();
  useEffect(() => {
    async function fetchLearnings() {
      try {
        const response = await ORDERAPI.myLearnings();
        setItems(response?.data?.data || []);
      } catch (error) {
        console.error("Error fetching learnings:", error);
      }
    }

    fetchLearnings();
  }, []);

  const counts = useMemo(() => {
    const result = { ALL: items.length, PURCHASE: 0, TRIAL: 0, SUBSCRIPTION: 0 };
    items.forEach((item) => {
      const key = item.accessSource || "PURCHASE";
      if (result[key] !== undefined) result[key] += 1;
    });
    return result;
  }, [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (source !== "ALL" && (item.accessSource || "PURCHASE") !== source) return false;
      if (progressFilter !== "ALL" && progressState(item) !== progressFilter) return false;
      if (term && !String(item.course?.title || "").toLowerCase().includes(term)) return false;
      return true;
    });
  }, [items, source, progressFilter, search]);

  return (
    <MyCoursesLayout title="My Learning">
      <AccessBanner />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {SOURCE_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setSource(filter.key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium ${source === filter.key ? "border-[#0056d2] bg-[#0056d2] text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              {filter.label} ({counts[filter.key]})
            </button>
          ))}
        </div>
        <select
          value={progressFilter}
          onChange={(event) => setProgressFilter(event.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm"
        >
          {PROGRESS_FILTERS.map((filter) => (
            <option key={filter.key} value={filter.key}>
              {filter.label}
            </option>
          ))}
        </select>
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search my courses"
            className="rounded-md border border-slate-300 py-1.5 pl-9 pr-3 text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-[20px]">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <div
              key={item.id}
              className="cursor-pointer relative group"
              onClick={() => router.push(`/courses/${item.course.slug}/learn`)}
            >
              {(() => {
                const progress = Number(item?.progress?.progress_pct || 0);
                const completedLessons = Number(
                  item?.progress?.completed_lessons || 0,
                );
                const totalLessons = Number(item?.progress?.total_lessons || 0);
                const progressLabel =
                  progress >= 100
                    ? "Completed"
                    : progress > 0
                      ? "Continue Course"
                      : "Start Course";
                const progressWidth = Math.min(100, Math.max(0, progress));
                const coverPath = item?.course?.cover_image?.path;

                return (
                  <>
                    <div className="relative">
                      <Link
                        className="absolute p-[15px] group-hover:opacity-100 opacity-0 bg-[rgba(0,0,0,.5)] flex items-center justify-center bg-opacity-20 top-0 left-0 w-full h-full"
                        href={`/courses/${item.course.slug}/learn`}
                      >
                        <span className="p-3 bg-white rounded-full flex items-center justify-center group-hover:scale-100 scale-80 transition-all">
                          <Play size={30} className="text-black opacity-80" />
                        </span>
                      </Link>
                      <span
                        className={`absolute left-2 top-2 z-10 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow ${(SOURCE_META[item.accessSource] || SOURCE_META.PURCHASE).className}`}
                      >
                        {(SOURCE_META[item.accessSource] || SOURCE_META.PURCHASE).label}
                        {item.accessSource === "TRIAL" && daysLeft(item.accessEndsAt) !== null
                          ? ` · ${daysLeft(item.accessEndsAt)}d left`
                          : ""}
                      </span>
                      <Image
                        src={coverPath ? coverPath : "/placeholder-cover.webp"}
                        alt={item.course.title}
                        width={400}
                        height={200}
                        className="w-full h-[200px] object-cover mb-4"
                      />
                    </div>

                    <h3 className="font-semibold text-[18px]">
                      {item.course.title}
                    </h3>

                    <p className="font-light text-[14px]">
                      {item.course.educator?.firstName}{" "}
                      {item.course.educator?.lastName}
                    </p>

                    <div className="mt-3 text-[14px] font-light">
                      <div className="h-[4px] bg-[#ddd] w-full rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0056D2]"
                          style={{ width: `${progressWidth}%` }}
                        />
                      </div>

                      <div className="mt-1 flex justify-between text-[13px]">
                        <span>{progressLabel}</span>
                        <span>
                          {Math.round(progressWidth)}%{" "}
                          {totalLessons > 0
                            ? `(${completedLessons}/${totalLessons})`
                            : ""}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ))
        ) : (
          <p>No courses found.</p>
        )}
      </div>
    </MyCoursesLayout>
  );
}
