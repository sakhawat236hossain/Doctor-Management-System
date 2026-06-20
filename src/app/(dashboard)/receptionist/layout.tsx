import { requireRolePage } from "@/lib/requireRole";

export default async function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRolePage(["receptionist"]);

  return <>{children}</>;
}
