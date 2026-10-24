import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { Banknote, GraduationCap, ShieldCheck, ShoppingCart, User } from "lucide-react";
import BaseApi from "@/lib/api/_base.api";
import { setContext } from "@/lib/api/interceptor";
import {
  getAccessibleSections,
  hasAnyPermission,
} from "@/lib/config/employeePermissions";
import AdminUsersManagement from "@/components/entities/admin/AdminUsersManagement";
import AdminCoursesManagement from "@/components/entities/admin/AdminCoursesManagement";
import AdminCategoriesManagement from "@/components/entities/admin/AdminCategoriesManagement";
import AdminTagsManagement from "@/components/entities/admin/AdminTagsManagement";
import AdminPayoutsManagement, {
  formatCurrency,
} from "@/components/entities/admin/AdminPayoutsManagement";
import EmployeeReports from "@/components/entities/employee/EmployeeReports";
import EmployeeSubscriptionsPanel from "@/components/entities/employee/EmployeeSubscriptionsPanel";
import PlatformSettingsPanel from "@/components/entities/employee/PlatformSettingsPanel";

const API = process.env.NEXT_PUBLIC_API_URL;

const normalizeRoleNames = (roles) => {
  if (!Array.isArray(roles)) return [];
  return roles
    .map((role) => {
      if (!role) return "";
      if (typeof role === "string") return role.toUpperCase();
      return String(role.name || role.role_name || role.role || "").toUpperCase();
    })
    .filter(Boolean);
};

export async function getServerSideProps(context) {
  setContext(context);
  try {
    const meRes = await BaseApi.get(`${API}/users/me`);
    const me = meRes?.data?.data;
    const roles = normalizeRoleNames(me?.roles);
    const permissions = Array.isArray(me?.permissions) ? me.permissions : [];
    const isAdmin = roles.includes("ADMIN");

    const sections = getAccessibleSections(permissions, isAdmin);
    if (sections.length <= 1) {
      return { redirect: { destination: "/", permanent: false } };
    }

    const requested = String(context.query?.tab || "overview");
    const initialTab = sections.some((section) => section.key === requested)
      ? requested
      : "overview";

    return {
      props: {
        initialTab,
        isAdmin,
        roles,
        permissions,
        displayName:
          [me?.firstName, me?.lastName].filter(Boolean).join(" ") || me?.username || "",
      },
    };
  } catch (_error) {
    return { redirect: { destination: "/login", permanent: false } };
  }
}

