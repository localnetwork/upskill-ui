import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ProfileIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile/basic-information");
  }, [router]);

  return null;
}
