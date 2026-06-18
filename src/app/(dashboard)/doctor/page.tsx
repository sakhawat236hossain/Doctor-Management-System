import { RoleGuard } from "@/components/shared/RoleGuard";
import { DoctorDashboard } from "@/components/doctor/DoctorDashboard";

export default function DoctorPage() {
  return (
    <RoleGuard allowedRoles={["doctor"]}>
      <DoctorDashboard />
    </RoleGuard>
  );
}