function formatRoleLabel(role) {
  return String(role)
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function EmployeeOverview({ can }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    const requests = {
      users: can.users && (() => BaseApi.get(`${API}/users?page=1&limit=1`)),
      courses: can.courses && (() => BaseApi.get(`${API}/admin/courses?page=1&limit=1`)),
      pendingCourses:
        can.courses &&
        (() =>
          BaseApi.get(
            `${API}/admin/courses?page=1&limit=1&status=PENDING_APPROVAL`,
          )),
      revenue: can.revenue && (() => BaseApi.get(`${API}/admin/reports/revenue`)),
      pendingPayouts:
        can.payouts &&
        (() => BaseApi.get(`${API}/payouts/admin?page=1&limit=1&status=REQUESTED`)),
    };

    const entries = Object.entries(requests).filter(([, fn]) => fn);
    const results = await Promise.allSettled(entries.map(([, fn]) => fn()));
    const next = {};
    entries.forEach(([key], index) => {
      const result = results[index];
      if (result.status === "fulfilled") next[key] = result.value?.data;
    });
    if (results.some((result) => result.status === "rejected")) {
      toast.error("Some overview figures could not be loaded.");
    }
    setStats(next);
    setLoading(false);
  }, [can.users, can.courses, can.revenue, can.payouts]);

  useEffect(() => {
    load();
  }, [load]);

  const cards = [
    can.users && {
      label: "Users",
      value: Number(stats.users?.meta?.total || 0),
      icon: <User className="h-5 w-5" />,
    },
    can.courses && {
      label: "Courses",
      value: Number(stats.courses?.meta?.total || 0),
      icon: <GraduationCap className="h-5 w-5" />,
    },
    can.courses && {
      label: "Awaiting Review",
      value: Number(stats.pendingCourses?.meta?.total || 0),
      icon: <GraduationCap className="h-5 w-5" />,
    },
    can.revenue && {
      label: "Paid Orders",
      value: Number(stats.revenue?.data?.paidOrders || 0),
      icon: <ShoppingCart className="h-5 w-5" />,
    },
    can.revenue && {
      label: "Revenue",
      value: formatCurrency(stats.revenue?.data?.totals?.totalAmount),
      icon: <Banknote className="h-5 w-5" />,
    },
    can.payouts && {
      label: "Pending Payouts",
      value: Number(stats.pendingPayouts?.meta?.total || 0),
      icon: <Banknote className="h-5 w-5" />,
    },
  ].filter(Boolean);

  if (loading) return <p>Loading overview...</p>;
  if (cards.length === 0) {
    return (
      <p className="text-slate-500">
        Use the tabs above to open the tools available to your role.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-[#e2e8f0] bg-white p-5">
          <div className="mb-2 flex items-center justify-between text-slate-500">
            <p className="text-xs font-semibold uppercase tracking-wide">{card.label}</p>
            {card.icon}
          </div>
          <p className="text-2xl font-bold text-[#0056d2]">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

export default function EmployeeDashboard({
  initialTab,
  isAdmin,
  roles,
  permissions,
  displayName,
}) {
  const router = useRouter();
  const sections = useMemo(
    () => getAccessibleSections(permissions, isAdmin),
    [permissions, isAdmin],
  );
  const [activeTab, setActiveTab] = useState(initialTab || "overview");

  useEffect(() => {
    setActiveTab(initialTab || "overview");
  }, [initialTab]);

  const can = useMemo(() => {
    const check = (required) => isAdmin || hasAnyPermission(permissions, required);
    return {
      users: check(["users.view", "users.suspend", "users.manage"]),
      courses: check(["courses.list", "courses.approve", "courses.reject"]),
      revenue: check(["reports.revenue"]),
      activity: check(["reports.view"]),
      payouts: check(["payouts.manage"]),
      earnings: check(["earnings.manage"]),
      trial: check(["trial.manage", "earnings.manage"]),
      trialManage: check(["trial.manage"]),
      manageSettings: check(["settings.manage"]),
    };
  }, [permissions, isAdmin]);

  const selectTab = (key) => {
    setActiveTab(key);
    router.replace({ pathname: "/employee-dashboard", query: { tab: key } }, undefined, {
      shallow: true,
    });
  };

  const staffRoles = roles.filter((role) => !["EDUCATOR", "LEARNER"].includes(role));

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[2.25rem] font-extrabold tracking-tight text-on-surface">
            Employee Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-on-surface-variant">
            {displayName ? `Welcome, ${displayName}. ` : ""}
            You only see the tools your role has been granted access to.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#0056d2]" />
            {staffRoles.map((role) => (
              <span
                key={role}
                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0056d2]"
              >
                {formatRoleLabel(role)}
              </span>
            ))}
            {isAdmin && (
              <Link href="/admin" className="text-xs font-semibold text-slate-500 underline">
                Open admin dashboard
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8 flex w-fit max-w-full flex-wrap gap-1 rounded-3xl bg-slate-100 p-1.5">
        {sections.map((section) => (
          <button
            key={section.key}
            type="button"
            onClick={() => selectTab(section.key)}
            className={`rounded-full px-5 py-2 text-sm font-semibold ${activeTab === section.key ? "bg-[#0056d2] text-white" : "text-slate-600"}`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <EmployeeOverview can={can} />}
      {activeTab === "courses" && can.courses && <AdminCoursesManagement />}
      {activeTab === "users" && can.users && <AdminUsersManagement />}
      {activeTab === "categories" &&
        sections.some((section) => section.key === "categories") && (
          <AdminCategoriesManagement />
        )}
      {activeTab === "tags" && sections.some((section) => section.key === "tags") && (
        <AdminTagsManagement />
      )}
      {activeTab === "payouts" && can.payouts && <AdminPayoutsManagement />}
      {activeTab === "subscriptions" && (can.earnings || can.trial) && (
        <EmployeeSubscriptionsPanel
          canManageEarnings={can.earnings}
          canViewTrial={can.trial}
          canManageTrial={can.trialManage}
        />
      )}
      {activeTab === "reports" && (can.activity || can.revenue) && (
        <EmployeeReports canViewActivity={can.activity} canViewRevenue={can.revenue} />
      )}
      {activeTab === "settings" &&
        sections.some((section) => section.key === "settings") && (
          <PlatformSettingsPanel canManage={can.manageSettings} />
        )}
    </div>
  );
}
