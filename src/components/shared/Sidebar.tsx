"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const links = NAV_LINKS[user.role as UserRole] || [];

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/30 md:block">
      <nav className="flex flex-col gap-1 p-4">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
