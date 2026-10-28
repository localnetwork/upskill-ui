import { PermissionsOverview } from "@/components/entities/admin/AdminAccessControl";
import AdminShell from "@/components/entities/admin/AdminShell";

export default function AdminPermissionsPage() {
  return (
    <AdminShell
      activeKey="permissions"
      description="All permissions defined on the platform and the roles that currently have them."
    >
      <PermissionsOverview />
    </AdminShell>
  );
}
