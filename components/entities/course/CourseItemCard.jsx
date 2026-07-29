import Image from "next/image";
import Link from "next/link";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function CourseItemCard({ entry }) {
  const slug = entry?.course_slug || "";
  const coverPath = entry?.cover_image?.path || "/placeholder-cover.webp";
  const reviewsCount = Number(entry?.reviews_count || 0);
  const reviewsLabel = `${reviewsCount.toLocaleString("en-PH")} review${reviewsCount === 1 ? "" : "s"}`;

  return (
    <Link
      href={slug ? `/courses/${slug}` : "#"}
      className="border rounded-md overflow-hidden bg-white hover:shadow-md transition-shadow block"
    >
      <div className="relative h-[170px] w-full">
        <Image
          src={coverPath}
          alt={entry?.course_title || "Course"}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-[18px] line-clamp-2">
          {entry?.course_title || "Course"}
        </h3>
        <p className="text-[13px] text-gray-600 mt-1">
          {entry?.instructor_name || "Instructor"}
        </p>
        <p className="text-[12px] text-gray-500 mt-1">{reviewsLabel}</p>
        <p className="text-[12px] text-emerald-700 mt-3 font-semibold">
          Completed: {formatDate(entry?.completed_at)}
        </p>
      </div>
    </Link>
  );
}
