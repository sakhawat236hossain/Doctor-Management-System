"use client";

import Link from "next/link";
import { Home, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export default function NotFound() {
  const t = useT();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background dark:bg-slate-900 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted dark:bg-slate-800">
        <FileQuestion className="h-8 w-8 text-muted-foreground dark:text-slate-400" />
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground dark:text-white">৪০৪</h1>
        <h2 className="mt-2 text-xl font-semibold text-foreground dark:text-white">
          {t("errors.pageNotFound")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground dark:text-slate-400 max-w-md">
          {t("errors.pageNotFoundDesc")}
        </p>
      </div>
      <Button asChild className="gap-2">
        <Link href="/">
          <Home className="h-4 w-4" />
          {t("errors.backToHome")}
        </Link>
      </Button>
    </div>
  );
}
