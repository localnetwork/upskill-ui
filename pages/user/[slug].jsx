import UserProfileBanner from "@/components/entities/user/profiles/UserProfileBanner";
import UserProfileInstructorCourses from "@/components/entities/user/profiles/UserProfileInstructorCourses";
import CourseItemCard from "@/components/entities/course/CourseItemCard";
import CertificateCard from "@/components/entities/certificate/CertificateCard";
import BaseApi from "@/lib/api/_base.api";
import Link from "next/link";
import {
  ChevronDown,
  Users,
  MessageSquare,
  BookOpen,
  Star,
} from "lucide-react";
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

  return (
    <div>
      <UserProfileBanner profile={profile} />

      <div className="container">
        <div className="pt-[30px] pb-[50px]">
          {isInstructor && (
            <div className="mb-10 grid max-w-[800px] grid-cols-2 gap-4 md:grid-cols-4">
              {[
                {
                  label: "Total learners",
                  value: Number(educatorStats?.total_learners || 0),
                  icon: Users,
                  iconColor: "text-primary",
                  iconBg: "bg-blue-50",
                  border: "border-blue-100",
                },
                {
                  label: "Reviews",
                  value: Number(educatorStats?.total_reviews || 0),
                  icon: MessageSquare,
                  iconColor: "text-purple-600",
                  iconBg: "bg-purple-50",
                  border: "border-purple-100",
                },
                {
                  label: "Published courses",
                  value: Number(educatorStats?.published_courses || 0),
                  icon: BookOpen,
                  iconColor: "text-emerald-600",
                  iconBg: "bg-emerald-50",
                  border: "border-emerald-100",
                },
                {
                  label: "Average rating",
                  value: Number(educatorStats?.average_rating || 0).toFixed(2),
                  icon: Star,
                  iconColor: "text-amber-600",
                  iconBg: "bg-amber-50",
                  border: "border-amber-100",
                },
              ].map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className={`group rounded-xl border ${stat.border} bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[26px] font-bold leading-none tracking-tight text-gray-900">
                          {stat.value}
                        </div>

                        <div className="mt-2 text-[13px] font-medium text-gray-500">
                          {stat.label}
                        </div>
                      </div>

                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.iconBg}`}
                      >
                        <Icon
                          size={20}
                          strokeWidth={2}
                          className={stat.iconColor}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {isLearner && (
            <div className="mb-10 grid grid-cols-2 gap-4 max-w-[420px]">
              <div className="border rounded-md p-4">
                <div className="font-semibold text-[24px]">
                  {Number(learnerStats?.completed_courses_count || 0)}
                </div>
                <div className="text-[13px] text-gray-600">
                  Completed courses
                </div>
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
                    <CertificateCard
                      key={certification.slug}
                      certification={certification}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No certifications yet.</p>
              )}
            </div>
          )}

          {isLearner && (
            <div className="mt-[50px]">
              <h2 className="font-semibold text-[30px] mb-4">
                Completed courses
              </h2>
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
