import persistentStore from "@/lib/store/persistentStore";
import UserAvatar from "../UserAvatar";
import { useRouter } from "next/router";
import Link from "next/link";
import Pencil from "@/components/icons/Pencil";
import {
  Facebook,
  Github,
  Instagram,
  Link2,
  Linkedin,
  Twitter,
  X,
  Youtube,
} from "lucide-react";
import Tiktok from "@/components/icons/Tiktok";
export default function UserProfileBanner({ profile }) {
  const currentProfile = persistentStore((state) => state.profile);
  const router = useRouter();
  const { slug } = router.query;
  const safeSlug = typeof slug === "string" ? slug.replace(/ /g, "-") : "";

  const extractedRoleNames =
    profile?.roles || [] ? profile?.roles.map((role) => role.role_name) : [];

  return (
    <div className="bg-[#F0F6FF] px-[50px] pt-[30px] pb-[50px]">
      <div className="container relative">
        <div className="flex justify-between items-center">
          <div>
            <div className="roles uppercase font-bold text-[15px]">
              {extractedRoleNames?.join(", ")}
            </div>
            <div className="name text-[35px] mt-[5px] font-semibold">
              {profile?.firstname} {profile?.lastname}
            </div>
            {profile?.headline && (
              <div className="headline text-[18px] font-semibold mt-[5px] text-gray-600">
                {profile?.headline}
              </div>
            )}
          </div>
          <div className="absolute flex flex-col items-center justify-center top-0 right-0 card test bg-white shadow-md max-w-[450px] min-w-[350px] p-[30px] rounded-lg min-h-[250px]">
            <UserAvatar
              className="w-[130px] h-[128px] text-[40px]"
              profile={profile}
            />

            <div className="flex mt-[30px] justify-center flex-wrap">
              {profile?.link_website && (
                <div className="social-item px-[5px]">
                  <Link
                    href={profile.link_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0056D2] hover:bg-[#F0F6FF] border px-[12px] min-h-[50px]  flex items-center justify-center py-[8px] rounded-md hover:underline mb-2"
                  >
                    <Link2 className="inline-block" size={23} />
                  </Link>
                </div>
              )}
              {profile?.link_x && (
                <div className="social-item px-[5px]">
                  <Link
                    href={`https://www.x.com/` + profile.link_x}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0056D2] hover:bg-[#F0F6FF] border px-[12px] min-h-[50px]  flex items-center justify-center py-[8px] rounded-md hover:underline mb-2"
                  >
                    <Twitter className="inline-block" size={23} />
                  </Link>
                </div>
              )}
              {profile?.link_linkedin && (
                <div className="social-item px-[5px]">
                  <Link
                    href={
                      `https://www.linkedin.com/in/` + profile.link_linkedin
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0056D2] hover:bg-[#F0F6FF] border px-[12px] min-h-[50px]  flex items-center justify-center py-[8px] rounded-md hover:underline mb-2"
                  >
                    <Linkedin className="inline-block" size={23} />
                  </Link>
                </div>
              )}
              {profile?.link_instagram && (
                <div className="social-item px-[5px]">
                  <Link
                    href={`https://www.instagram.com/` + profile.link_instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0056D2] hover:bg-[#F0F6FF] border px-[12px] min-h-[50px]  flex items-center justify-center py-[8px] rounded-md hover:underline mb-2"
                  >
                    <Instagram className="inline-block" size={23} />
                  </Link>
                </div>
              )}
              {profile?.link_facebook && (
                <div className="social-item px-[5px]">
                  <Link
                    href={`https://www.facebook.com/` + profile.link_facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0056D2] hover:bg-[#F0F6FF] border px-[12px] min-h-[50px]  flex items-center justify-center py-[8px] rounded-md hover:underline mb-2"
                  >
                    <Facebook className="inline-block" size={23} />
                  </Link>
                </div>
              )}
              {profile?.link_tiktok && (
                <div className="social-item px-[5px]">
                  <Link
                    href={`https://www.tiktok.com/@` + profile.link_tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0056D2] hover:bg-[#F0F6FF] border px-[12px] min-h-[50px]  flex items-center justify-center py-[8px] rounded-md hover:underline mb-2"
                  >
                    <Tiktok />
                  </Link>
                </div>
              )}
              {profile?.link_youtube && (
                <div className="social-item px-[5px]">
                  <Link
                    href={`https://www.youtube.com/@` + profile.link_youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0056D2] hover:bg-[#F0F6FF] border px-[12px] min-h-[50px]  flex items-center justify-center py-[8px] rounded-md hover:underline mb-2"
                  >
                    <Youtube className="inline-block" size={23} />
                  </Link>
                </div>
              )}
              {profile?.link_github && (
                <div className="social-item px-[5px]">
                  <Link
                    href={`https://www.github.com/` + profile.link_github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0056D2] hover:bg-[#F0F6FF] border px-[12px] min-h-[50px]  flex items-center justify-center py-[8px] rounded-md hover:underline mb-2"
                  >
                    <Github className="inline-block" size={23} />
                  </Link>
                </div>
              )}
            </div>

            {safeSlug === currentProfile?.username && (
              <div className="mt-[30px] w-full">
                <Link
                  href={"/profile/basic-information"}
                  className="py-[10px] border-[#3588FC] hover:bg-[#F0F6FF] font-bold text-[#3588FC] flex items-center justify-center px-[30px] text-center border w-full rounded-[10px]"
                >
                  <Pencil className="w-[30px] h-[30px] inline-block mr-[5px]" />
                  Edit Profile
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
