"use client";

import { Loader2 } from "lucide-react";
import { useT } from "@/lib/i18n";

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export function Loading({ message, fullScreen = false }: LoadingProps) {
  const t = useT();
  const displayMessage = message || t("common.loading");

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground dark:text-slate-400">{displayMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground dark:text-slate-400">{displayMessage}</p>
      </div>
    </div>
  );
}
"use client";

import { Loader2 } from "lucide-react";

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export function Loading({ message = "Loading...", fullScreen = false }: LoadingProps) {
  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
