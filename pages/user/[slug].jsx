import UserProfileBanner from "@/components/entities/user/profiles/UserProfileBanner";
import BaseApi from "@/lib/api/_base.api";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export const getServerSideProps = async (context) => {
  const safeSlug = context.params.slug
    ? context.params.slug.replace(/ /g, "-")
    : "";

  let profile = null;

  try {
    const response = await BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/user/${safeSlug}`
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

  return (
    <div>
      <UserProfileBanner profile={profile} />

      <div className="container">
        <div className="px-[50px] pt-[30px] pb-[50px] pr-[370px]">
          <div className="mb-10 flex items-center gap-5">
            <div className="flex w-[200px] font-light text-[14px] flex-col justify-center">
              <span className="font-semibold text-[18px]">
                3,293,361 learners
              </span>
              Total Learners
            </div>
            <div className="flex w-[200px] font-light text-[14px] flex-col justify-center">
              <span className="font-semibold text-[18px]">1,009,056</span>
              Reviews
            </div>
          </div>

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
        </div>
      </div>
    </div>
  );
}
