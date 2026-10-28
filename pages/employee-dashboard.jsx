import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import {
  Banknote,
  BarChart3,
  FolderTree,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tag,
  User,
  Users,
  Wallet,
} from "lucide-react";
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

const SECTION_ICONS = {
  overview: LayoutDashboard,
  courses: GraduationCap,
  users: Users,
  categories: FolderTree,
  tags: Tag,
  payouts: Wallet,
  subscriptions: Banknote,
  reports: BarChart3,
  settings: Settings,
};

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
  const activeSection = sections.find((section) => section.key === activeTab);

  return (
    <div className="bg-[#f6f5f1]">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-6 lg:flex-row lg:gap-6 lg:px-6">
        <aside className="lg:sticky lg:top-4 lg:h-fit lg:w-[104px] lg:shrink-0">
          <nav
            aria-label="Employee sections"
            className="flex gap-1 overflow-x-auto rounded-2xl bg-white/70 p-2 lg:flex-col lg:overflow-visible"
          >
            {sections.map((section) => {
              const Icon = SECTION_ICONS[section.key] || LayoutDashboard;
              const active = activeTab === section.key;
              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => selectTab(section.key)}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-w-[84px] flex-col items-center gap-1 rounded-xl px-2 py-3 text-center text-[11px] font-semibold leading-tight transition lg:min-w-0 ${active ? "bg-white text-[#0056d2] shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-white/80"}`}
                >
                  <Icon className="h-5 w-5" />
                  {section.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <p>
              <span>Employee</span>
              <span className="mx-2 text-slate-300">/</span>
              <span className="font-semibold text-slate-900">
                {activeSection?.label || "Overview"}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0056d2]" />
              {staffRoles.map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                >
                  {formatRoleLabel(role)}
                </span>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                >
                  Admin dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="mt-5 border-b border-slate-200 pb-5">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {activeSection?.label || "Employee Dashboard"}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              {displayName ? `Welcome, ${displayName}. ` : ""}
              You only see the tools your role has been granted access to.
            </p>
          </div>

          <div className="mt-6 [&_table]:bg-white">
            {renderActiveTab()}
          </div>
        </div>
      </div>
    </div>
  );

  function renderActiveTab() {
    return (
      <>
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
      </>
    );
  }
}
