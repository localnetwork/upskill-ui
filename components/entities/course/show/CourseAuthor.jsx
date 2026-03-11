import Link from "next/link";
import UserAvatar from "../../user/UserAvatar";
import {
  ChevronDown,
  Medal,
  MonitorPlay,
  School,
  Star,
  StarIcon,
  StarOff,
  UsersRound,
  UserStar,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Image from "next/image";
export default function CourseAuthor({ author }) {
  const [expanded, setExpanded] = useState(false);
  const [visibleBio, setVisibleBio] = useState("");

  useEffect(() => {
    if (author?.biography) {
      // Split by <p> tags and keep first 3 paragraphs
      const paragraphs = author.biography
        .split(/<\/p>/i)
        .filter((p) => p.trim().length > 0)
        .map((p) => (p.endsWith("</p>") ? p : `${p}</p>`));

      const firstThree = paragraphs.slice(0, 2).join("");
      const full = paragraphs.join("");

      setVisibleBio(firstThree);
    }
  }, [author]);

  const handleToggle = () => {
    setExpanded((prev) => !prev);
  };

  const biographyContent = author?.biography || "";
  const paragraphsCount = biographyContent
    .split(/<\/p>/i)
    .filter(Boolean).length;

  return (
    <div className="p-8 border border-gray-200 rounded-2xl">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {author?.user_picture?.path ? (
          <Image
            width={400}
            height={400}
            alt={`${author?.firstname} ${author?.lastname}`}
            className="w-32 h-32 rounded-full object-cover ring-4 ring-slate-50"
            src={
              process.env.NEXT_PUBLIC_API_DOMAIN + author?.user_picture?.path
            }
          />
        ) : (
          <div></div>
        )}

        <div className="flex-1">
          <h3 className="text-2xl font-bold mb-1 font-secondary">
            {author?.firstname} {author?.lastname}
          </h3>
          <p className="text-slate-500 font-medium mb-4">{author?.headline}</p>
          <div className="flex flex-wrap gap-6 mb-6">
            <div className="flex items-center gap-2">
              <StarIcon className="text-yellow-500 fill-1" />
              <span className="text-sm font-bold">4.9 Instructor Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <UserStar className="text-slate-500" />
              <span className="text-sm font-bold">85,230 Reviews</span>
            </div>
            <div className="flex items-center gap-2">
              <School className="text-slate-500" />
              <span className="text-sm font-bold">12 Courses</span>
            </div>
          </div>

          <div
            className="text-slate-600 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: expanded ? biographyContent : visibleBio,
            }}
          />

          {console.log("paragraphsCount", paragraphsCount)}
          {paragraphsCount > 3 && (
            <button
              type="button"
              onClick={handleToggle}
              className="mt-3 flex text-[18px] items-center gap-[5px] text-[#0056D2] cursor-pointer font-medium hover:bg-[#F0F6FF] px-[5px] outline-none py-[5px] rounded-md"
            >
              {expanded ? "Show less" : "Show more"}{" "}
              <ChevronDown
                className={`${expanded ? "rotate-180" : ""}`}
                size={16}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
  return (
    <div>
      <div className="mb-2">
        <Link
          href={`/user/${author?.username}`}
          className="font-semibold underline text-[#0056D2] text-[20px]"
        >
          {author?.firstname} {author?.lastname}
        </Link>
      </div>
      {author?.headline && (
        <p className="font-light text-[18px]">{author?.headline}</p>
      )}

      <div className="flex mt-4">
        <div>
          <UserAvatar profile={author} size="xxl" />
        </div>
        <div className="pl-[30px]">
          <div className="flex items-center gap-2">
            <Star className="inline" size={15} />
            <p>4.7 Instructor Rating</p>
          </div>
          <div className="flex items-center gap-2">
            <Medal className="inline" size={15} />
            <p>10,000+ Reviews</p>
          </div>

          <div className="flex items-center gap-2">
            <UsersRound className="inline" size={15} />
            <p>1,000,000+ Students</p>
          </div>
          <div className="flex items-center gap-2">
            <MonitorPlay className="inline" size={15} />
            <p>50+ Courses</p>
          </div>
        </div>
      </div>

      {biographyContent ? (
        <>
          <div
            className="mt-4 description-content font-light"
            dangerouslySetInnerHTML={{
              __html: expanded ? biographyContent : visibleBio,
            }}
          />

          {paragraphsCount > 3 && (
            <button
              type="button"
              onClick={handleToggle}
              className="mt-3 flex text-[18px] items-center gap-[5px] text-[#0056D2] cursor-pointer font-medium hover:bg-[#F0F6FF] px-[5px] outline-none py-[5px] rounded-md"
            >
              {expanded ? "Show less" : "Show more"}{" "}
              <ChevronDown
                className={`${expanded ? "rotate-180" : ""}`}
                size={16}
              />
            </button>
          )}
        </>
      ) : (
        <p className="text-gray-500 italic">No biography available.</p>
      )}
    </div>
  );
}
