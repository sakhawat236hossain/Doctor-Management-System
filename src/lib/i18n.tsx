"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import bn from "@/locales/bn.json";
import en from "@/locales/en.json";

type Locale = "bn" | "en";
type TranslationData = typeof bn;

const translations: Record<Locale, TranslationData> = { bn, en };

const STORAGE_KEY = "mediflow-language";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "bn",
  setLocale: () => {},
  t: (key: string) => key,
});

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("bn");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "en" || stored === "bn") {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let value = getNestedValue(translations[locale] as unknown as Record<string, unknown>, key);
      if (!value) {
        // Fallback: try other locale
        value = getNestedValue(
          translations[locale === "bn" ? "en" : "bn"] as unknown as Record<string, unknown>,
          key
        );
      }
      if (!value) return key;

      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          value = value!.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramValue));
        });
      }

      return value;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useT() {
  const { t } = useI18n();
  return t;
}

export type { Locale };
