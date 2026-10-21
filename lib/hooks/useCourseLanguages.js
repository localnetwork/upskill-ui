import { useEffect, useState } from "react";
import BaseApi from "@/lib/api/_base.api";

const FALLBACK = [{ value: "English", label: "English" }];

// Loads the same language list used by the course basics form.
export default function useCourseLanguages() {
  const [languages, setLanguages] = useState(FALLBACK);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/languages`,
        );
        const rows = Array.isArray(response?.data?.data)
          ? response.data.data
          : [];
        const seen = new Set();
        const options = [];
        for (const item of rows) {
          const value = String(item?.value || item?.label || "").trim();
          const label = String(item?.label || item?.value || "").trim();
          if (!value || seen.has(value)) continue;
          seen.add(value);
          options.push({ value, label });
        }
        if (cancelled || !options.length) return;
        options.sort((a, b) => a.label.localeCompare(b.label));
        setLanguages(options);
      } catch (_error) {
        // keep fallback
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return languages;
}
