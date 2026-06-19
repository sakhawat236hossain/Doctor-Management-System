"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();

  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background dark:bg-slate-900 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 dark:bg-red-900/30">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground dark:text-white">{t("errors.somethingWrong")}</h1>
        <p className="mt-2 text-sm text-muted-foreground dark:text-slate-400 max-w-md">
          {t("errors.unexpectedError")}
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground dark:text-slate-500 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <Button onClick={reset} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        {t("common.retry")}
      </Button>
    </div>
  );
}
