import { RoleGuard } from "@/components/shared/RoleGuard";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminDashboard />
    </RoleGuard>
  );
}
