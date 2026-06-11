import { useEffect } from "react";
import ProfileNavTabs from "../entities/profile/ProfileNavtabs";

import { useRouter } from "next/router";
import persistentStore from "@/lib/store/persistentStore";
import { parseCookies } from "nookies";
import { getAuthTokenFromCookieMap } from "@/lib/services/authToken";
import BaseApi from "@/lib/api/_base.api";
export default function ProfileManagementLayout({ children }) {
  const router = useRouter();
  const profile = persistentStore((state) => state.profile);

  useEffect(() => {
    if (!router.isReady) return;

    let mounted = true;
    const ensureProfile = async () => {
      if (profile) return;

      const cookies = parseCookies();
      const token = getAuthTokenFromCookieMap(cookies);
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const meRes = await BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`);
        const me = meRes?.data?.data;
        if (!mounted || !me) return;
        persistentStore.setState({
          profile: {
            ...me,
            firstname: me.firstName || me.firstname || "",
            lastname: me.lastName || me.lastname || "",
          },
        });
      } catch (_error) {
        if (mounted) {
          router.replace("/login");
        }
      }
    };

    ensureProfile();
    return () => {
      mounted = false;
    };
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
