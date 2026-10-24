import { Check, Minus, X } from "lucide-react";

const KIND_STYLE = {
  Platform: "bg-purple-100 text-purple-700",
  Staff: "bg-emerald-100 text-emerald-700",
  Custom: "bg-slate-100 text-slate-700",
};

export function RoleCard({ role }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">{role.label}</h3>
          <p className="font-mono text-[11px] text-slate-400">{role.name}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${KIND_STYLE[role.kind] || KIND_STYLE.Custom}`}
        >
          {role.kind}
        </span>
      </div>
      {role.summary ? <p className="mt-2 text-sm text-slate-600">{role.summary}</p> : null}

      {role.access?.length ? (
        <div className="mt-3">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Can access</p>
          <ul className="space-y-1">
            {role.access.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-slate-700">
                <Check size={14} className="mt-0.5 shrink-0 text-emerald-600" /> {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {role.restrictions?.length ? (
        <div className="mt-3">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Cannot do</p>
          <ul className="space-y-1">
            {role.restrictions.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-slate-700">
                <Minus size={14} className="mt-0.5 shrink-0 text-error" /> {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {role.permissions?.length ? (
        <div className="mt-3">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
            Permissions ({role.permissions.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {role.permissions.map((permission) => (
              <span
                key={permission.name}
                title={permission.description}
                className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600"
              >
                {permission.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-xs text-slate-400">
        {role.user_count} {role.user_count === 1 ? "user" : "users"} assigned
      </p>
    </div>
  );
}

export default function AdminRolesGuide({ roles, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col rounded-xl bg-slate-50 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold">Roles &amp; access</h2>
            <p className="text-xs text-slate-500">
              What each role can access. Staff roles open the Employee Dashboard based on their permissions.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-4 overflow-y-auto p-5 md:grid-cols-2">
          {roles.length ? (
            roles.map((role) => <RoleCard key={role.id} role={role} />)
          ) : (
            <p className="text-sm text-slate-500">No roles found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
