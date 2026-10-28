import { useEffect, useMemo, useState } from "react";
import BaseApi from "@/lib/api/_base.api";
import { setContext } from "@/lib/api/interceptor";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  Clock,
  GraduationCap,
  Minus,
  ShieldCheck,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import AdminShell from "@/components/entities/admin/AdminShell";
import AdminUsersManagement from "@/components/entities/admin/AdminUsersManagement";
import AdminCoursesManagement from "@/components/entities/admin/AdminCoursesManagement";
import AdminOrdersManagement from "@/components/entities/admin/AdminOrdersManagement";
import AdminCategoriesManagement from "@/components/entities/admin/AdminCategoriesManagement";
import AdminTagsManagement from "@/components/entities/admin/AdminTagsManagement";

const ADMIN_TABS = ["overview", "users", "courses", "orders", "categories", "tags", "payouts"];
const DEFAULT_PLATFORM_CURRENCY = "PHP";

const normalizeRoleNames = (roles) => {
  if (!Array.isArray(roles)) return [];
  return roles
    .map((role) => {
      if (!role) return "";
      if (typeof role === "string") return role.toUpperCase();
      if (typeof role === "object") {
        if (role.name) return String(role.name).toUpperCase();
        if (role.role_name) return String(role.role_name).toUpperCase();
        if (role.role) return String(role.role).toUpperCase();
      }
      return "";
    })
    .filter(Boolean);
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getPayoutStatusClass(status) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "EXECUTED") return "bg-emerald-100 text-emerald-700";
  if (normalized === "APPROVED") return "bg-sky-100 text-sky-700";
  if (normalized === "REJECTED") return "bg-rose-100 text-rose-700";
  if (normalized === "FAILED") return "bg-orange-100 text-orange-700";
  return "bg-amber-100 text-amber-700";
}

function getTrend(trends, key) {
  if (!trends) return null;
  const current = Number(trends.current?.[key] || 0);
  const previous = Number(trends.previous?.[key] || 0);
  if (current === previous) return { direction: "balanced", label: "Balanced" };
  if (previous === 0) return { direction: "up", label: "New" };
  const percent = ((current - previous) / previous) * 100;
  if (Math.abs(percent) < 0.5) return { direction: "balanced", label: "Balanced" };
  return {
    direction: percent > 0 ? "up" : "down",
    label: `${percent > 0 ? "+" : ""}${percent.toFixed(Math.abs(percent) < 10 ? 1 : 0)}%`,
  };
}

const TREND_STYLES = {
  up: { Icon: TrendingUp, className: "bg-emerald-50 text-emerald-700" },
  down: { Icon: TrendingDown, className: "bg-rose-50 text-rose-700" },
  balanced: { Icon: Minus, className: "bg-slate-100 text-slate-600" },
};

function TrendBadge({ trend }) {
  if (!trend) return null;
  const { Icon, className } = TREND_STYLES[trend.direction];
  return (
    <span
      title="This month vs the same period last month"
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {trend.label}
    </span>
  );
}

export async function getServerSideProps(context) {
  setContext(context);
  try {
    const meRes = await BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
    );
    const me = meRes?.data?.data;
    const roles = normalizeRoleNames(me?.roles);
    const BASE_USER_ROLES = ["EDUCATOR", "INSTRUCTOR", "LEARNER", "STUDENT"];
    const hasAdminAreaAccess = roles.some(
      (role) => role === "ADMIN" || !BASE_USER_ROLES.includes(role),
    );
    if (!hasAdminAreaAccess) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }
    const incomingTab = String(context.query?.tab || "overview");
    const initialTab = ADMIN_TABS.includes(incomingTab) ? incomingTab : "overview";
    return { props: { initialTab } };
  } catch (_error) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
}

