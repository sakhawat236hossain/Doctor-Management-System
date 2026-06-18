import { RoleGuard } from "@/components/shared/RoleGuard";
import { PatientDashboard } from "@/components/patient/PatientDashboard";

export default function PatientPage() {
  return (
    <RoleGuard allowedRoles={["patient"]}>
      <PatientDashboard />
    </RoleGuard>
  );
}
