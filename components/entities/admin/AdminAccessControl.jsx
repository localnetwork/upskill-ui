import { useCallback, useEffect, useMemo, useState } from "react";
import { confirmModal } from "@/lib/services/confirm";
import Link from "next/link";
import toast from "react-hot-toast";
import { Lock, Plus, Save, Trash2 } from "lucide-react";
import BaseApi from "@/lib/api/_base.api";

const API = process.env.NEXT_PUBLIC_API_URL;

const errorMessage = (error, fallback) => error?.data?.message || error?.message || fallback;

export function AdminAccessNav({ active }) {
  const items = [
    { href: "/admin", label: "Dashboard", key: "dashboard" },
    { href: "/admin/roles", label: "Roles", key: "roles" },
    { href: "/admin/permissions", label: "Permissions", key: "permissions" },
  ];
  return (
    <div className="mb-6 flex w-fit rounded-full bg-slate-100 p-1.5">
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`rounded-full px-5 py-2 text-sm font-semibold ${active === item.key ? "bg-[#0056d2] text-white" : "text-slate-600"}`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function useAccessData() {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [permRes, roleRes] = await Promise.all([
        BaseApi.get(`${API}/admin/permissions`),
        BaseApi.get(`${API}/admin/roles`),
      ]);
      setPermissions(permRes?.data?.data || []);
      setRoles(roleRes?.data?.data || []);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to load roles and permissions"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { permissions, roles, setRoles, loading, reload: load };
}

function groupPermissions(permissions) {
  const groups = new Map();
  permissions.forEach((permission) => {
    const key = permission.group || "general";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(permission);
  });
  return Array.from(groups.entries());
}

function RoleBadge({ name, system }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${system ? "bg-blue-50 text-[#0056d2]" : "bg-emerald-50 text-emerald-700"}`}
    >
      {name}
    </span>
  );
}

export function PermissionsOverview() {
  const { permissions, loading } = useAccessData();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return permissions;
    return permissions.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q),
    );
  }, [permissions, query]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {permissions.length} permissions defined. Assign them to roles in{" "}
          <Link href="/admin/roles" className="font-semibold text-[#0056d2] underline">
            Roles
          </Link>
          .
        </p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search permissions…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:w-64"
        />
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500">No permissions found.</p>
      ) : (
        <div className="space-y-5">
          {groupPermissions(filtered).map(([group, items]) => (
            <section key={group} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <h2 className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                {group}
              </h2>
              <ul className="divide-y divide-slate-100">
                {items.map((permission) => (
                  <li
                    key={permission.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  >
                    <div>
                      <p className="font-mono text-sm font-semibold text-slate-900">{permission.name}</p>
                      {permission.description && (
                        <p className="text-xs text-slate-500">{permission.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {permission.roles.length === 0 ? (
                        <span className="text-xs text-slate-400">Not assigned</span>
                      ) : (
                        permission.roles.map((role) => (
                          <RoleBadge key={role.id} name={role.name} system />
                        ))
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export function RolesManager() {
  const { permissions, roles, loading, reload } = useAccessData();
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const selected = useMemo(
    () => roles.find((role) => role.id === selectedId) || null,
    [roles, selectedId],
  );

  useEffect(() => {
    if (!selectedId && roles.length) setSelectedId(roles[0].id);
  }, [roles, selectedId]);

  useEffect(() => {
    setDraft(selected ? selected.permission_ids : []);
  }, [selected]);

  const dirty = useMemo(() => {
    if (!selected) return false;
    const a = [...selected.permission_ids].sort().join(",");
    const b = [...draft].sort().join(",");
    return a !== b;
  }, [selected, draft]);

  const toggle = (id) =>
    setDraft((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await BaseApi.put(`${API}/admin/roles/${selected.id}/permissions`, {
        permissionIds: draft,
      });
      toast.success("Permissions updated");
      await reload();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to update permissions"));
    } finally {
      setSaving(false);
    }
  };

  const create = async (event) => {
    event.preventDefault();
    setCreating(true);
    try {
      const res = await BaseApi.post(`${API}/admin/roles`, {
        name: newName,
        description: newDescription || undefined,
        permissionIds: [],
      });
      toast.success("Role created");
      setNewName("");
      setNewDescription("");
      setShowCreate(false);
      setSelectedId(res?.data?.data?.id || null);
      await reload();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to create role"));
    } finally {
      setCreating(false);
    }
  };

  const remove = async () => {
    if (!selected || selected.is_system) return;
    const ok = await confirmModal({
      title: "Delete role",
      message: `Delete role ${selected.name}?`,
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await BaseApi.delete(`${API}/admin/roles/${selected.id}`);
      toast.success("Role deleted");
      setSelectedId(null);
      await reload();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to delete role"));
    }
  };

  const grouped = useMemo(() => groupPermissions(permissions), [permissions]);

  if (loading && !roles.length) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-3">
        <ul className="space-y-1.5">
          {roles.map((role) => (
            <li key={role.id}>
              <button
                type="button"
                onClick={() => setSelectedId(role.id)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${selectedId === role.id ? "border-[#0056d2] bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}
              >
                <span className="flex items-center gap-2 font-semibold text-slate-900">
                  {role.is_system && <Lock size={13} className="text-slate-400" />}
                  {role.name}
                </span>
                <span className="text-xs text-slate-500">
                  {role.permission_ids.length} perms · {role.user_count} users
                </span>
              </button>
            </li>
          ))}
        </ul>

        {showCreate ? (
          <form onSubmit={create} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
            <input
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ROLE_NAME"
              maxLength={40}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm uppercase"
            />
            <input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              maxLength={255}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="rounded-md bg-[#0056d2] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {creating ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Plus size={14} /> Add role
          </button>
        )}
      </aside>

      <section className="rounded-xl border border-slate-200 bg-white">
        {!selected ? (
          <p className="p-6 text-sm text-slate-500">Select a role to manage its permissions.</p>
        ) : (
          <>
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  {selected.name}
                  {selected.is_system && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                      Default role
                    </span>
                  )}
                </h2>
                {selected.description && (
                  <p className="text-sm text-slate-500">{selected.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                {!selected.is_system && (
                  <button
                    type="button"
                    onClick={remove}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={save}
                  disabled={!dirty || saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0056d2] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Save size={14} /> {saving ? "Saving…" : "Save permissions"}
                </button>
              </div>
            </header>

            <div className="space-y-5 p-5">
              {grouped.map(([group, items]) => (
                <div key={group}>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    {group}
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={draft.includes(permission.id)}
                          onChange={() => toggle(permission.id)}
                        />
                        <span>
                          <span className="block font-mono font-semibold text-slate-900">
                            {permission.name}
                          </span>
                          {permission.description && (
                            <span className="block text-xs text-slate-500">
                              {permission.description}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
