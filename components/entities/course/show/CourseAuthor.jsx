import Link from "next/link";
import UserAvatar from "../../user/UserAvatar";
import {
  ChevronDown,
  Medal,
  MonitorPlay,
  Star,
  StarOff,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
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
