import { useEffect, useState } from "react";
import BaseApi from "@/lib/api/_base.api";

export default function useHasNoCourses() {
  const [hasNoCourses, setHasNoCourses] = useState(false);

  useEffect(() => {
    let cancelled = false;
    BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/courses/authored?title=&page=1`)
      .then((res) => {
        const rows = res?.data?.data;
        if (!cancelled && Array.isArray(rows) && rows.length === 0) {
          setHasNoCourses(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return [hasNoCourses, setHasNoCourses];
}
