import persistentStore from "@/lib/store/persistentStore";
import UserAvatar from "../UserAvatar";
import { useRouter } from "next/router";
import Link from "next/link";
import Pencil from "@/components/icons/Pencil";
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
          </div>
          <div className="absolute flex flex-col items-center justify-center top-0 right-0 card test bg-white shadow-md min-w-[350px] p-[30px] rounded-lg min-h-[250px]">
            <UserAvatar
              className="w-[130px] h-[128px] text-[40px]"
              profile={profile}
            />

            {safeSlug === currentProfile?.username && (
              <div className="mt-[30px] w-full">
                <Link
                  href={"/profile"}
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
