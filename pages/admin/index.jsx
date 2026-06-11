import { useEffect, useMemo, useState } from "react";
import BaseApi from "@/lib/api/_base.api";
import { setContext } from "@/lib/api/interceptor";
import toast from "react-hot-toast";

export async function getServerSideProps(context) {
  setContext(context);
  try {
    const meRes = await BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`);
    const me = meRes?.data?.data;
    const roles = Array.isArray(me?.roles) ? me.roles : [];
    if (!roles.includes("ADMIN")) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }
    return { props: {} };
  } catch (_error) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [courseStatus, setCourseStatus] = useState("");

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const usersRes = await BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/users?page=1&limit=10`);
      const statusQuery = courseStatus ? `&status=${courseStatus}` : "";
      const coursesRes = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/courses?page=1&limit=10${statusQuery}`,
      );
      const revenueRes = await BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/revenue`);
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
      action === "approve" ? "Approval note (optional):" : "Rejection note (required):",
      "",
    );
    if (action === "reject" && !note) {
      toast.error("Rejection note is required");
      return;
    }

    try {
      await BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/courses/${courseId}/${action}`, {
        note: note || undefined,
      });
      toast.success(action === "approve" ? "Course approved" : "Course rejected");
      fetchDashboardData();
    } catch (error) {
      toast.error(error?.data?.message || `Failed to ${action} course`);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-semibold mb-6">Admin Dashboard</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 rounded ${activeTab === "overview" ? "bg-[#0056D2] text-white" : "bg-gray-100"}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded ${activeTab === "users" ? "bg-[#0056D2] text-white" : "bg-gray-100"}`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab("courses")}
          className={`px-4 py-2 rounded ${activeTab === "courses" ? "bg-[#0056D2] text-white" : "bg-gray-100"}`}
        >
          Courses
        </button>
      </div>

      {loading ? (
        <p>Loading admin data...</p>
      ) : (
        <>
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card label="Users" value={overview.users} />
              <Card label="Courses" value={overview.courses} />
              <Card label="Paid Orders" value={overview.paidOrders} />
              <Card label="Revenue" value={`$${overview.revenue}`} />
            </div>
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
                        <td className="p-3">{course.educator?.username || "-"}</td>
                        <td className="p-3">{course.workflowStatus}</td>
                        <td className="p-3">
                          {course.workflowStatus === "PENDING_APPROVAL" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => reviewCourse(course.id, "approve")}
                                className="px-3 py-1 rounded bg-green-600 text-white"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => reviewCourse(course.id, "reject")}
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

function Card({ label, value }) {
  return (
    <div className="border rounded p-4 bg-white">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
