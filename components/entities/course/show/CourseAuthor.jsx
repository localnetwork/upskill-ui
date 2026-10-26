import Link from "next/link";
import { ChevronDown, School, Star, UsersRound, UserStar } from "lucide-react";
import { useMemo, useState } from "react";
import Image from "next/image";

const COLLAPSED_TEXT_LIMIT = 280;

function resolvePicture(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_API_DOMAIN || ""}${path}`;
}

function formatCount(value) {
  return Number(value || 0).toLocaleString();
}

export default function CourseAuthor({ author }) {
  const [expanded, setExpanded] = useState(false);

  const fullName = `${author?.firstname || ""} ${author?.lastname || ""}`.trim();
  const initials =
    `${author?.firstname?.[0] || ""}${author?.lastname?.[0] || ""}`.toUpperCase();
  const pictureSrc = resolvePicture(author?.user_picture?.path);
  const stats = author?.stats || {};
  const biography = author?.biography || "";

  const isLongBio = useMemo(() => {
    const plainText = biography.replace(/<[^>]*>/g, "").trim();
    const paragraphs = biography.split(/<\/p>/i).filter((p) => p.trim()).length;
    return plainText.length > COLLAPSED_TEXT_LIMIT || paragraphs > 2;
  }, [biography]);

  if (!author) return null;

  const statItems = [
    {
      icon: Star,
      value: Number(stats.average_rating || 0).toFixed(1),
      label: "Instructor Rating",
      iconClass: "text-yellow-500 fill-yellow-500",
    },
    {
      icon: UserStar,
      value: formatCount(stats.total_reviews),
      label: "Reviews",
    },
    {
      icon: UsersRound,
      value: formatCount(stats.total_learners),
      label: "Learners",
    },
    {
      icon: School,
      value: formatCount(stats.published_courses),
      label: Number(stats.published_courses) === 1 ? "Course" : "Courses",
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 p-5 sm:p-8">
      <div className="flex flex-col items-start gap-6 md:flex-row md:gap-8">
        {pictureSrc ? (
          <Image
            width={400}
            height={400}
            alt={fullName || "Instructor"}
            className="h-32 w-32 shrink-0 rounded-full object-cover ring-4 ring-slate-50"
            src={pictureSrc}
          />
        ) : (
          <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-[#0056D2] text-4xl font-semibold text-white ring-4 ring-slate-50">
            {initials || "?"}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="mb-1 font-secondary text-2xl font-bold">
            {author?.username ? (
              <Link
                href={`/user/${author.username}`}
                className="hover:text-[#0056D2] hover:underline"
              >
                {fullName || author.username}
              </Link>
            ) : (
              fullName
            )}
          </h3>
          {author?.headline ? (
            <p className="mb-4 font-medium text-slate-500">{author.headline}</p>
          ) : null}

          <div className="mb-6 flex flex-wrap gap-x-6 gap-y-3">
            {statItems.map(({ icon: Icon, value, label, iconClass }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon size={20} className={iconClass || "text-slate-500"} />
                <span className="text-sm font-bold">
                  {value} {label}
                </span>
              </div>
            ))}
          </div>

          {biography ? (
            <>
              <div className="relative">
                <div
                  className={`description-content leading-relaxed text-slate-600 break-words ${
                    isLongBio && !expanded ? "max-h-[8.5rem] overflow-hidden" : ""
                  }`}
                  dangerouslySetInnerHTML={{ __html: biography }}
                />
                {isLongBio && !expanded ? (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent" />
                ) : null}
              </div>
              {isLongBio ? (
                <button
                  type="button"
                  onClick={() => setExpanded((prev) => !prev)}
                  className="mt-3 flex cursor-pointer items-center gap-[5px] rounded-md px-[5px] py-[5px] font-medium text-[#0056D2] outline-none hover:bg-[#F0F6FF]"
                >
                  {expanded ? "Read less" : "Read more"}
                  <ChevronDown
                    className={expanded ? "rotate-180" : ""}
                    size={16}
                  />
                </button>
              ) : null}
            </>
          ) : (
            <p className="italic text-gray-500">No biography available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
