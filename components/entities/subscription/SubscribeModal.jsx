import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";

const API = process.env.NEXT_PUBLIC_API_URL;

function money(value, currency = "PHP") {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function SubscribeModal({ open, onClose, next = "/my-courses/learning" }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState("YEAR");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    setLoading(true);
    BaseApi.get(`${API}/subscription/plans`)
      .then((res) => setPlans(res?.data?.data || []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const monthly = plans.find((plan) => plan.interval === "MONTH");
  const yearly = plans.find((plan) => plan.interval === "YEAR");
  const selected = interval === "YEAR" ? yearly : monthly;

  // Savings of the first year versus paying the monthly price twelve times.
  const yearlyDiscount = useMemo(() => {
    if (!monthly || !yearly) return 0;
    const first = yearly.firstCyclePrice ?? yearly.price;
    const percent = Math.round((1 - first / (Number(monthly.price) * 12)) * 100);
    return percent > 0 ? percent : 0;
  }, [monthly, yearly]);

  useEffect(() => {
    if (!loading && !yearly && monthly) setInterval("MONTH");
  }, [loading, yearly, monthly]);

  if (!open) return null;

  const subscribe = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await BaseApi.post(`${API}/subscription/subscribe`, {
        planId: selected.id,
        next,
      });
      const url = res?.data?.data?.approveUrl;
      if (!url) throw new Error("No payment link returned");
      window.location.href = url;
    } catch (error) {
      toast.error(error?.data?.message || error?.message || "Could not start checkout.");
      setSubmitting(false);
    }
  };

  const firstPrice = selected ? (selected.firstCyclePrice ?? selected.price) : 0;
  const hasIntro = selected && selected.firstCyclePrice != null && selected.firstCyclePrice < selected.price;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Renew subscription"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Subscribe to keep learning</h2>
            <p className="mt-1 text-sm text-slate-500">
              Unlock every subscription course. Cancel any time.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">Loading plans...</p>
        ) : !monthly && !yearly ? (
          <p className="py-10 text-center text-sm text-slate-500">
            No subscription plans are available right now.
          </p>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 gap-1 rounded-full bg-slate-100 p-1">
              {[
                { key: "MONTH", label: "Monthly", plan: monthly },
                { key: "YEAR", label: "Yearly", plan: yearly },
              ].map(({ key, label, plan }) => (
                <button
                  key={key}
                  type="button"
                  disabled={!plan}
                  onClick={() => setInterval(key)}
                  className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-40 ${interval === key ? "bg-white text-[#0056d2] shadow-sm" : "text-slate-600"}`}
                >
                  {label}
                  {key === "YEAR" && yearlyDiscount > 0 && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      Save {yearlyDiscount}%
                    </span>
                  )}
                </button>
              ))}
            </div>

            {selected && (
              <div className="mt-5 rounded-xl border border-slate-200 p-5">
                <p className="text-sm font-semibold text-slate-500">{selected.name}</p>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">
                    {money(firstPrice, selected.currency)}
                  </span>
                  <span className="text-sm text-slate-500">
                    / {interval === "YEAR" ? "year" : "month"}
                  </span>
                  {hasIntro && (
                    <span className="text-sm text-slate-400 line-through">
                      {money(selected.price, selected.currency)}
                    </span>
                  )}
                </p>
                {hasIntro && (
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    First {interval === "YEAR" ? "year" : "month"} discount. Renews at{" "}
                    {money(selected.price, selected.currency)}.
                  </p>
                )}
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {["Access to all subscription courses", "Community and Q&A access", "Cancel any time"].map(
                    (item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600" />
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={subscribe}
              disabled={submitting || !selected || selected.available === false}
              className="mt-5 w-full rounded-full bg-[#0056d2] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting
                ? "Redirecting..."
                : selected?.available === false
                  ? "Payments unavailable"
                  : `Continue with ${interval === "YEAR" ? "yearly" : "monthly"}`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
