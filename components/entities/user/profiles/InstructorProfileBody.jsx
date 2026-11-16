import { ChevronDown } from "lucide-react";
import { mediaUrl } from "@/lib/seo";
import InstructorHero, { getSocialLinks } from "./InstructorHero";
import UserProfileInstructorCourses from "./UserProfileInstructorCourses";
import { StorefrontCtas, StorefrontReviews } from "./UserProfileStorefront";
import { EditableRichText, useProfileEdit } from "./inlineEdit";

export default function InstructorProfileBody({
  profile,
  biography,
  visibleBio,
  expanded,
  onToggle,
  hasMore,
}) {
  const storefront = profile?.storefront;
  const { canEdit, saveBasic } = useProfileEdit();
  const firstName = String(profile?.fullName || profile?.username || "")
    .trim()
    .split(/\s+/)[0];
  const socials = getSocialLinks(profile);
  const picture = mediaUrl(profile?.profile_picture);

  return (
    <div>
      <InstructorHero profile={profile} />

      {((storefront?.ctas || []).length > 0 || canEdit) && (
        <div className="container mt-[50px] px-4 sm:px-8">
          <StorefrontCtas storefront={storefront} />
        </div>
      )}

      <UserProfileInstructorCourses profile={profile} />

      <div className="container px-4 py-[60px] sm:px-8">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
          <div className="min-w-0">
            <h2 className="text-[28px] font-bold text-[#2a2b3f] lg:text-[36px]">
              Hi, I&apos;m {profile?.fullName || firstName}
            </h2>
            {socials.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {socials.map(({ key, href, icon: Icon }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={key}
                    className="flex h-9 w-9 items-center justify-center rounded-md border text-[#0056D2] hover:bg-[#F0F6FF]"
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            )}
            {canEdit ? (
              <EditableRichText
                canEdit
                value={biography}
                onSave={(next) => saveBasic({ biography: next })}
                className="mt-5 break-words text-[16px] text-gray-800 lg:text-[18px]"
                placeholder="Click to add your biography"
              />
            ) : biography ? (
              <>
                <div
                  className="mt-5 break-words text-[16px] text-gray-800 lg:text-[18px]"
                  dangerouslySetInnerHTML={{
                    __html: expanded ? biography : visibleBio,
                  }}
                />
                {hasMore && (
                  <button
                    type="button"
                    onClick={onToggle}
                    className="mt-3 flex items-center gap-1 font-medium text-[#0056D2]"
                  >
                    {expanded ? "Show less" : "Show more"}
                    <ChevronDown
                      className={expanded ? "rotate-180" : ""}
                      size={16}
                    />
                  </button>
                )}
              </>
            ) : (
              <p className="mt-5 italic text-gray-500">
                No biography available.
              </p>
            )}
          </div>
          {picture && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={picture}
              alt={profile?.fullName || "Instructor"}
              className="aspect-video w-full rounded-2xl object-cover"
            />
          )}
        </div>

        <StorefrontReviews
          storefront={storefront}
          reviews={profile?.educator_reviews}
        />
      </div>
    </div>
  );
}
