import {
  AdminAccessNav,
  RolesManager,
} from "@/components/entities/admin/AdminAccessControl";

export default function AdminRolesPage() {
  return (
    <div className="container py-8">
      <h1 className="text-[2.25rem] font-extrabold tracking-tight text-on-surface">Roles</h1>
      <p className="mb-6 mt-2 max-w-2xl text-on-surface-variant">
        Choose which permissions each role has. Default roles (admin, educator, learner) cannot be deleted.
      </p>
      <AdminAccessNav active="roles" />
      <RolesManager />
    </div>
  );
}
