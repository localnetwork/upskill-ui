import { useEffect, useMemo, useState } from "react";
import BaseApi from "@/lib/api/_base.api";
import { setContext } from "@/lib/api/interceptor";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  Banknote,
  DollarSign,
  GraduationCap,
  ShoppingCart,
  User,
  UserPlus,
} from "lucide-react";

const ADMIN_TABS = ["overview", "users", "courses"];

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

export async function getServerSideProps(context) {
  setContext(context);
  try {
    const meRes = await BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
    );
    const me = meRes?.data?.data;
    const roles = normalizeRoleNames(me?.roles);
    if (!roles.includes("ADMIN")) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }
    const incomingTab = String(context.query?.tab || "overview");
    const initialTab = ADMIN_TABS.includes(incomingTab)
      ? incomingTab
      : "overview";
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
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(false);

  const [courseStatus, setCourseStatus] = useState("");

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const usersRes = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users?page=1&limit=10`,
      );
      const statusQuery = courseStatus ? `&status=${courseStatus}` : "";
      const coursesRes = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/courses?page=1&limit=10${statusQuery}`,
      );
      const revenueRes = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/reports/revenue`,
      );
      setUsers(usersRes?.data?.data || []);
      setCourses(coursesRes?.data?.data || []);
      setRevenue(revenueRes?.data?.data || null);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveTab(initialTab || "overview");
  }, [initialTab]);

  useEffect(() => {
    fetchDashboardData();
  }, [courseStatus]);

  const overview = useMemo(() => {
    const paidTotal = Number(revenue?.totals?.totalAmount || 0);
    return {
      users: users.length,
      courses: courses.length,
      paidOrders: revenue?.paidOrders || 0,
      revenue: paidTotal.toFixed(2),
    };
  }, [users, courses, revenue]);

  const reviewCourse = async (courseId, action) => {
    const note = window.prompt(
      action === "approve"
        ? "Approval note (optional):"
        : "Rejection note (required):",
      "",
    );
    if (action === "reject" && !note) {
      toast.error("Rejection note is required");
      return;
    }

    try {
      await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/courses/${courseId}/${action}`,
        {
          note: note || undefined,
        },
      );
      toast.success(
        action === "approve" ? "Course approved" : "Course rejected",
      );
      fetchDashboardData();
    } catch (error) {
      toast.error(error?.data?.message || `Failed to ${action} course`);
    }
  };

  return (
    <div className="container py-8">
      <div>
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 class="text-[2.25rem] font-extrabold tracking-tight text-on-surface mb-2">
              Admin Dashboard
            </h1>
            <p class="text-on-surface-variant max-w-2xl">
              Welcome back, Administrator. Here's a snapshot of the academic
              progress and platform growth across your assigned modules.
            </p>
          </div>
          <div class="flex p-1.5 bg-surface-container-low rounded-full gap-1">
            <Link
              href="/admin?tab=overview"
              className={`px-6 py-2 rounded-full font-bold text-sm transition-all scale-100 ${activeTab === "overview" ? "bg-[#0056d2] text-white" : "text-slate-500"}`}
            >
              Overview
            </Link>
            <Link
              href="/admin?tab=users"
              className={`px-6 py-2 rounded-full font-bold text-sm transition-all scale-100 ${activeTab === "users" ? "bg-[#0056d2] text-white" : "text-slate-500"}`}
            >
              Users
            </Link>
            <Link
              href="/admin?tab=courses"
              className={`px-6 py-2 rounded-full font-bold text-sm transition-all scale-100 ${activeTab === "courses" ? "bg-[#0056d2] text-white" : "text-slate-500"}`}
            >
              Courses
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading admin data...</p>
      ) : (
        <>
          {activeTab === "overview" && (
            <>
              <div class="cards mb-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card
                    iconBg="#f0f7ff"
                    icon={<User />}
                    label="Users"
                    value={overview.users}
                    title={`<span class="text-green-500">+12%</span>`}
                    description="Active users this month"
                  />
                  <Card
                    iconBg="#FCE4D2"
                    icon={<GraduationCap />}
                    label="Courses"
                    value={overview.courses}
                    title={`<span class="text-green-500">stable</span>`}
                    description={`4 courses in draft mode.`}
                  />
                  <Card
                    iconBg="#E4E9ED"
                    icon={<ShoppingCart />}
                    label="Paid Orders"
                    title={`<span class="text-green-500">0%</span>`}
                    description="No new transaction today"
                    value={overview.paidOrders}
                  />
                  <Card
                    iconBg="#BCD4F5"
                    icon={<Banknote />}
                    label="Revenue"
                    title={`<span class="text-green-500">MTD</span>`}
                    description={`Payout cycle: 15th of month.`}
                    value={`₱${overview.revenue}`}
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 bg-surface border border-[#e2e8f0] rounded-lg overflow-hidden flex flex-col">
                  <div class="px-8 py-6 border-b border-[#e2e8f0] flex justify-between items-center">
                    <h3 class="text-lg font-bold">Platform Engagement</h3>
                    <div class="flex gap-2">
                      <button class="px-3 py-1 text-xs font-bold text-primary bg-[#0056d2]-container rounded-md">
                        Weekly
                      </button>
                      <button class="px-3 py-1 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-md">
                        Monthly
                      </button>
                    </div>
                  </div>
                  <div class="flex-grow p-8 min-h-[300px] relative bg-surface-container-low/30 overflow-hidden">
                    <div class="absolute inset-0 flex items-end px-8 pb-8 gap-4">
                      <div class="flex-1 bg-[#0056d2]/20 h-[40%] rounded-t-md transition-all hover:bg-[#0056d2]/40"></div>
                      <div class="flex-1 bg-[#0056d2]/20 h-[60%] rounded-t-md transition-all hover:bg-[#0056d2]/40"></div>
                      <div class="flex-1 bg-[#0056d2]/20 h-[35%] rounded-t-md transition-all hover:bg-[#0056d2]/40"></div>
                      <div class="flex-1 bg-[#0056d2]/20 h-[80%] rounded-t-md transition-all hover:bg-[#0056d2]/40"></div>
                      <div class="flex-1 bg-[#0056d2]/20 h-[55%] rounded-t-md transition-all hover:bg-[#0056d2]/40"></div>
                      <div class="flex-1 bg-[#0056d2]/20 h-[90%] rounded-t-md transition-all hover:bg-[#0056d2]/40"></div>
                      <div class="flex-1 bg-[#0056d2]/20 h-[70%] rounded-t-md transition-all hover:bg-[#0056d2]/40"></div>
                    </div>
                    <div class="absolute inset-0 flex flex-col justify-between pointer-events-none p-8 opacity-10">
                      <div class="border-b border-on-surface w-full"></div>
                      <div class="border-b border-on-surface w-full"></div>
                      <div class="border-b border-on-surface w-full"></div>
                      <div class="border-b border-on-surface w-full"></div>
                    </div>
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <p class="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Activity Trend (Draft)
                      </p>
                    </div>
                  </div>
                </div>
                <div class="bg-surface border border-[#e2e8f0] rounded-lg flex flex-col">
                  <div class="px-8 py-6 border-b border-[#e2e8f0]">
                    <h3 class="text-lg font-bold">Recent Activity</h3>
                  </div>
                  <div class="flex-grow divide-y divide-outline">
                    <div class="px-8 py-4 flex items-start gap-4 hover:bg-surface-container-low transition-colors group cursor-pointer">
                      <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <UserPlus class="text-green-500 text-xl" />
                      </div>
                      <div>
                        <p class="text-sm font-bold text-on-surface">
                          New User Registered
                        </p>
                        <p class="text-xs text-on-surface-variant">
                          Elena Vance joined Sapphire Scholar.
                        </p>
                        <span class="text-[10px] font-bold text-slate-400 uppercase mt-1 inline-block">
                          2 hours ago
                        </span>
                      </div>
                    </div>
                    <div class="px-8 py-4 flex items-start gap-4 hover:bg-surface-container-low transition-colors group cursor-pointer">
                      <div class="w-10 h-10 rounded-full bg-[#0056d2]-container flex items-center justify-center flex-shrink-0">
                        <span class="material-symbols-outlined text-primary text-xl">
                          fact_check
                        </span>
                      </div>
                      <div>
                        <p class="text-sm font-bold text-on-surface">
                          Review Pending
                        </p>
                        <p class="text-xs text-on-surface-variant">
                          Course "Advanced UI Architecture" needs review.
                        </p>
                        <span class="text-[10px] font-bold text-slate-400 uppercase mt-1 inline-block">
                          5 hours ago
                        </span>
                      </div>
                    </div>
                    <div class="px-8 py-4 flex items-start gap-4 hover:bg-surface-container-low transition-colors group cursor-pointer">
                      <div class="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center flex-shrink-0">
                        <span class="material-symbols-outlined text-tertiary text-xl">
                          update
                        </span>
                      </div>
                      <div>
                        <p class="text-sm font-bold text-on-surface">
                          System Update
                        </p>
                        <p class="text-xs text-on-surface-variant">
                          Analytics engine successfully re-indexed.
                        </p>
                        <span class="text-[10px] font-bold text-slate-400 uppercase mt-1 inline-block">
                          Yesterday
                        </span>
                      </div>
                    </div>
                    <div class="px-8 py-4 text-center">
                      <button class="text-sm font-bold text-primary hover:underline">
                        View All Log History
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "users" && (
            <div className="border rounded overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Username</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Roles</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t">
                      <td className="p-3">{user.username}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">{(user.roles || []).join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "courses" && (
            <div>
              <div className="mb-4">
                <select
                  value={courseStatus}
                  onChange={(e) => setCourseStatus(e.target.value)}
                  className="border rounded px-3 py-2"
                >
                  <option value="">All statuses</option>
                  <option value="PENDING_APPROVAL">Pending approval</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>
              <div className="border rounded overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">Title</th>
                      <th className="text-left p-3">Educator</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.id} className="border-t">
                        <td className="p-3">{course.title}</td>
                        <td className="p-3">
                          {course.educator?.username || "-"}
                        </td>
                        <td className="p-3">{course.workflowStatus}</td>
                        <td className="p-3">
                          {course.workflowStatus === "PENDING_APPROVAL" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  reviewCourse(course.id, "approve")
                                }
                                className="px-3 py-1 rounded bg-green-600 text-white"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  reviewCourse(course.id, "reject")
                                }
                                className="px-3 py-1 rounded bg-red-600 text-white"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-500">No action</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Card({ icon, label, value, description, title, iconBg }) {
  const darkenColor = (hex, amount = 40) => {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);

    let h, s;
    let l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        default:
          h = (r - g) / d + 4;
      }

      h /= 6;
    }

    // Reduce lightness while preserving hue
    l = Math.max(0, l - amount / 100);

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r2, g2, b2;

    if (s === 0) {
      r2 = g2 = b2 = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r2 = hue2rgb(p, q, h + 1 / 3);
      g2 = hue2rgb(p, q, h);
      b2 = hue2rgb(p, q, h - 1 / 3);
    }

    return `rgb(${Math.round(r2 * 255)}, ${Math.round(g2 * 255)}, ${Math.round(
      b2 * 255,
    )})`;
  };
  return (
    <div class="bg-surface border border-[#e2e8f0] rounded-lg p-6 hover:shadow-xl transition-all duration-300 group">
      <div class="flex justify-between items-start mb-4">
        <div
          style={{ backgroundColor: iconBg, color: darkenColor(iconBg, 40) }}
          class={`p-2 rounded-lg group-hover:scale-110 transition-transform`}
        >
          {icon}
        </div>
        <span class="text-xs font-bold uppercase tracking-widest text-on-surface-variant opacity-60">
          {label}
        </span>
      </div>
      <div class="flex items-baseline gap-2">
        <span class="text-4xl font-extrabold text-on-surface">{value}</span>
        <span
          class="text-xs font-bold text-tertiary"
          dangerouslySetInnerHTML={{ __html: title }}
        />
      </div>
      <p
        class="text-xs text-slate-400 mt-2"
        dangerouslySetInnerHTML={{ __html: description }}
      ></p>
    </div>
  );
}
