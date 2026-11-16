import InstructorProfileBody from "@/components/entities/user/profiles/InstructorProfileBody";
import BaseApi from "@/lib/api/_base.api";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Seo from "@/components/partials/Seo";
import {
  ProfileEditProvider,
  useProfileEdit,
} from "@/components/entities/user/profiles/inlineEdit";
import { absoluteUrl, mediaUrl, stripHtml, truncate } from "@/lib/seo";

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
  return (
    <ProfileEditProvider initialProfile={profile}>
      <PublicProfileView />
    </ProfileEditProvider>
  );
}

function PublicProfileView() {
  const { profile } = useProfileEdit();
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

      setVisibleBio(paragraphs.slice(0, 3).join(""));
    }
  }, [profile]);

  const biographyContent = profile?.biography || "";
  const paragraphsCount = biographyContent
    .split(/<\/p>/i)
    .filter(Boolean).length;

  const profileName = profile?.fullName || profile?.username || "";
  const profileImage = mediaUrl(profile?.profile_picture);

  return (
    <div>
      <Seo
        title={`${profileName || "Profile"}${profile?.headline ? ` - ${stripHtml(profile.headline)}` : ""}`}
        description={
          stripHtml(profile?.biography) ||
          `${profileName} is a member of the Upskill learning community.`
        }
        image={profileImage}
        type="profile"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          mainEntity: {
            "@type": "Person",
            name: profileName,
            ...(profile?.headline
              ? { jobTitle: stripHtml(profile.headline) }
              : {}),
            ...(profile?.biography
              ? { description: truncate(profile.biography, 300) }
              : {}),
            ...(profileImage ? { image: profileImage } : {}),
            url: absoluteUrl(`/user/${profile?.username || safeSlug}`),
            sameAs: [
              profile?.link_website,
              profile?.link_linkedin,
              profile?.link_github,
              profile?.link_x,
              profile?.link_youtube,
            ].filter((link) => /^https?:\/\//i.test(String(link || ""))),
          },
        }}
      />
      <InstructorProfileBody
        profile={profile}
        biography={biographyContent}
        visibleBio={visibleBio}
        expanded={expanded}
        onToggle={() => setExpanded((prev) => !prev)}
        hasMore={paragraphsCount > 3}
      />
    </div>
  );
}
