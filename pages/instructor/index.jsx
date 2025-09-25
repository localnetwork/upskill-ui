import { useEffect } from "react";
import { useRouter } from "next/router";

export default function InstructorIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/instructor/courses");
  }, [router]);

  return null;
}
