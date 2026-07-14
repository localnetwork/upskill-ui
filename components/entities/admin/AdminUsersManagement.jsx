import Select from "@/components/forms/Select";
import BaseApi from "@/lib/api/_base.api";
import { Edit, EllipsisVertical, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const ROLE_OPTIONS = [
  { value: "ALL", label: "All Roles" },
  { value: "ADMIN", label: "Admin" },
  { value: "EDUCATOR", label: "Educator" },
  { value: "LEARNER", label: "Learner" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "PENDING", label: "Pending" },
];

const ROLE_BADGE_CLASS = {
  ADMIN: "bg-purple-100 text-purple-700",
  EDUCATOR: "bg-blue-100 text-blue-700",
  LEARNER: "bg-amber-100 text-amber-700",
};

const STATUS_TEXT_CLASS = {
  Active: "text-emerald-700",
  Suspended: "text-error",
  Pending: "text-amber-700",
};

const STATUS_DOT_CLASS = {
  Active: "bg-emerald-500",
  Suspended: "bg-error",
  Pending: "bg-amber-500",
};

function toTitleCase(value = "") {
  const text = String(value || "")
    .trim()
    .toLowerCase();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getInitials(user) {
  const firstName = String(user?.firstName || user?.firstname || "").trim();
  const lastName = String(user?.lastName || user?.lastname || "").trim();
  if (firstName || lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  }

  return String(user?.username || "U")
    .charAt(0)
    .toUpperCase();
}

function normalizeUser(user) {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const primaryRole = String(roles[0] || "LEARNER").toUpperCase();
  const backendStatus = String(user?.status || "").trim();
  const status = backendStatus || (user?.isActive ? "Active" : "Suspended");

  return {
    ...user,
    role: toTitleCase(primaryRole),
    roleStyle: ROLE_BADGE_CLASS[primaryRole] || "bg-slate-100 text-slate-700",
    status,
    initials: getInitials(user),
    avatarStyle: "bg-slate-100 text-slate-600",
  };
}

export default function AdminUsersManagement() {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/users`,
          {
            params: {
              page,
              limit: pagination.limit,
              ...(searchQuery ? { search: searchQuery } : {}),
              ...(role !== "ALL" ? { role } : {}),
              ...(status !== "ALL" ? { status } : {}),
            },
          },
        );

        const rows = Array.isArray(response?.data?.data)
          ? response.data.data
          : [];
        setUsers(rows.map(normalizeUser));

        const rawMeta =
          response?.data?.meta || response?.data?.pagination || {};
        setPagination((prev) => ({
          page: Number(rawMeta.page || prev.page || 1),
          limit: Number(rawMeta.limit || prev.limit || 10),
          total: Number(rawMeta.total || 0),
          totalPages: Math.max(1, Number(rawMeta.totalPages || 1)),
        }));
      } catch (error) {
        setUsers([]);
        setPagination((prev) => ({
          ...prev,
          page: 1,
          total: 0,
          totalPages: 1,
        }));
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [page, pagination.limit, role, searchQuery, status]);

  const totalPages = Math.max(1, Number(pagination.totalPages || 1));
  const currentPage = Math.min(
    Math.max(1, Number(pagination.page || 1)),
    totalPages,
  );
  const startItem = pagination.total
    ? (currentPage - 1) * pagination.limit + 1
    : 0;
  const endItem = pagination.total
    ? Math.min(currentPage * pagination.limit, pagination.total)
    : 0;

  const visiblePages = useMemo(() => {
    if (totalPages <= 1) return [];

    const spread = 1;
    const pages = new Set([1, totalPages, currentPage]);
    for (let p = currentPage - spread; p <= currentPage + spread; p += 1) {
      if (p > 1 && p < totalPages) pages.add(p);
    }

    const sorted = Array.from(pages).sort((a, b) => a - b);
    const result = [];
    for (let index = 0; index < sorted.length; index += 1) {
      const pageNumber = sorted[index];
      const previous = sorted[index - 1];
      if (previous && pageNumber - previous > 1) {
        result.push(`ellipsis-${previous}-${pageNumber}`);
      }
      result.push(pageNumber);
    }
    return result;
  }, [currentPage, totalPages]);

  return (
    <div>
      <div className="bg-surface rounded-lg shadow-sm border border-[#e2e8f0] overflow-hidden">
        {/* Filter Bar */}
        <div className="p-6 border-b border-[#e2e8f0] flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              className="w-full pl-10 pr-4 py-2.5 bg-[#f8fafc] border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              placeholder="Search by name, email or ID..."
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select
              className={`border border-[oklch(67.22%_0.0355_279.77deg)] rounded-[5px] p-[10px] w-full`}
              name="roles"
              id="roles"
              value={role}
              options={ROLE_OPTIONS}
              onChange={(e) => {
                setPage(1);
                setRole(e.target.value || "ALL");
              }}
            />

            <Select
              className={`border border-[oklch(67.22%_0.0355_279.77deg)] rounded-[5px] p-[10px] w-full`}
              name="status"
              id="status"
              value={status}
              options={STATUS_OPTIONS}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value || "ALL");
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                {["Username", "Email", "Role", "Status", "Actions"].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-6 py-4 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant"
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-outline">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img
                          src={user.image}
                          className="w-10 h-10 rounded-full object-cover"
                          alt={user.username}
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${user.avatarStyle}`}
                        >
                          {user.initials}
                        </div>
                      )}

                      <div>
                        <p className="font-bold text-on-surface group-hover:text-primary">
                          {user.username}
                        </p>
                        <p className="text-xs text-slate-500">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-sm text-on-surface-variant">
                    {user.email}
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full ${user.roleStyle}`}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          STATUS_DOT_CLASS[user.status] || "bg-slate-400"
                        }`}
                      />

                      <span
                        className={`text-sm font-medium ${
                          STATUS_TEXT_CLASS[user.status] || "text-slate-600"
                        }`}
                      >
                        {user.status}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-primary">
                        {/* <span className="material-symbols-outlined text-[20px]">
                          edit
                        </span> */}

                        <Edit className="text-[20px]" />
                      </button>

                      <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-secondary">
                        <EllipsisVertical className="text-[20px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!users.length ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-slate-500"
                  >
                    {isLoading ? "Loading users..." : "No users found."}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-white border-t border-[#e2e8f0] flex items-center justify-between">
          <p className="text-xs text-on-surface-variant font-medium">
            Showing {startItem} to {endItem} of {pagination.total} users
          </p>

          <div className="flex items-center gap-2">
            <button
              className="w-8 h-8 rounded-full border border-[#e2e8f0] disabled:opacity-50"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1 || isLoading}
            >
              ‹
            </button>

            {visiblePages.map((item) =>
              typeof item === "string" ? (
                <span key={item} className="text-xs text-slate-400">
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  className={`w-8 h-8 rounded-full text-xs font-bold ${
                    item === currentPage
                      ? "bg-primary text-white"
                      : "border border-[#e2e8f0]"
                  }`}
                  onClick={() => setPage(item)}
                  disabled={isLoading}
                >
                  {item}
                </button>
              ),
            )}

            <button
              className="w-8 h-8 rounded-full border border-[#e2e8f0] disabled:opacity-50"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages || isLoading}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
