import { requireRolePage } from "@/lib/requireRole";
import { PatientMobileNav } from "@/components/patient/PatientMobileNav";

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRolePage(["patient"]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 pb-16 md:pb-0">{children}</div>

      {/* Mobile Bottom Navigation */}
      <PatientMobileNav />
    </div>
  );
}
