import persistentStore from "@/lib/store/persistentStore";
import UserAvatar from "../UserAvatar";
import Link from "next/link";
import Pencil from "@/components/icons/Pencil";
import FriendActions from "./FriendActions";
import { getSocialLinks, roleLabel } from "./InstructorHero";
import { EditableText, ImagePickButton, useProfileEdit } from "./inlineEdit";


export default function UserProfileBanner({ profile }) {
  const currentProfile = persistentStore((state) => state.profile);
  const { canEdit, saveBasic, saveProfilePicture } = useProfileEdit();
  const isOwnProfile = Boolean(
    currentProfile?.id && profile?.id && currentProfile.id === profile.id,
  );
  const roleNames = (profile?.roles || []).map((role) =>
    roleLabel(role.role_name),
  );
  const socials = getSocialLinks(profile);

  return (
    <div className="bg-[#F0F6FF] px-4 pb-[30px] pt-[30px] sm:px-8 lg:px-[50px] lg:pb-[50px]">
      <div className="container relative">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 break-words lg:pr-[400px]">
            <div className="text-[13px] font-bold uppercase lg:text-[15px]">
              {roleNames.join(", ")}
            </div>
            <div className="mt-[5px] text-[26px] font-semibold sm:text-[30px] lg:text-[35px]">
              <EditableText
                as="span"
                canEdit={canEdit}
                value={profile?.fullName}
                maxLength={120}
                placeholder="Add your name"
                onSave={(fullName) => saveBasic({ fullName })}
              />
            </div>
            {(profile?.headline || canEdit) && (
              <div className="mt-[5px] text-[16px] font-semibold text-gray-600 lg:text-[18px]">
                <EditableText
                  as="span"
                  canEdit={canEdit}
                  value={profile?.headline}
                  maxLength={60}
                  placeholder="Add a headline"
                  onSave={(headline) => saveBasic({ headline })}
                />
              </div>
            )}
          </div>
          <div className="card relative mx-auto mt-6 flex min-h-[250px] w-full max-w-[400px] flex-col items-center justify-center rounded-lg bg-white p-5 shadow-md sm:p-[30px] lg:absolute lg:right-0 lg:top-0 lg:mx-0 lg:mt-0 lg:w-auto lg:min-w-[350px]">
            <div className="group/avatar relative">
              <UserAvatar
                className="h-[128px] w-[130px] text-[40px]"
                profile={profile}
              />
              {canEdit && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition group-hover/avatar:bg-black/40 group-hover/avatar:opacity-100">
                  <ImagePickButton
                    label="Change"
                    iconSize={14}
                    onPick={saveProfilePicture}
                  />
                </div>
              )}
            </div>

            {socials.length > 0 && (
              <div className="mt-[30px] flex flex-wrap justify-center gap-2">
                {socials.map(({ key, href, icon: Icon }) => (
                  <Link
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={key}
                    className="flex min-h-[50px] items-center justify-center rounded-md border px-[12px] py-[8px] text-[#0056D2] hover:bg-[#F0F6FF]"
                  >
                    <Icon size={23} />
                  </Link>
                ))}
              </div>
            )}

            {isOwnProfile && (
              <div className="mt-[30px] w-full">
                <Link
                  href="/profile/basic-information"
                  className="flex w-full items-center justify-center rounded-[10px] border border-[#3588FC] px-[30px] py-[10px] text-center font-bold text-[#3588FC] hover:bg-[#F0F6FF]"
                >
                  <Pencil className="mr-[5px] inline-block h-[30px] w-[30px]" />
                  Edit Profile
                </Link>
              </div>
            )}

            <FriendActions profile={profile} className="mt-[16px] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
