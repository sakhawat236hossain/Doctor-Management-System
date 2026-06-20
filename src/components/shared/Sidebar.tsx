"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

export function Sidebar() {
  const pathname = usePathname();
  const { session, role } = useAuth();
  const user = session?.user;
  const t = useT();

  if (!user || !role) return null;

  const links = NAV_LINKS[role as UserRole] || [];

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/30 dark:bg-slate-900 dark:border-slate-700 md:block">
      <nav className="flex flex-col gap-1 p-4">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href + link.labelKey}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              )}
            >
              {t(link.labelKey)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
