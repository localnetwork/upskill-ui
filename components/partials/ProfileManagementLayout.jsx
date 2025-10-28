import { useEffect } from "react";
import ProfileNavTabs from "../entities/profile/ProfileNavtabs";

import { useRouter } from "next/router";
import persistentStore from "@/lib/store/persistentStore";
export default function ProfileManagementLayout({ children }) {
  const router = useRouter();
  const profile = persistentStore((state) => state.profile);

  useEffect(() => {
    if (!router.isReady) return;
    if (!profile && router.isReady) {
      console.log("hello world");
      router.replace("/login");
    }
  }, [router, profile]);

  return (
    <div className=" p-[50px] mt-[50px]">
      <div className="shadow-box p-[50px]">
        <h1 className="text-3xl font-semibold">Profile & Settings</h1>

        {!profile ? (
          <div className="mt-[50px]">Loading...</div>
        ) : (
          <>
            <ProfileNavTabs />
            <div className="rounded-lg ">{children}</div>
          </>
        )}
      </div>
    </div>
  );
}
