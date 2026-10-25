import { useCallback, useEffect, useState } from "react";
import { confirmModal } from "@/lib/services/confirm";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";
import { formatCurrency } from "@/components/entities/admin/AdminPayoutsManagement";

const API = process.env.NEXT_PUBLIC_API_URL;
const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function TrialFunnel() {
  const [funnel, setFunnel] = useState(null);
  useEffect(() => {
    BaseApi.get(`${API}/subscription/admin/trial-funnel`)
      .then((res) => setFunnel(res?.data?.data || null))
      .catch(() => setFunnel(null));
  }, []);
  if (!funnel) return null;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      <StatCard label="Trials started" value={funnel.started} />
      <StatCard label="Active now" value={funnel.activeNow} />
      <StatCard label="Opened a course" value={funnel.accessedCourse} />
      <StatCard label="Converted" value={funnel.converted} />
      <StatCard label="Conversion rate" value={`${funnel.conversionRate}%`} />
    </div>
  );
}

function ExtendTrial() {
  const [identifier, setIdentifier] = useState("");
  const [days, setDays] = useState(3);
  const [busy, setBusy] = useState(false);

  const extend = async () => {
    if (!identifier.trim()) {
      toast.error("Enter the learner's email or user ID.");
      return;
    }
    setBusy(true);
    try {
      await BaseApi.post(
        `${API}/subscription/admin/trial/${encodeURIComponent(identifier.trim())}/extend`,
        { days: Number(days) },
      );
      toast.success("Trial extended.");
      setIdentifier("");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to extend trial.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-900">Extend a learner trial</h3>
      <p className="mb-4 text-sm text-slate-500">Goodwill extension for support cases (1-30 days).</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <label className={labelClass}>Learner email or user ID</label>
          <input className={inputClass} value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Days</label>
          <input type="number" min="1" max="30" className={inputClass} value={days} onChange={(e) => setDays(e.target.value)} />
        </div>
        <div className="flex items-end">
          <button type="button" onClick={extend} disabled={busy} className="rounded-full bg-[#0056d2] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {busy ? "Extending..." : "Extend trial"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlansSection({ canManage }) {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ name: "", interval: "MONTH", price: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await BaseApi.get(`${API}/subscription/admin/plans`);
      setPlans(res?.data?.data || []);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load plans.");
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    const price = Number(form.price);
    if (!form.name.trim() || !(price > 0)) {
      toast.error("Enter a plan name and a price.");
      return;
    }
    setSaving(true);
    try {
      await BaseApi.post(`${API}/subscription/admin/plans`, {
        name: form.name.trim(),
        interval: form.interval,
        price,
      });
      toast.success("Plan created.");
      setForm({ name: "", interval: "MONTH", price: "" });
      await load();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create plan.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (plan) => {
    try {
      await BaseApi.patch(`${API}/subscription/admin/plans/${plan.id}`, {
        isActive: !plan.isActive,
      });
      await load();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update plan.");
    }
  };

  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-900">Subscription plans</h3>
      <p className="mb-4 text-sm text-slate-500">
        Plans are created in PayPal when credentials are configured. Prices cannot be edited after creation.
      </p>
      {canManage && (
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className={labelClass}>Name</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Upskill Plus Monthly"
            />
          </div>
          <div>
            <label className={labelClass}>Billing</label>
            <select
              className={inputClass}
              value={form.interval}
              onChange={(e) => setForm((p) => ({ ...p, interval: e.target.value }))}
            >
              <option value="MONTH">Monthly</option>
              <option value="YEAR">Yearly</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Price (PHP)</label>
            <input
              type="number"
              min="1"
              className={inputClass}
              value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={create}
              disabled={saving}
              className="rounded-full bg-[#0056d2] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create plan"}
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">Plan</th>
              <th>Billing</th>
              <th>Price</th>
              <th>PayPal</th>
              <th>Subscribers</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className="border-t border-slate-100">
                <td className="py-2 font-medium text-slate-900">{plan.name}</td>
                <td>{plan.interval === "YEAR" ? "Yearly" : "Monthly"}</td>
                <td>{formatCurrency(plan.price)}</td>
                <td>{plan.paypalPlanId ? "Linked" : "Not linked"}</td>
                <td>{plan._count?.subscriptions || 0}</td>
                <td>{plan.isActive ? "Active" : "Hidden"}</td>
                <td className="text-right">
                  {canManage && (
                    <button type="button" onClick={() => toggle(plan)} className="text-sm font-semibold text-[#0056d2]">
                      {plan.isActive ? "Hide" : "Show"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-slate-500">
                  No plans yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CyclesSection() {
  const [cycles, setCycles] = useState([]);
  const [month, setMonth] = useState("");
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await BaseApi.get(`${API}/earnings/admin/cycles?limit=24`);
      setCycles(res?.data?.data || []);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load earnings cycles.");
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const run = async (action, targetMonth) => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(targetMonth)) {
      toast.error("Use the YYYY-MM format.");
      return;
    }
    if (
      action === "publish" &&
      !(await confirmModal({
        title: "Publish earnings",
        message: `Publish ${targetMonth}? Educators will be able to withdraw these earnings.`,
        confirmText: "Publish",
      }))
    ) {
      return;
    }
    setBusy(true);
    try {
      await BaseApi.post(`${API}/earnings/admin/cycles/${targetMonth}/${action}`, {});
      toast.success(action === "publish" ? "Cycle published." : "Cycle calculated.");
      await load();
      if (detail?.cycle?.month === targetMonth) await open(targetMonth);
    } catch (error) {
      toast.error(error?.data?.message || `Failed to ${action} cycle.`);
    } finally {
      setBusy(false);
    }
  };

  const open = async (targetMonth) => {
    try {
      const res = await BaseApi.get(`${API}/earnings/admin/cycles/${targetMonth}`);
      setDetail(res?.data?.data || null);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load cycle.");
    }
  };

  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-900">Educator earnings cycles</h3>
      <p className="mb-4 text-sm text-slate-500">
        Last month is calculated automatically. Review the split, then publish it so educators can withdraw.
      </p>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className={labelClass}>Month</label>
          <input className={inputClass} placeholder="2026-09" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => run("calculate", month.trim())}
          className="rounded-full border border-[#0056d2] px-5 py-2 text-sm font-semibold text-[#0056d2] disabled:opacity-60"
        >
          Calculate
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2">Month</th>
              <th>Status</th>
              <th>Net revenue</th>
              <th>Pool</th>
              <th>Watch hours</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {cycles.map((cycle) => (
              <tr key={cycle.id} className="border-t border-slate-100">
                <td className="py-2 font-medium text-slate-900">{cycle.month}</td>
                <td>{cycle.status}</td>
                <td>{formatCurrency(cycle.netRevenue)}</td>
                <td>
                  {formatCurrency(cycle.poolAmount)} ({Number(cycle.poolPercent)}%)
                </td>
                <td>{(cycle.totalSeconds / 3600).toFixed(1)}</td>
                <td className="space-x-3 text-right">
                  <button type="button" onClick={() => open(cycle.month)} className="text-sm font-semibold text-[#0056d2]">
                    View
                  </button>
                  {cycle.status === "CALCULATED" && (
                    <button type="button" disabled={busy} onClick={() => run("publish", cycle.month)} className="text-sm font-semibold text-emerald-700">
                      Publish
                    </button>
                  )}
                  {cycle.status === "CALCULATED" && (
                    <button type="button" disabled={busy} onClick={() => run("calculate", cycle.month)} className="text-sm font-semibold text-slate-600">
                      Recalculate
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {cycles.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-slate-500">
                  No cycles yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="mt-5 rounded-md border border-slate-200 p-4">
          <h4 className="mb-2 font-semibold text-slate-900">
            {detail.cycle.month} split ({detail.cycle.status})
          </h4>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-1">Educator</th>
                <th>Type</th>
                <th>Minutes</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {detail.earnings.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="py-1">{row.educator?.username || row.educatorId}</td>
                  <td>{row.type === "SUBSCRIPTION_POOL" ? "Pool share" : "Trial bonus"}</td>
                  <td>{Math.round(row.seconds / 60)}</td>
                  <td>{formatCurrency(row.amount)}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
              {detail.earnings.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-3 text-center text-slate-500">
                    No educator earnings in this cycle.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function EmployeeSubscriptionsPanel({ canManageEarnings, canViewTrial, canManageTrial }) {
  return (
    <div className="space-y-6">
      {canViewTrial && <TrialFunnel />}
      {canManageTrial && <ExtendTrial />}
      {canManageEarnings && (
        <>
          <PlansSection canManage />
          <CyclesSection />
        </>
      )}
    </div>
  );
}
