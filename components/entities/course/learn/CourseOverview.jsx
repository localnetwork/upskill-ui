import { Star } from "lucide-react";
import { useState, useRef } from "react";
import UserAvatar from "../../user/UserAvatar";
import Link from "next/link";

export default function CourseOverview({ course }) {
  const { subtitle, instructional_level, description, author } = course;
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef(null); // ✅ fixed typing for JS/TS

  const toggleExpanded = () => {
    if (isExpanded && containerRef.current) {
      const container = containerRef.current;
      setIsExpanded(false);
      // allow collapse animation to finish before scrolling
      setTimeout(() => {
        container.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 300);
    } else {
      setIsExpanded(true);
    }
  };

  return (
    <div ref={containerRef} className="py-[50px] px-[100px] overflow-hidden">
      <h2 className="text-[25px]">{subtitle}</h2>

      {/* Ratings */}
      <div className="flex gap-[30px] py-[20px] border-b border-[#d1d2e0]">
        <div>
          <span className="text-[#C4710D] text-[18px] flex items-center gap-x-[2px] font-semibold">
            4.7 <Star size={18} />
          </span>
          <p className="text-gray-500">23,567 ratings</p>
        </div>
        <div>
          <span className="font-semibold text-[18px]">149,283</span>
          <p className="text-gray-500">Students</p>
        </div>
        <div>
          <span className="font-semibold text-[18px]">84 hours</span>
          <p className="text-gray-500">Total</p>
        </div>
      </div>

      {/* By the numbers */}
      <div className="flex px-[25px] font-light text-[18px] gap-[30px] py-[20px] border-b border-[#d1d2e0]">
        <div className="w-[25%]">By the numbers</div>
        <div className="w-[75%] grid grid-cols-2">
          <div>
            <div>Skill level: {instructional_level?.title}</div>
            <div>Students: 149,283</div>
            <div>Languages: English</div>
            <div>Captions: Yes</div>
          </div>
          <div>
            <div>Lectures: {course?.resources_count?.curriculum_count}</div>
            <div>Video: 84 total hours</div>
          </div>
        </div>
      </div>

      {/* Certificate */}
      <div className="flex px-[25px] font-light text-[18px] gap-[30px] py-[20px] border-b border-[#d1d2e0]">
        <div className="w-[25%]">Certificate</div>
        <div className="w-[75%]">
          <p>Get Upskill certificate by completing entire course</p>
          <button className="mt-[10px] px-[20px] py-[10px] border-[2px] font-bold border-[#0056D2] text-[#0056D2] hover:text-white rounded-[5px] hover:bg-[#1d6de0] transition">
            Upskill Certificate
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="flex px-[25px] font-light text-[18px] gap-[30px] py-[20px] border-b border-[#d1d2e0]">
        <div className="w-[25%]">Description</div>
        <div
          className={`w-[75%] transition-all duration-300 ${
            isExpanded ? "" : "line-clamp-10"
          }`}
          dangerouslySetInnerHTML={{ __html: description }}
        ></div>
      </div>

      {/* Instructor (only visible when expanded) */}
      {isExpanded && (
        <div className="flex px-[25px] font-light text-[18px] gap-[30px] py-[20px] border-b border-[#d1d2e0]">
          <div className="w-[25%]">Instructor</div>
          <div className="w-[75%]">
            <div className="flex">
              <Link href={`/user/${author?.data?.username}`}>
                <UserAvatar user={author} size="xxl" />
              </Link>
              <div className="ml-[10px]">
                {console.log("author?.data", author?.data)}
                <div className="font-semibold">
                  {author?.data?.firstname} {author?.data?.lastname}
                </div>
                <div className="text-gray-500">{author?.data?.headline}</div>
              </div>
            </div>
            <div
              className="mt-[10px]"
              dangerouslySetInnerHTML={{ __html: author?.data?.biography }}
            />
          </div>
        </div>
      )}

      {/* Show more / less button */}
      <div className="flex mt-6">
        <button
          onClick={toggleExpanded}
          className="bg-[#0056D2] max-w-[150px] flex items-center justify-center gap-[5px] text-center font-semibold text-white px-[20px] py-[10px] rounded-[5px] w-full hover:bg-[#1d6de0] transition"
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      </div>
    </div>
  );
}
