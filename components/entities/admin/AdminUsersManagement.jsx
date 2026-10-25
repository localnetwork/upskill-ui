import Select from "@/components/forms/Select";
import { confirmModal } from "@/lib/services/confirm";
import BaseApi from "@/lib/api/_base.api";
import { Ban, BookOpen, Edit, Lock, MoreVertical, Search, ShieldCheck, UserPlus, X } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import AdminRolesGuide from "./AdminRolesGuide";
import { CreateUserModal, UserRolesModal } from "./AdminUserFormModals";

const ROLE_OPTIONS = [
  { value: "ALL", label: "All Roles" },
  { value: "ADMIN", label: "Admin" },
  { value: "EDUCATOR", label: "Educator" },
  { value: "LEARNER", label: "Learner" },
  { value: "FINANCE_OFFICER", label: "Finance Officer" },
  { value: "COURSE_REVIEWER", label: "Course Reviewer" },
  { value: "SUPPORT_AGENT", label: "Support Agent" },
  { value: "ANALYST", label: "Analyst" },
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
const STAFF_BADGE_CLASS = "bg-emerald-100 text-emerald-700";

function formatRoleLabel(name = "") {
  return String(name)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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
    roleBadges: (roles.length ? roles : ["LEARNER"]).map((name) => {
      const key = String(name).toUpperCase();
      return {
        key,
        label: formatRoleLabel(key),
        style: ROLE_BADGE_CLASS[key] || STAFF_BADGE_CLASS,
      };
    }),
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
  const [myRoles, setMyRoles] = useState([]);
  const [myId, setMyId] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", headline: "", biography: "" });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [menu, setMenu] = useState(null);
  const [roleCatalog, setRoleCatalog] = useState([]);
  const [showGuide, setShowGuide] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [rolesUser, setRolesUser] = useState(null);

  const isAdmin = myRoles.includes("ADMIN");
  const staffRoles = useMemo(
    () => roleCatalog.filter((r) => !r.is_system),
    [roleCatalog],
  );

  useEffect(() => {
    if (!isAdmin) return;
    BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/roles`)
      .then((res) => setRoleCatalog(res?.data?.data || []))
      .catch(() => {});
  }, [isAdmin, reloadKey]);
  useEffect(() => {
    if (!menu) return undefined;
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menu]);

  useEffect(() => {
    BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me`)
      .then((res) => {
        const me = res?.data?.data;
        setMyId(me?.id || null);
        setMyRoles(
          (me?.roles || []).map((r) => String(r?.name || r).toUpperCase()),
        );
      })
      .catch(() => {});
  }, []);

  const menuUser = menu ? users.find((u) => u.id === menu.id) : null;

  const sharesRole = (user) =>
    (user.roles || []).some((r) => myRoles.includes(String(r).toUpperCase()));
  const suspendBlockedReason = (user) =>
    user.id === myId
      ? "You cannot suspend your own account"
      : sharesRole(user)
        ? "Cannot suspend a user with the same role as you"
        : "";

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      headline: user.headline || "",
      biography: user.biography || "",
    });
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await BaseApi.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${editing.id}`,
        form,
      );
      toast.success("User updated");
      setEditing(null);
      setReloadKey((k) => k + 1);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const toggleSuspend = async (user) => {
    const suspend = user.status !== "Suspended";
    if (
      suspend &&
      !(await confirmModal({
        title: "Suspend user",
        message: `Suspend ${user.username}?`,
        confirmText: "Suspend",
        variant: "danger",
      }))
    )
      return;
    setBusyId(user.id);
    try {
      await BaseApi.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${user.id}/suspend`,
        { suspended: suspend },
      );
      toast.success(suspend ? "User suspended" : "User reactivated");
      setReloadKey((k) => k + 1);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update account status");
    } finally {
      setBusyId(null);
    }
  };
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
  }, [page, pagination.limit, role, searchQuery, status, reloadKey]);

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
            {isAdmin ? (
              <button
                type="button"
                onClick={() => setShowGuide(true)}
                className="flex shrink-0 items-center gap-2 rounded-[5px] border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <BookOpen size={16} /> Roles guide
              </button>
            ) : null}
            {isAdmin ? (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="flex shrink-0 items-center gap-2 rounded-[5px] bg-primary px-3 py-2.5 text-sm font-semibold text-white"
              >
                <UserPlus size={16} /> Add user
              </button>
            ) : null}
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
                    <div className="flex flex-wrap gap-1">
                      {user.roleBadges.map((badge) => (
                        <span
                          key={badge.key}
                          className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full ${badge.style}`}
                        >
                          {badge.label}
                        </span>
                      ))}
                    </div>
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
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        title="Actions"
                        aria-haspopup="menu"
                        aria-expanded={menu?.id === user.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (menu?.id === user.id) return setMenu(null);
                          const rect = event.currentTarget.getBoundingClientRect();
                          setMenu({
                            id: user.id,
                            top: rect.bottom + 4,
                            right: window.innerWidth - rect.right,
                          });
                        }}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-primary"
                      >
                        <MoreVertical size={20} />
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

        {menuUser ? (
          <div
            role="menu"
            onClick={(event) => event.stopPropagation()}
            style={{ position: "fixed", top: menu.top, right: menu.right }}
            className="z-50 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenu(null);
                openEdit(menuUser);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <Edit size={16} /> Edit user
            </button>
            {isAdmin ? (
              <button
                type="button"
                role="menuitem"
                title={menuUser.id === myId ? "You cannot change your own roles" : ""}
                disabled={menuUser.id === myId}
                onClick={() => {
                  setMenu(null);
                  setRolesUser(menuUser);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ShieldCheck size={16} /> Manage staff roles
              </button>
            ) : null}
            <button
              type="button"
              role="menuitem"
              title={suspendBlockedReason(menuUser)}
              disabled={Boolean(suspendBlockedReason(menuUser)) || busyId === menuUser.id}
              onClick={() => {
                setMenu(null);
                toggleSuspend(menuUser);
              }}
              className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${menuUser.status === "Suspended" ? "text-slate-700" : "text-error"}`}
            >
              <Ban size={16} />
              {menuUser.status === "Suspended" ? "Reactivate account" : "Suspend account"}
            </button>
          </div>
        ) : null}

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

      {showGuide ? (
        <AdminRolesGuide
          roles={roleCatalog}
          onClose={() => setShowGuide(false)}
        />
      ) : null}
      {showCreate ? (
        <CreateUserModal
          staffRoles={staffRoles}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            setReloadKey((k) => k + 1);
          }}
        />
      ) : null}
      {rolesUser ? (
        <UserRolesModal
          user={rolesUser}
          staffRoles={staffRoles}
          onClose={() => setRolesUser(null)}
          onSaved={() => {
            setRolesUser(null);
            setReloadKey((k) => k + 1);
          }}
        />
      ) : null}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={saveEdit}
            className="flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-bold">Edit user</h2>
              <button type="button" onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto p-5">
              {[
                ["ID", editing.id],
                ["Username", editing.username],
                ["Email", editing.email],
                ["Role", editing.role],
              ].map(([label, value]) => (
                <label key={label} className="block text-sm">
                  <span className="mb-1 flex items-center gap-1 font-semibold text-slate-500">
                    <Lock size={12} /> {label}
                  </span>
                  <input
                    readOnly
                    disabled
                    value={value || ""}
                    className="w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500"
                  />
                </label>
              ))}
              <div className="grid grid-cols-2 gap-3">
                {[["firstName", "First name"], ["lastName", "Last name"]].map(([key, label]) => (
                  <label key={key} className="block text-sm">
                    <span className="mb-1 block font-semibold text-slate-700">{label}</span>
                    <input
                      value={form[key]}
                      maxLength={80}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full rounded-md border border-slate-300 px-3 py-2"
                    />
                  </label>
                ))}
              </div>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700">Headline</span>
                <input
                  value={form.headline}
                  maxLength={100}
                  onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-semibold text-slate-700">Biography</span>
                <textarea
                  rows={4}
                  value={form.biography}
                  maxLength={2000}
                  onChange={(e) => setForm((f) => ({ ...f, biography: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                />
              </label>
              <p className="text-xs text-slate-500">
                ID, username, email and role are locked and cannot be changed here.
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button type="button" onClick={() => setEditing(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
