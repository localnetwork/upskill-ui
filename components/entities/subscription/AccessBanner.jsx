import { useEffect, useState } from "react";
import { confirmModal } from "@/lib/services/confirm";
import Link from "next/link";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AccessBanner() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    BaseApi.get(`${API}/subscription/me`)
      .then((res) => setSummary(res?.data?.data || null))
      .catch(() => setSummary(null));
  }, []);

  if (!summary) return null;
  const { trial, subscription } = summary;

  const cancel = async () => {
    const ok = await confirmModal({
      title: "Cancel subscription",
      message: "Cancel your subscription? You keep access until the end of the paid period.",
      confirmText: "Cancel subscription",
      cancelText: "Keep it",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await BaseApi.post(`${API}/subscription/cancel`);
      toast.success("Subscription canceled.");
      const res = await BaseApi.get(`${API}/subscription/me`);
      setSummary(res?.data?.data || null);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to cancel.");
    }
  };

  if (summary.hasSubscription && subscription) {
    const date = subscription.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
      : "-";
    return (
      <div className="mb-6 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <span>
          {subscription.planName} plan -{" "}
          {subscription.cancelAtPeriodEnd ? `ends ${date}` : `renews ${date}`}
        </span>
        {!subscription.cancelAtPeriodEnd && (
          <button type="button" onClick={cancel} className="font-bold underline">
            Cancel subscription
          </button>
        )}
      </div>
    );
  }

  if (trial.active) {
    return (
      <div className="mb-6 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        <span>
          Free trial: {trial.daysLeft} day{trial.daysLeft === 1 ? "" : "s"} left
          ({trial.coursesUsed}/{trial.coursesMax} courses used). Trial courses
          lock when it ends.
        </span>
        <Link href="/courses" className="font-bold underline">
          Browse courses
        </Link>
      </div>
    );
  }

  if (trial.used) {
    return (
      <div className="mb-6 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <span>
          Your free trial has ended. Subscribe or buy a course to keep learning.
        </span>
        <Link href="/courses" className="font-bold underline">
          Browse courses
        </Link>
      </div>
    );
  }

  return null;
}
