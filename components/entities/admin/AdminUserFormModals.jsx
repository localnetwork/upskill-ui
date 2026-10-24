import BaseApi from "@/lib/api/_base.api";
import { X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

function ModalShell({ title, onClose, onSubmit, saving, submitLabel, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={onSubmit}
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto p-5">{children}</div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

function StaffRolePicker({ staffRoles, value, onToggle }) {
  if (!staffRoles.length) {
    return <p className="text-xs text-slate-500">No staff roles available.</p>;
  }
  return (
    <div className="space-y-2">
      {staffRoles.map((role) => (
        <label
          key={role.id}
          className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50"
        >
          <input
            type="checkbox"
            className="mt-1"
            checked={value.includes(role.name)}
            onChange={() => onToggle(role.name)}
          />
          <span>
            <span className="block font-semibold text-slate-800">{role.label}</span>
            <span className="block text-xs text-slate-500">{role.summary || role.description}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

const toggleIn = (list, name) =>
  list.includes(name) ? list.filter((item) => item !== name) : [...list, name];

export function CreateUserModal({ staffRoles, onClose, onCreated }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    baseRole: "LEARNER",
  });
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [saving, setSaving] = useState(false);

  const setField = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await BaseApi.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        ...form,
        baseRole: form.baseRole === "NONE" ? undefined : form.baseRole,
        staffRoles: selectedStaff,
      });
      toast.success("User created");
      onCreated();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

  return (
    <ModalShell title="Add user" onClose={onClose} onSubmit={submit} saving={saving} submitLabel="Create user">
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-700">First name</span>
          <input className={inputClass} value={form.firstName} onChange={setField("firstName")} maxLength={80} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-semibold text-slate-700">Last name</span>
          <input className={inputClass} value={form.lastName} onChange={setField("lastName")} maxLength={80} />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-semibold text-slate-700">Username</span>
        <input className={inputClass} required minLength={3} maxLength={40} value={form.username} onChange={setField("username")} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-semibold text-slate-700">Email</span>
        <input className={inputClass} type="email" required value={form.email} onChange={setField("email")} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-semibold text-slate-700">Temporary password</span>
        <input
          className={inputClass}
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={form.password}
          onChange={setField("password")}
        />
        <span className="mt-1 block text-xs text-slate-500">
          Minimum 8 characters. Share it securely; the user should change it after signing in.
        </span>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-semibold text-slate-700">Account type</span>
        <select className={inputClass} value={form.baseRole} onChange={setField("baseRole")}>
          <option value="LEARNER">Learner</option>
          <option value="EDUCATOR">Educator</option>
          <option value="NONE">Staff only (no learner/educator role)</option>
        </select>
      </label>
      <div>
        <span className="mb-2 block text-sm font-semibold text-slate-700">Staff roles (optional)</span>
        <StaffRolePicker
          staffRoles={staffRoles}
          value={selectedStaff}
          onToggle={(name) => setSelectedStaff((list) => toggleIn(list, name))}
        />
      </div>
    </ModalShell>
  );
}

export function UserRolesModal({ user, staffRoles, onClose, onSaved }) {
  const staffNames = staffRoles.map((role) => role.name);
  const [selected, setSelected] = useState(
    (user.roles || []).map((r) => String(r).toUpperCase()).filter((r) => staffNames.includes(r)),
  );
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await BaseApi.put(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${user.id}/roles`, {
        roles: selected,
      });
      toast.success("Roles updated. The user must sign in again to apply them.");
      onSaved();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update roles");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title={`Staff roles: ${user.username || user.email}`}
      onClose={onClose}
      onSubmit={submit}
      saving={saving}
      submitLabel="Save roles"
    >
      <p className="text-xs text-slate-500">
        Learner, Educator and Admin roles are not changed here. Saving signs the user out so new permissions take effect.
      </p>
      <StaffRolePicker
        staffRoles={staffRoles}
        value={selected}
        onToggle={(name) => setSelected((list) => toggleIn(list, name))}
      />
    </ModalShell>
  );
}
