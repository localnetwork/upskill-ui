import { BarChart, Clock, Globe, Star } from "lucide-react";
import { useState, useRef } from "react";
import UserAvatar from "../../user/UserAvatar";
import Link from "next/link";
import { useRouter } from "next/router";
import BaseApi from "@/lib/api/_base.api";
import toast from "react-hot-toast";

export default function CourseOverview({ lecture, course }) {
  const { subtitle, instructional_level, description, author } = course;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCertificateLoading, setIsCertificateLoading] = useState(false);
  const containerRef = useRef(null); // ✅ fixed typing for JS/TS
  const router = useRouter();

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

  const allCurriculums =
    course?.sections?.flatMap((section) => section?.curriculums || []) || [];
  const completedCurriculumsCount = allCurriculums.filter(
    (curriculum) =>
      curriculum?.completed ||
      curriculum?.is_taken ||
      Number(curriculum?.progress_pct || 0) >= 100,
  ).length;
  const isCourseCompleted =
    allCurriculums.length > 0 &&
    completedCurriculumsCount >= allCurriculums.length;

  const handleGenerateCertificate = async () => {
    if (!course?.slug) return;
    if (!isCourseCompleted) {
      toast.error("Complete the full course to generate your certificate.");
      return;
    }

    try {
      setIsCertificateLoading(true);
      const response = await BaseApi.post("/api/certification", {
        courseSlug: course.slug,
      });
      const certificate = response?.data?.data;
      if (!certificate?.slug) {
        toast.error("Unable to generate certificate right now.");
        return;
      }
      router.push(`/certifications/${certificate.slug}`);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to generate certificate.");
    } finally {
      setIsCertificateLoading(false);
    }
  };

  console.log("course", course?.instructional_level?.title);

  return (
    <>
      <div class="space-y-4">
        <h2 className="text-xl font-bold">About this lesson</h2>
        <div
          className="text-slate-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: lecture?.curriculum_description }}
        />

        <div class="flex flex-wrap gap-3 mt-4">
          <span class="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
            UI Design
          </span>
          <span class="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
            Frontend
          </span>
          <span class="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
            Architecture
          </span>
        </div>
        <div class="pt-8 mt-8 border-t border-primary/10">
          <h2 class="text-xl font-bold mb-6">About this course</h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div class="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
              {/* <span class="material-symbols-outlined text-primary">
                bar_chart
              </span> */}
              <BarChart size={24} className="text-primary" />
              <div>
                <p class="text-[10px] text-slate-500 uppercase font-bold tracking-wider !mb-0">
                  Level
                </p>
                <p class="text-sm font-semibold">
                  {course?.instructional_level?.title}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
              <Clock className="text-primary" size={24} />
              <div>
                <p class="text-[10px] text-slate-500 uppercase font-bold tracking-wider !mb-0">
                  Duration
                </p>
                <p class="text-sm font-semibold">12 Hours total</p>
              </div>
            </div>
            <div class="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
              <Globe className="text-primary" size={24} />
              <div>
                <p class="text-[10px] text-slate-500 uppercase font-bold tracking-wider !mb-0">
                  Languages
                </p>
                <p class="text-sm font-semibold">English</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*  */}

      <div ref={containerRef} className="py-[50px] overflow-hidden">
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
            <button
              onClick={handleGenerateCertificate}
              disabled={isCertificateLoading || !isCourseCompleted}
              className="mt-[10px] px-[20px] py-[10px] border-[2px] font-bold border-[#0056D2] text-[#0056D2] hover:text-white rounded-[5px] hover:bg-[#1d6de0] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCertificateLoading ? "Generating..." : "Upskill Certificate"}
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
              <div className="flex w-full">
                <div className="max-w-[25%] rounded-full overflow-hidden">
                  <Link href={`/user/${author?.data?.username}`}>
                    <UserAvatar user={author} size="xxl" />
                  </Link>
                </div>
                <div className="w-full max-w-[75%] ml-[10px]">
                  <div className="font-semibold">
                    {`${author?.data?.firstname || ""} ${author?.data?.lastname || ""}`.trim() ||
                      author?.data?.username ||
                      "Instructor"}
                  </div>
                  <div className="text-gray-500">{author?.data?.headline}</div>
                </div>
              </div>
              <div
                className="mt-[10px]"
                dangerouslySetInnerHTML={{
                  __html: author?.data?.biography || "",
                }}
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
    </>
  );
}
