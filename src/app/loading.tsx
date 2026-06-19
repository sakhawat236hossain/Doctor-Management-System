"use client";

import { Activity, Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function Loading() {
  const t = useT();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <Activity className="h-8 w-8 animate-pulse text-primary" />
        <span className="text-2xl font-bold text-primary">MediFlow</span>
      </div>
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground dark:text-gray-400" />
      <p className="text-sm text-muted-foreground dark:text-gray-400">{t("common.loading")}</p>
      <div className="mt-4 w-64 space-y-3">
        <div className="h-4 animate-pulse rounded bg-muted dark:bg-slate-800" />
        <div className="h-4 animate-pulse rounded bg-muted dark:bg-slate-800 w-4/5" />
        <div className="h-4 animate-pulse rounded bg-muted dark:bg-slate-800 w-3/5" />
      </div>
    </div>
  );
}
