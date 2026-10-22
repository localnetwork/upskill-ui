import {
  AdminAccessNav,
  PermissionsOverview,
} from "@/components/entities/admin/AdminAccessControl";

export default function AdminPermissionsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-[2.25rem] font-extrabold tracking-tight text-on-surface">Permissions</h1>
      <p className="mb-6 mt-2 max-w-2xl text-on-surface-variant">
        All permissions defined on the platform and the roles that currently have them.
      </p>
      <AdminAccessNav active="permissions" />
      <PermissionsOverview />
    </div>
  );
}
