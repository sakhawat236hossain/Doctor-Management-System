import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import type { UserRole } from "@/types";

const ROLE_DASHBOARDS: Record<UserRole, string> = {
  admin: "/admin",
  doctor: "/doctor",
  receptionist: "/receptionist",
  patient: "/patient",
};

export default async function UnauthorizedPage() {
  const session = await auth();
  const role = session?.user?.role;
  const dashboardHref = role ? ROLE_DASHBOARDS[role] : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <ShieldX className="h-7 w-7 text-red-600" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
            এই পেজে আপনার প্রবেশাধিকার নেই
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground dark:text-slate-400">
            আপনি যে পেজে যেতে চেয়েছিলেন তা আপনার অ্যাকাউন্টের জন্য অনুমোদিত নয়।
            অনুগ্রহ করে নিজের ড্যাশবোর্ডে ফিরে যান।
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-3">
          {dashboardHref ? (
            <Button asChild>
              <Link href={dashboardHref}>নিজের ড্যাশবোর্ডে যান</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/">হোমে যান</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
