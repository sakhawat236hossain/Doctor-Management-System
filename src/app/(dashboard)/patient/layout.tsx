"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Search, User, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_LINKS = [
  { href: "/patient", label: "হোম", icon: LayoutDashboard },
  { href: "/patient/appointments", label: "অ্যাপয়েন্টমেন্ট", icon: Calendar },
  { href: "/patient/doctors", label: "ডাক্তার", icon: Search },
  { href: "/patient/profile", label: "প্রোফাইল", icon: User },
] as const;

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 pb-16 md:pb-0">{children}</div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
        <div className="flex items-center justify-around">
          {MOBILE_LINKS.map((link) => {
            const isActive =
              link.href === "/patient"
                ? pathname === "/patient"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors",
                  isActive
                    ? "text-blue-600"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <link.icon className="h-5 w-5" />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
