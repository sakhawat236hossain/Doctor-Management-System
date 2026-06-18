import { RoleGuard } from "@/components/shared/RoleGuard";
import { ReceptionistDashboard } from "@/components/receptionist/ReceptionistDashboard";

export default function ReceptionistPage() {
  return (
    <RoleGuard allowedRoles={["receptionist"]}>
      <ReceptionistDashboard />
    </RoleGuard>
  );
}
