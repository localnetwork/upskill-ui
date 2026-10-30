import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";

const API = process.env.NEXT_PUBLIC_API_URL;

const money = (value) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Number(value || 0),
  );

export default function SubscriptionEarningsSection() {
  const [data, setData] = useState(null);

  useEffect(() => {
    BaseApi.get(`${API}/earnings/my`)
      .then((res) => setData(res?.data?.data || null))
      .catch(() => setData(null));
  }, []);

  if (!data) return null;
  const { totals, currentMonth, recent } = data;

  const cards = [
    ["Subscription pool earnings", money(totals.subscriptionPool)],
    ["Pending (cycle not published)", money(totals.pending)],
    ["Watch time this month", `${currentMonth.watchMinutes} min`],
  ];

  return (
    <section className="rounded-lg border border-[#e2e8f0] bg-white p-6 sm:p-8">
      <h2 className="text-xl font-bold text-on-surface">Subscription earnings</h2>
      <p className="mt-1 text-sm text-on-surface-variant">
        Earned from subscribers&apos;         watch time on your opted-in courses. Available amounts are
        included in your available balance and paid out with your regular payout
        requests.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[#e2e8f0] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {recent.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Month</th>
                <th>Type</th>
                <th>Course</th>
                <th>Minutes</th>
                <th>Status</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="py-2">{row.month || "-"}</td>
                  <td>
                    {row.type === "SUBSCRIPTION_POOL" ? "Pool share" : "Trial bonus"}
                  </td>
                  <td>{row.courseTitle || "-"}</td>
                  <td>{row.minutes || "-"}</td>
                  <td>{row.status}</td>
                  <td className="text-right font-semibold">{money(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function CourseProgramOptIn({ courseId }) {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    BaseApi.get(`${API}/earnings/my`)
      .then((res) => {
        const match = (res?.data?.data?.optedCourses || []).find(
          (course) => course.id === courseId,
        );
        setState({
          trialEligible: Boolean(match?.trialEligible),
          subscriptionEligible: Boolean(match?.subscriptionEligible),
        });
      })
      .catch(() => setState({ trialEligible: false, subscriptionEligible: false }));
  }, [courseId]);

  const toggle = async (key) => {
    setBusy(true);
    try {
      await BaseApi.patch(`${API}/earnings/courses/${courseId}/programs`, {
        [key]: !state[key],
      });
      setState((prev) => ({ ...prev, [key]: !prev[key] }));
      toast.success("Program settings saved");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update program settings");
    } finally {
      setBusy(false);
    }
  };

  if (!state) return null;

  return (
    <div className="mt-10 max-w-[560px] rounded-lg border border-[#e2e8f0] p-5">
      <p className="font-semibold">Subscription programs</p>
      <p className="mb-4 text-sm text-slate-600">
        Opt in to earn from subscribers&apos; watch time and trial conversions.
        Your course stays available for individual purchase either way.
      </p>
      <label className="mb-3 flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          disabled={busy}
          checked={state.subscriptionEligible}
          onChange={() => toggle("subscriptionEligible")}
          className="mt-1"
        />
        <span>
          <strong>Subscription catalog</strong> - included for subscribers; you
          earn a share of the monthly pool by minutes watched.
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          disabled={busy}
          checked={state.trialEligible}
          onChange={() => toggle("trialEligible")}
          className="mt-1"
        />
        <span>
          <strong>Free trial pool</strong> - new learners can sample it during
          their trial; you get a bonus if they buy it afterwards.
        </span>
      </label>
    </div>
  );
}
