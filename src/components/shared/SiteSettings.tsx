"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark" || theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-9 px-2 text-xs font-bold">
        বাংলা
      </Button>
    );
  }

  const toggleLocale = () => {
    const next: Locale = locale === "bn" ? "en" : "bn";
    setLocale(next);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-9 px-2 text-xs font-bold gap-1"
      onClick={toggleLocale}
      aria-label="Toggle language"
    >
      <Languages className="h-3.5 w-3.5" />
      <span className={locale === "bn" ? "font-bold" : "opacity-50"}>বাং</span>
      <span className="text-muted-foreground">|</span>
      <span className={locale === "en" ? "font-bold" : "opacity-50"}>EN</span>
    </Button>
  );
}

export function SiteSettings() {
  return (
    <div className="flex items-center gap-1">
      <LanguageSwitcher />
      <ThemeToggle />
    </div>
  );
}
