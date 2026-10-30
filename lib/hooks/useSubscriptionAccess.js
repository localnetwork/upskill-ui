import { useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";
import persistentStore from "@/lib/store/persistentStore";

const API = process.env.NEXT_PUBLIC_API_URL;
const fetcher = (url) => BaseApi.get(url).then((res) => res?.data?.data || null);

// Lets subscribers open a subscription-eligible course directly instead of buying it.
export default function useSubscriptionAccess(course, isEnrolled) {
  const router = useRouter();
  const profile = persistentStore((state) => state.profile);
  const [starting, setStarting] = useState(false);

  const learner = Boolean(profile?.permissions?.includes("view-own-learnings"));
  const { data: me, isLoading: meLoading } = useSWR(learner ? `${API}/subscription/me` : null, fetcher, {
    revalidateOnFocus: false,
  });
  const hasSubscription = Boolean(me?.hasSubscription);
  const trialActive = Boolean(me?.trial?.active);

  const { data: access, isLoading: accessFetching } = useSWR(
    (hasSubscription || trialActive) && course?.id && !isEnrolled
      ? `${API}/subscription/course/${course.id}/access`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );
  const canStartWithPlan = Boolean(access?.canUseSubscription);
  // Active free trial on a trial-pool course: enroll directly, no purchase options.
  const canStartWithTrial = !canStartWithPlan && Boolean(access?.canUseTrial);

  const startWithPlan = async () => {
    setStarting(true);
    try {
      await BaseApi.post(`${API}/subscription/course/${course.id}/access`);
      router.push(`/courses/${course.slug}/learn`);
    } catch (error) {
      toast.error(error?.data?.message || "Could not open this course.");
      setStarting(false);
    }
  };

  return {
    accessLoading: Boolean(meLoading || accessFetching),
    hasSubscription, canStartWithPlan, canStartWithTrial, startWithPlan, starting };
}
