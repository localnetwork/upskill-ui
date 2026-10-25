import { useCallback, useEffect, useState } from "react";
import { confirmModal } from "@/lib/services/confirm";
import Link from "next/link";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";
import persistentStore from "@/lib/store/persistentStore";

const API = process.env.NEXT_PUBLIC_API_URL;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
};

const formatMoney = (value, currency = "PHP") =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(
    Number(value || 0),
  );

const STATUS_STYLES = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  TRIALING: "bg-emerald-100 text-emerald-800",
  PAST_DUE: "bg-red-100 text-red-800",
  CANCELED: "bg-amber-100 text-amber-800",
  EXPIRED: "bg-slate-200 text-slate-700",
  PENDING: "bg-blue-100 text-blue-800",
};

const statusLabel = (status) =>
  String(status || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const isLearner = (profile) =>
  Array.isArray(profile?.roles) &&
  profile.roles.some((role) => {
    const value = typeof role === "string" ? role : role?.name || role?.role_name;
    return String(value || "").toUpperCase() === "LEARNER";
  });

const endLabel = (sub) => {
  if (sub.status === "EXPIRED") return "Ended";
  if (sub.status === "CANCELED" || sub.cancelAtPeriodEnd) return "Access ends";
  return "Renews on";
};

export default function MySubscriptions() {
  const router = useRouter();
  const profile = persistentStore((state) => state.profile);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);

  const allowed = isLearner(profile);

  const load = useCallback(async () => {
    try {
      const res = await BaseApi.get(`${API}/subscription/mine`);
      setSubscriptions(res?.data?.data || []);
    } catch {
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!profile) return;
    if (!allowed) {
      router.replace("/");
      return;
    }
    load();
  }, [profile, allowed, router, load]);

  const cancel = async (id) => {
    if (
      !(await confirmModal({
        title: "Cancel subscription",
        message:
          "Cancel your subscription? You keep access until the end of the paid period.",
        confirmText: "Cancel subscription",
        cancelText: "Keep it",
        variant: "danger",
      }))
    )
      return;
    setCancelingId(id);
    try {
      await BaseApi.post(`${API}/subscription/cancel`);
      toast.success("Subscription canceled.");
      await load();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to cancel.");
    } finally {
      setCancelingId(null);
    }
  };

  if (!allowed) return null;

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
        My Subscriptions
      </h1>

      {loading ? (
        <p className="mt-8 text-slate-500">Loading...</p>
      ) : subscriptions.length === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-slate-700">You have no subscriptions yet.</p>
          <Link
            href="/courses"
            className="mt-5 inline-block rounded-lg bg-primary px-5 py-3 font-bold text-white hover:brightness-110"
          >
            Browse courses
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">End date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.map((sub) => (
                <tr key={sub.id}>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900">{sub.planName}</p>
                    <p className="text-xs text-slate-500">
                      {formatMoney(sub.price, sub.currency)} /{" "}
                      {String(sub.interval).toLowerCase()}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        STATUS_STYLES[sub.status] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {statusLabel(sub.status)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {formatDate(sub.currentPeriodStart || sub.createdAt)}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    <span className="block text-xs text-slate-500">
                      {endLabel(sub)}
                    </span>
                    {formatDate(sub.currentPeriodEnd)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {sub.status === "ACTIVE" && !sub.cancelAtPeriodEnd && (
                      <button
                        type="button"
                        onClick={() => cancel(sub.id)}
                        disabled={cancelingId === sub.id}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {cancelingId === sub.id ? "Canceling..." : "Cancel"}
                      </button>
                    )}
                    {sub.status === "EXPIRED" && (
                      <Link
                        href="/courses"
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Resubscribe
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
