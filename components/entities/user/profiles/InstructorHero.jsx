import Link from "next/link";
import {
  Facebook,
  Github,
  Instagram,
  Link2,
  Linkedin,
  Plus,
  Star,
  Twitter,
  X,
  Youtube,
} from "lucide-react";
import persistentStore from "@/lib/store/persistentStore";
import Tiktok from "@/components/icons/Tiktok";
import FriendActions from "./FriendActions";
import UserAvatar from "../UserAvatar";
import {
  EditableText,
  ImagePickButton,
  useProfileEdit,
  useSkillActions,
} from "./inlineEdit";
import { mediaUrl } from "@/lib/seo";
import { getSkillIcon, normalizeSkill } from "@/lib/skillIcons";

function formatCount(value) {
  const n = Number(value || 0);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function roleLabel(roleName) {
  return String(roleName || "")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getSocialLinks(profile) {
  return [
    { key: "website", href: profile?.link_website, icon: Link2 },
    {
      key: "x",
      href: profile?.link_x && `https://www.x.com/${profile.link_x}`,
      icon: Twitter,
    },
    {
      key: "linkedin",
      href:
        profile?.link_linkedin &&
        `https://www.linkedin.com/in/${profile.link_linkedin}`,
      icon: Linkedin,
    },
    {
      key: "instagram",
      href:
        profile?.link_instagram &&
        `https://www.instagram.com/${profile.link_instagram}`,
      icon: Instagram,
    },
    {
      key: "facebook",
      href:
        profile?.link_facebook &&
        `https://www.facebook.com/${profile.link_facebook}`,
      icon: Facebook,
    },
    {
      key: "youtube",
      href:
        profile?.link_youtube &&
        `https://www.youtube.com/@${profile.link_youtube}`,
      icon: Youtube,
    },
    {
      key: "github",
      href:
        profile?.link_github && `https://www.github.com/${profile.link_github}`,
      icon: Github,
    },
    {
      key: "tiktok",
      href: profile?.link_tiktok && `https://www.tiktok.com/@${profile.link_tiktok}`,
      icon: Tiktok,
    },
  ].filter((item) => item.href);
}

export default function InstructorHero({ profile }) {
  const currentProfile = persistentStore((state) => state.profile);
  const { canEdit, saveBasic, saveProfilePicture, saveBanner } = useProfileEdit();
  const skillActions = useSkillActions();
  const storefront = profile?.storefront || {};
  const stats = profile?.stats?.educator || {};
  const learnerStats = profile?.stats?.learner || {};
  const roleNames = (profile?.roles || []).map((role) => role.role_name);
  const isEducator = roleNames.includes("Instructor");
  const isLearner = roleNames.includes("Learner");
  const staffRoles = roleNames.filter(
    (name) => name !== "Instructor" && name !== "Learner",
  );
  const skills = (storefront.skills || []).map(normalizeSkill);
  const picture = mediaUrl(profile?.profile_picture);
  const isOwnProfile = currentProfile?.id && currentProfile.id === profile?.id;
  const hasBanner = Boolean(storefront.banner_url);
  const showSkills = skills.length > 0 || canEdit;

  return (
    <div className="relative">
      <div
        className="relative overflow-hidden bg-gradient-to-br from-[#0b2a8a] via-[#1d4ed8] to-[#3b82f6] bg-cover bg-center text-white"
        style={
          hasBanner ? { backgroundImage: `url(${storefront.banner_url})` } : {}
        }
      >
        {hasBanner && <div className="absolute inset-0 bg-black/35" />}
        <div
          className={`container relative flex min-h-[260px] items-end justify-between gap-6 px-4 pt-10 sm:px-8 lg:min-h-[320px] ${showSkills ? "pb-[90px]" : "pb-10"}`}
        >
          <div className="min-w-0 max-w-[640px] break-words">
            <div className="flex flex-wrap items-center gap-2 text-[14px] font-semibold">
              {isEducator ? (
                <>
                  <span>{formatCount(stats.total_learners)} Learners</span>
                  <span className="flex items-center gap-1">
                    <Star
                      size={14}
                      fill="currentColor"
                      className="text-amber-300"
                    />
                    {Number(stats.average_rating || 0).toFixed(1)}
                  </span>
                  <span className="underline">
                    {formatCount(stats.total_reviews)} ratings
                  </span>
                </>
              ) : isLearner ? (
                <>
                  <span>
                    {formatCount(learnerStats.completed_courses_count)}{" "}
                    Completed courses
                  </span>
                  <span>
                    {formatCount(learnerStats.certifications_count)}{" "}
                    Certifications
                  </span>
                </>
              ) : (
                <span className="uppercase">
                  {staffRoles.map(roleLabel).join(", ")}
                </span>
              )}
            </div>
            <h1 className="mt-2 text-[32px] font-bold leading-tight sm:text-[44px] lg:text-[52px]">
              <EditableText
                canEdit={canEdit}
                value={profile?.fullName}
                maxLength={120}
                placeholder="Add your name"
                onSave={(fullName) => saveBasic({ fullName })}
              />
            </h1>
            {(profile?.headline || canEdit) && (
              <p className="mt-2 text-[16px] text-white/90 lg:text-[18px]">
                <EditableText
                  canEdit={canEdit}
                  value={profile?.headline}
                  maxLength={60}
                  placeholder="Add a headline"
                  onSave={(headline) => saveBasic({ headline })}
                />
              </p>
            )}
            {isOwnProfile && (
              <Link
                href="/profile/basic-information"
                className="mt-5 inline-block rounded-md bg-white px-5 py-2.5 font-bold text-[#0b2a8a] hover:bg-gray-100"
              >
                Edit Profile
              </Link>
            )}
            <FriendActions
              profile={profile}
              className="mt-5 max-w-[260px] rounded-[12px] bg-white p-2 empty:hidden"
            />
          </div>
          <div className="group/avatar relative hidden shrink-0 sm:block">
            {picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={picture}
                alt={profile?.fullName || "Instructor"}
                className="h-[200px] w-[200px] rounded-full border-4 border-white/80 object-cover lg:h-[260px] lg:w-[260px]"
              />
            ) : (
              <UserAvatar
                className="h-[200px] w-[200px] text-[60px]"
                profile={profile}
              />
            )}
            {canEdit && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition group-hover/avatar:bg-black/40 group-hover/avatar:opacity-100">
                <ImagePickButton
                  label="Change photo"
                  onPick={saveProfilePicture}
                />
              </div>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="absolute right-4 top-4 z-10">
            <ImagePickButton label="Change cover" onPick={saveBanner} />
          </div>
        )}
      </div>

      {showSkills && (
        <div className="container relative z-10 -mt-[60px] px-4 sm:px-8">
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl flex flex-col items-center gap-4 sm:gap-6 max-w-[70.375rem] mx-auto py-5 px-4 sm:py-6 sm:px-10 shadow-[0_14px_17px_#2f38491a]">
            <div className="mb-1 sm:mb-3 text-center text-[18px] sm:text-[20px] font-semibold text-[#2a2b3f]">
              {isEducator ? "Skills I teach" : "Skills"}
            </div>
            <div className="grid w-full grid-cols-2 justify-between gap-x-4 gap-y-5 self-stretch sm:flex sm:flex-wrap sm:gap-6 sm:[&>*]:flex-1 m-0 p-0 list-none">
              {skills.map((skill, index) => {
                const Icon = getSkillIcon(skill.icon);
                return (
                  <div
                    key={`${skill.label}-${index}`}
                    className="group relative flex min-w-0 flex-col items-center break-words text-[15px] sm:text-[clamp(1.0625rem,0.0925926vi+1.04167rem,1.125rem)] font-light text-[var(--applied-text-default)] text-center leading-[1.5]"
                  >
                    {canEdit ? (
                      <button
                        type="button"
                        title="Change icon"
                        aria-label="Change icon"
                        onClick={() => skillActions.edit(index)}
                        className="rounded p-1 text-gray-700 hover:bg-blue-50"
                      >
                        {Icon ? <Icon size={30} /> : <Plus size={22} />}
                      </button>
                    ) : (
                      Icon && <Icon size={22} className="text-gray-700" />
                    )}
                    <EditableText
                      canEdit={canEdit}
                      value={skill.label}
                      maxLength={40}
                      onSave={(label) => skillActions.rename(index, label)}
                    />
                    {canEdit && (
                      <button
                        type="button"
                        aria-label="Remove skill"
                        onClick={() => skillActions.remove(index)}
                        className="absolute -right-1 -top-1 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {canEdit && skillActions.canAdd && (
              <button
                type="button"
                onClick={skillActions.add}
                className="mx-auto mt-4 flex items-center gap-1 text-[14px] font-semibold text-[#0056D2]"
              >
                <Plus size={14} /> Add skill
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
