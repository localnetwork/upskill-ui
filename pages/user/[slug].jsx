import UserProfileBanner from "@/components/entities/user/profiles/UserProfileBanner";
import BaseApi from "@/lib/api/_base.api";
import axios from "axios";
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

  return (
    <div>
      <UserProfileBanner profile={profile} />
    </div>
  );
}
