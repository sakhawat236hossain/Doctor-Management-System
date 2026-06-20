import { RoleGuard } from "@/components/shared/RoleGuard";
import { requireRolePage } from "@/lib/requireRole";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRolePage(["admin"]);

  return <RoleGuard allowedRoles={["admin"]}>{children}</RoleGuard>;
}
