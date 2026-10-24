import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";
import { formatCurrency } from "@/components/entities/admin/AdminPayoutsManagement";

const API = process.env.NEXT_PUBLIC_API_URL;

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-2xl font-bold text-[#0056d2]">{value}</p>
    </div>
  );
}

function ActivityReport() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await BaseApi.get(`${API}/admin/reports/activity?days=${days}`);
      setReport(res?.data?.data || null);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load activity report.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const overview = report?.overview || {};
  const events = report?.events || {};

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Platform activity</h3>
        <select
          value={days}
          onChange={(event) => setDays(Number(event.target.value))}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
        >
          {[7, 30, 90, 365].map((value) => (
            <option key={value} value={value}>
              Last {value} days
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <p className="text-sm text-slate-500">Loading activity report...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Course impressions" value={Number(overview.total_impressions || 0)} />
          <StatCard label="Course page views" value={Number(overview.total_page_views || 0)} />
          <StatCard
            label="Unique impression visitors"
            value={Number(overview.unique_impression_visitors || 0)}
          />
          <StatCard
            label="Unique page view visitors"
            value={Number(overview.unique_page_view_visitors || 0)}
          />
          <StatCard label="Auth events" value={Number(events.auth_events || 0)} />
          <StatCard label="Learning events" value={Number(events.learning_events || 0)} />
          <StatCard label="Commerce events" value={Number(events.commerce_events || 0)} />
        </div>
      )}
    </section>
  );
}

function RevenueReport() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    BaseApi.get(`${API}/admin/reports/revenue`)
      .then((res) => active && setReport(res?.data?.data || null))
      .catch((error) =>
        toast.error(error?.data?.message || "Failed to load revenue report."),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const totals = report?.totals || {};

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Revenue</h3>
      {loading ? (
        <p className="text-sm text-slate-500">Loading revenue report...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Total orders" value={Number(report?.orders || 0)} />
          <StatCard label="Paid orders" value={Number(report?.paidOrders || 0)} />
          <StatCard label="Gross sales" value={formatCurrency(totals.totalAmount)} />
          <StatCard label="Subtotal" value={formatCurrency(totals.subtotalAmount)} />
          <StatCard label="Discounts" value={formatCurrency(totals.discountAmount)} />
          <StatCard label="Tax" value={formatCurrency(totals.taxAmount)} />
          <StatCard label="Platform fees" value={formatCurrency(totals.platformFeeAmount)} />
          <StatCard label="Educator earnings" value={formatCurrency(totals.educatorEarnings)} />
        </div>
      )}
    </section>
  );
}

export default function EmployeeReports({ canViewActivity, canViewRevenue }) {
  return (
    <div className="space-y-8">
      {canViewActivity && <ActivityReport />}
      {canViewRevenue && <RevenueReport />}
    </div>
  );
}
