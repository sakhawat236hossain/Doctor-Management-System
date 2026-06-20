import { requireRolePage } from "@/lib/requireRole";
import { DoctorHeader } from "@/components/doctor/DoctorHeader";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRolePage(["doctor"]);
  const userName = session.user.name || "Doctor";

  return (
    <div className="space-y-4">
      {/* Doctor Header */}
      <DoctorHeader userName={userName} />

      {children}
    </div>
  );
}