export default function AdminDashboard({ initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || "overview");

  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewData, setOverviewData] = useState({
    usersCount: 0,
    coursesCount: 0,
    paidOrders: 0,
    totalRevenue: 0,
    pendingPayouts: 0,
    totalPayouts: 0,
  });

  const [trends, setTrends] = useState(null);
  const [payoutRows, setPayoutRows] = useState([]);
  const [payoutMeta, setPayoutMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [payoutStatus, setPayoutStatus] = useState("");
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [isRunningAutoProcess, setIsRunningAutoProcess] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [platformSettings, setPlatformSettings] = useState({
    platformFeePercent: 20,
    taxPercent: 0,
    payoutCycle: "ANYTIME",
    defaultCurrency: DEFAULT_PLATFORM_CURRENCY,
  });

  const loadOverview = async () => {
    setOverviewLoading(true);
    BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/overview-trends`)
      .then((res) => setTrends(res?.data?.data || null))
      .catch(() => setTrends(null));
    try {
      const [usersRes, coursesRes, revenueRes, pendingPayoutsRes, totalPayoutsRes] =
        await Promise.all([
          BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/users?page=1&limit=1`),
          BaseApi.get(
            `${process.env.NEXT_PUBLIC_API_URL}/admin/courses?page=1&limit=1`,
          ),
          BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/revenue`),
          BaseApi.get(
            `${process.env.NEXT_PUBLIC_API_URL}/payouts/admin?page=1&limit=1&status=REQUESTED`,
          ),
          BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/payouts/admin?page=1&limit=1`),
        ]);

      setOverviewData({
        usersCount: Number(usersRes?.data?.meta?.total || 0),
        coursesCount: Number(coursesRes?.data?.meta?.total || 0),
        paidOrders: Number(revenueRes?.data?.data?.paidOrders || 0),
        totalRevenue: Number(revenueRes?.data?.data?.totals?.totalAmount || 0),
        pendingPayouts: Number(pendingPayoutsRes?.data?.meta?.total || 0),
        totalPayouts: Number(totalPayoutsRes?.data?.meta?.total || 0),
      });
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load admin overview.");
    } finally {
      setOverviewLoading(false);
    }
  };

  const loadPayoutRequests = async ({
    status = payoutStatus,
    page = payoutPage,
    limit = 20,
  } = {}) => {
    setPayoutLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (status) {
        query.set("status", status);
      }

      const res = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/payouts/admin?${query.toString()}`,
      );
      setPayoutRows(res?.data?.data || []);
      setPayoutMeta(res?.data?.meta || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load payout requests.");
    } finally {
      setPayoutLoading(false);
    }
  };

  const runAutoProcess = async () => {
    setIsRunningAutoProcess(true);
    try {
      const res = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/payouts/admin/auto-process`,
      );
      const result = res?.data?.data;
      toast.success(
        `Auto process done: ${Number(result?.createdRequests || 0)} created, ${Number(result?.skippedEducators || 0)} skipped.`,
      );
      await Promise.all([loadOverview(), loadPayoutRequests()]);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to run auto payout process.");
    } finally {
      setIsRunningAutoProcess(false);
    }
  };

  const loadPlatformSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/platform-settings`,
      );
      const data = res?.data?.data || {};
      setPlatformSettings({
        platformFeePercent: Number(data.platformFeePercent ?? 20),
        taxPercent: Number(data.taxPercent ?? 0),
        payoutCycle: String(data.payoutCycle || "ANYTIME"),
        defaultCurrency: DEFAULT_PLATFORM_CURRENCY,
      });
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load platform settings.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const savePlatformSettings = async () => {
    setSettingsSaving(true);
    try {
      const payload = {
        platformFeePercent: Number(platformSettings.platformFeePercent || 0),
        taxPercent: Number(platformSettings.taxPercent || 0),
        payoutCycle: String(platformSettings.payoutCycle || "ANYTIME").toUpperCase(),
        defaultCurrency: DEFAULT_PLATFORM_CURRENCY,
      };
      await BaseApi.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/platform-settings`,
        payload,
      );
      toast.success("Platform settings updated.");
      await Promise.all([loadPlatformSettings(), loadOverview(), loadPayoutRequests()]);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update platform settings.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const handlePayoutAction = async (action, payoutId) => {
    const normalizedAction = String(action || "").toLowerCase();
    let payload = {};

    if (normalizedAction === "reject") {
      const reviewNote = window.prompt("Rejection note (required):", "") || "";
      if (!reviewNote.trim()) {
        toast.error("Rejection note is required.");
        return;
      }
      payload = { reviewNote: reviewNote.trim() };
    }

    if (normalizedAction === "approve") {
      const reviewNote = window.prompt("Approval note (optional):", "") || "";
      if (reviewNote.trim()) {
        payload = { reviewNote: reviewNote.trim() };
      }
    }

    try {
      await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/payouts/admin/${payoutId}/${normalizedAction}`,
        payload,
      );
      toast.success(`Payout ${normalizedAction}d.`);
      await Promise.all([loadOverview(), loadPayoutRequests()]);
    } catch (error) {
      toast.error(error?.data?.message || `Failed to ${normalizedAction} payout.`);
    }
  };

  useEffect(() => {
    setActiveTab(initialTab || "overview");
  }, [initialTab]);

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (activeTab === "payouts") {
      loadPayoutRequests();
      loadPlatformSettings();
    }
  }, [activeTab, payoutStatus, payoutPage]);

  const overviewCards = useMemo(
    () => [
      {
        label: "Total revenue",
        value: formatCurrency(overviewData.totalRevenue),
        hint: `${overviewData.paidOrders} paid orders`,
        icon: Banknote,
        tone: "bg-emerald-50 text-emerald-600",
        href: "/admin?tab=payouts",
        wide: true,
        trendKey: "revenue",
      },
      {
        label: "Users",
        value: overviewData.usersCount.toLocaleString(),
        hint: "Registered accounts",
        icon: User,
        tone: "bg-blue-50 text-[#0056d2]",
        href: "/admin?tab=users",
        trendKey: "users",
      },
      {
        label: "Courses",
        value: overviewData.coursesCount.toLocaleString(),
        hint: "Across all instructors",
        icon: GraduationCap,
        tone: "bg-violet-50 text-violet-600",
        href: "/admin?tab=courses",
        trendKey: "courses",
      },
      {
        label: "Paid orders",
        value: overviewData.paidOrders.toLocaleString(),
        hint: "Completed purchases",
        icon: ShoppingCart,
        tone: "bg-sky-50 text-sky-600",
        href: "/admin?tab=orders",
        trendKey: "paidOrders",
      },
      {
        label: "Payout requests",
        value: overviewData.totalPayouts.toLocaleString(),
        hint: `${overviewData.pendingPayouts} awaiting review`,
        icon: Wallet,
        tone: "bg-amber-50 text-amber-600",
        href: "/admin?tab=payouts",
        trendKey: "payoutRequests",
      },
    ],
    [overviewData],
  );

  const quickActions = [
    { label: "Review courses", href: "/admin?tab=courses", icon: GraduationCap },
    { label: "Manage users", href: "/admin?tab=users", icon: User },
    { label: "Process payouts", href: "/admin?tab=payouts", icon: Wallet },
    { label: "Roles & permissions", href: "/admin/roles", icon: ShieldCheck },
  ];

  return (
    <AdminShell
      activeKey={activeTab}
      description={
        activeTab === "overview"
          ? "A snapshot of users, courses, sales and payout activity."
          : undefined
      }
    >
      {activeTab === "overview" && (
        <div className="space-y-6">
          {overviewData.pendingPayouts > 0 && !overviewLoading && (
            <Link
              href="/admin?tab=payouts"
              className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm"
            >
              <span className="flex items-center gap-3 font-semibold text-amber-800">
                <Clock className="h-5 w-5" />
                {overviewData.pendingPayouts} payout request
                {overviewData.pendingPayouts === 1 ? "" : "s"} waiting for review
              </span>
              <span className="flex items-center gap-1 font-semibold text-amber-800">
                Review <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {overviewLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[132px] animate-pulse rounded-2xl bg-white/80"
                  />
                ))
              : overviewCards.map((card) => {
                  const Icon = card.icon;
                  const content = (
                    <>
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-semibold text-slate-500">
                          {card.label}
                        </p>
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.tone}`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                      </div>
                      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                        {card.value}
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-500">{card.hint}</p>
                        <TrendBadge trend={getTrend(trends, card.trendKey)} />
                      </div>
                    </>
                  );
                  const className = `rounded-2xl border border-slate-200 bg-white p-5 ${card.wide ? "sm:col-span-2 xl:col-span-1" : ""}`;
                  return card.href ? (
                    <Link
                      key={card.label}
                      href={card.href}
                      className={`${className} transition hover:border-slate-300 hover:shadow-sm`}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div key={card.label} className={className}>
                      {content}
                    </div>
                  );
                })}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">Quick actions</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-3 rounded-xl bg-[#f6f5f1] px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200/60"
                  >
                    <Icon className="h-4 w-4 text-[#0056d2]" />
                    {action.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && <AdminUsersManagement />}

      {activeTab === "courses" && <AdminCoursesManagement />}

      {activeTab === "orders" && <AdminOrdersManagement />}

      {activeTab === "categories" && <AdminCategoriesManagement />}

      {activeTab === "tags" && <AdminTagsManagement />}

      {activeTab === "payouts" && (
        <div className="space-y-5">
          <div className="rounded-lg border border-[#e2e8f0] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Platform commerce settings
              </h3>
              <button
                type="button"
                onClick={savePlatformSettings}
                disabled={settingsSaving || settingsLoading}
                className="rounded-full bg-[#0056d2] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {settingsSaving ? "Saving..." : "Save settings"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Platform fee %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={platformSettings.platformFeePercent}
                  onChange={(event) =>
                    setPlatformSettings((prev) => ({
                      ...prev,
                      platformFeePercent: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tax %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={platformSettings.taxPercent}
                  onChange={(event) =>
                    setPlatformSettings((prev) => ({
                      ...prev,
                      taxPercent: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payout cycle
                </label>
                <select
                  value={platformSettings.payoutCycle}
                  onChange={(event) =>
                    setPlatformSettings((prev) => ({
                      ...prev,
                      payoutCycle: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
                >
                  <option value="ANYTIME">Anytime</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Default currency
                </label>
                <select
                  value={platformSettings.defaultCurrency}
                  onChange={(event) =>
                    setPlatformSettings((prev) => ({
                      ...prev,
                      defaultCurrency: event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm uppercase outline-none"
                >
                  <option value={DEFAULT_PLATFORM_CURRENCY}>PHP</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-[#e2e8f0] bg-white p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={payoutStatus}
                onChange={(event) => {
                  setPayoutStatus(event.target.value);
                  setPayoutPage(1);
                }}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
              >
                <option value="">All statuses</option>
                <option value="REQUESTED">Requested</option>
                <option value="APPROVED">Approved</option>
                <option value="EXECUTED">Executed</option>
                <option value="REJECTED">Rejected</option>
                <option value="FAILED">Failed</option>
              </select>

              <button
                type="button"
                onClick={() => loadPayoutRequests({ page: payoutPage })}
                className="rounded-md border border-[#0056d2] px-4 py-2 text-sm font-semibold text-[#0056d2]"
              >
                Refresh
              </button>
            </div>

            <button
              type="button"
              onClick={runAutoProcess}
              disabled={isRunningAutoProcess}
              className="rounded-full bg-[#0056d2] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isRunningAutoProcess ? "Processing..." : "Run auto payout process"}
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Instructor
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Amount
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Requested
                    </th>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Reviewed
                    </th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {payoutLoading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-sm text-slate-500">
                        Loading payout requests...
                      </td>
                    </tr>
                  ) : payoutRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-sm text-slate-500">
                        No payout requests found.
                      </td>
                    </tr>
                  ) : (
                    payoutRows.map((row) => {
                      const status = String(row?.status || "").toUpperCase();
                      return (
                        <tr key={row.id} className="border-t border-[#e2e8f0]">
                          <td className="px-5 py-4 text-sm">
                            <p className="font-semibold text-slate-900">
                              {row?.educator?.username || "Unknown"}
                            </p>
                            <p className="text-slate-500">{row?.educator?.email || "-"}</p>
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-[#0056d2]">
                            {formatCurrency(row?.amount)}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${getPayoutStatusClass(status)}`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-700">
                            {formatDate(row?.requestedAt || row?.createdAt)}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-700">
                            {formatDate(row?.reviewedAt)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="inline-flex gap-2">
                              {status === "REQUESTED" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handlePayoutAction("approve", row.id)}
                                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handlePayoutAction("reject", row.id)}
                                    className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {["APPROVED", "FAILED"].includes(status) && (
                                <button
                                  type="button"
                                  onClick={() => handlePayoutAction("execute", row.id)}
                                  className="rounded-md bg-[#0056d2] px-3 py-1.5 text-xs font-semibold text-white"
                                >
                                  Execute
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[#e2e8f0] bg-white px-5 py-3">
            <p className="text-sm text-slate-500">
              Total: {Number(payoutMeta?.total || 0)} payout requests
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={Number(payoutMeta?.page || 1) <= 1}
                onClick={() => setPayoutPage((prev) => Math.max(1, prev - 1))}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm text-slate-700">
                Page {Number(payoutMeta?.page || 1)} /{" "}
                {Math.max(Number(payoutMeta?.totalPages || 1), 1)}
              </span>
              <button
                type="button"
                disabled={Number(payoutMeta?.page || 1) >= Number(payoutMeta?.totalPages || 1)}
                onClick={() =>
                  setPayoutPage((prev) =>
                    Math.min(Number(payoutMeta?.totalPages || 1), prev + 1),
                  )
                }
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
