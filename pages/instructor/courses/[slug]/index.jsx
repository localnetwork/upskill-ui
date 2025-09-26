import { useRouter } from "next/router";
import { useEffect } from "react";

export default function CourseRedirect() {
  const router = useRouter();
  const { slug } = router.query;

  useEffect(() => {
    if (slug) {
      router.replace(`/instructor/courses/${slug}/curriculum`);
    }
  }, [slug, router]);

  return null;
}
