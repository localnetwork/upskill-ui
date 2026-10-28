import { RolesManager } from "@/components/entities/admin/AdminAccessControl";
import AdminShell from "@/components/entities/admin/AdminShell";

export default function AdminRolesPage() {
  return (
    <AdminShell
      activeKey="roles"
      description="Choose which permissions each role has. Default roles (admin, educator, learner) cannot be deleted."
    >
      <RolesManager />
    </AdminShell>
  );
}
