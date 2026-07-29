import UserProfileBanner from "@/components/entities/user/profiles/UserProfileBanner";
import UserProfileInstructorCourses from "@/components/entities/user/profiles/UserProfileInstructorCourses";
import CourseItemCard from "@/components/entities/course/CourseItemCard";
import BaseApi from "@/lib/api/_base.api";
import Link from "next/link";
import { BadgeCheck, ChevronDown, Medal, ShieldCheck } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

export const getServerSideProps = async (context) => {
  const safeSlug = context.params.slug
    ? context.params.slug.replace(/ /g, "-")
    : "";

  let profile = null;

  try {
    const response = await BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/user/${safeSlug}`,
    );
    if (response?.data) {
      profile = response.data;
    }
  } catch (error) {
    return {
      notFound: true,
    };
  }

  return { props: { profile } };
};

export default function PublicProfile({ profile }) {
  const router = useRouter();
  const { slug } = router.query;
  const safeSlug = typeof slug === "string" ? slug.replace(/ /g, "-") : "";

  const [expanded, setExpanded] = useState(false);
  const [visibleBio, setVisibleBio] = useState("");

  useEffect(() => {
    if (profile?.biography) {
      // Split by <p> tags and keep first 3 paragraphs
      const paragraphs = profile.biography
        .split(/<\/p>/i)
        .filter((p) => p.trim().length > 0)
        .map((p) => (p.endsWith("</p>") ? p : `${p}</p>`));

      const firstThree = paragraphs.slice(0, 3).join("");
      const full = paragraphs.join("");

      setVisibleBio(firstThree);
    }
  }, [profile]);

  const handleToggle = () => {
    setExpanded((prev) => !prev);
  };

  const biographyContent = profile?.biography || "";
  const paragraphsCount = biographyContent
    .split(/<\/p>/i)
    .filter(Boolean).length;

  const isInstructor = useMemo(
    () => profile?.roles?.some((role) => role.role_name === "Instructor"),
    [profile],
  );

  const isLearner = useMemo(
    () => profile?.roles?.some((role) => role.role_name === "Learner"),
    [profile],
  );

  const educatorStats = profile?.stats?.educator || {};
  const learnerStats = profile?.stats?.learner || {};
  const completedCourses = Array.isArray(profile?.completed_courses)
    ? profile.completed_courses
    : [];
  const certifications = Array.isArray(profile?.certifications)
    ? profile.certifications
    : [];

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  return (
    <div>
      <UserProfileBanner profile={profile} />

      <div className="container">
        <div className="pt-[30px] pb-[50px]">
          {isInstructor && (
            <div className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[900px]">
              <div className="border rounded-md p-4">
                <div className="font-semibold text-[24px]">
                  {Number(educatorStats?.total_learners || 0)}
                </div>
                <div className="text-[13px] text-gray-600">Total learners</div>
              </div>
              <div className="border rounded-md p-4">
                <div className="font-semibold text-[24px]">
                  {Number(educatorStats?.total_reviews || 0)}
                </div>
                <div className="text-[13px] text-gray-600">Reviews</div>
              </div>
              <div className="border rounded-md p-4">
                <div className="font-semibold text-[24px]">
                  {Number(educatorStats?.published_courses || 0)}
                </div>
                <div className="text-[13px] text-gray-600">Published courses</div>
              </div>
              <div className="border rounded-md p-4">
                <div className="font-semibold text-[24px]">
                  {Number(educatorStats?.average_rating || 0).toFixed(2)}
                </div>
                <div className="text-[13px] text-gray-600">Average rating</div>
              </div>
            </div>
          )}

          {isLearner && (
            <div className="mb-10 grid grid-cols-2 gap-4 max-w-[420px]">
              <div className="border rounded-md p-4">
                <div className="font-semibold text-[24px]">
                  {Number(learnerStats?.completed_courses_count || 0)}
                </div>
                <div className="text-[13px] text-gray-600">Completed courses</div>
              </div>
              <div className="border rounded-md p-4">
                <div className="font-semibold text-[24px]">
                  {Number(learnerStats?.certifications_count || 0)}
                </div>
                <div className="text-[13px] text-gray-600">Certifications</div>
              </div>
            </div>
          )}

          <h2 className="font-semibold text-[30px] mb-4">About Me</h2>

          {biographyContent ? (
            <>
              <div
                className="max-w-[700px] text-[18px]"
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

          {isLearner && (
            <div className="mt-[50px]">
              <h2 className="font-semibold text-[30px] mb-4">Certifications</h2>
              {certifications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[1100px]">
                  {certifications.map((certification) => (
                    <div
                      key={certification.slug}
                      className="relative bg-white rounded-lg p-1 shadow-md overflow-hidden"
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none">
                        <BadgeCheck size={260} />
                      </div>
                      <div className="relative z-10 border-2 border-[#dbeafe] rounded-[calc(0.5rem-4px)] p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-10 h-10 rounded-full bg-[#dbeafe] flex items-center justify-center">
                              <Medal className="text-[#0056D2]" size={20} />
                            </span>
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#0056D2]">
                                Certificate of Completion
                              </p>
                              <p className="text-[12px] text-gray-600">
                                Issued: {formatDate(certification.issued_at)}
                              </p>
                            </div>
                          </div>
                          <ShieldCheck className="text-[#ea580c]" size={22} />
                        </div>

                        <div className="mt-5">
                          <p className="text-[12px] text-gray-500 italic">
                            Successfully completed
                          </p>
                          <p className="font-semibold text-[20px] mt-1 leading-tight">
                            {certification.course_title}
                          </p>
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold">
                              Certification No
                            </p>
                            <p className="text-[12px] font-semibold">
                              {certification.certification_no || "—"}
                            </p>
                          </div>
                          <Link
                            href={`/certifications/${certification.slug}`}
                            className="rounded-full bg-[#0056D2] text-white text-[12px] font-semibold px-4 py-2 hover:opacity-90"
                          >
                            View certificate
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No certifications yet.</p>
              )}
            </div>
          )}

          {isLearner && (
            <div className="mt-[50px]">
              <h2 className="font-semibold text-[30px] mb-4">Completed courses</h2>
              {completedCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-[1200px]">
                  {completedCourses.map((entry) => (
                    <CourseItemCard key={entry.enrollment_id} entry={entry} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No completed courses yet.</p>
              )}
            </div>
          )}

          {isInstructor && <UserProfileInstructorCourses profile={profile} />}
        </div>
      </div>
    </div>
  );
}
