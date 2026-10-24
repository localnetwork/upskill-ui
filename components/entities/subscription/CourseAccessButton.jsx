import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";

const API = process.env.NEXT_PUBLIC_API_URL;

// Shows "Start with free trial" / "Start with plan" when the learner's access allows it.
export default function CourseAccessButton({ course, enabled }) {
  const router = useRouter();
  const [options, setOptions] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!enabled || !course?.id || course?.is_enrolled) return;
    BaseApi.get(`${API}/subscription/course/${course.id}/access`)
      .then((res) => setOptions(res?.data?.data || null))
      .catch(() => setOptions(null));
  }, [enabled, course?.id, course?.is_enrolled]);

  if (!options || course?.is_enrolled) return null;
  if (!options.canUseTrial && !options.canUseSubscription) return null;

  const label = options.canUseSubscription
    ? "Start with your plan"
    : `Start free trial (${options.summary?.trial?.daysLeft} days left)`;

  const handleClick = async () => {
    setBusy(true);
    try {
      await BaseApi.post(`${API}/subscription/course/${course.id}/access`);
      router.push(`/courses/${course.slug}/learn`);
    } catch (error) {
      toast.error(error?.data?.message || "Could not open this course.");
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="w-full rounded-xl border-2 border-primary py-3 font-bold text-primary transition-colors hover:bg-slate-50 disabled:opacity-60"
    >
      {busy ? "Opening..." : label}
    </button>
  );
}
