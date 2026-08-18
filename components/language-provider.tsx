"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, LANGUAGE_COOKIE, normalizeLocale, type Locale, translate, type TranslationKey } from "@/lib/i18n";

type LanguageContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: TranslationKey) => string };
const LanguageContext = createContext<LanguageContextValue>({ locale: DEFAULT_LOCALE, setLocale: () => undefined, t: (key) => translate(DEFAULT_LOCALE, key) });

function readCookie() {
  const value = document.cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${LANGUAGE_COOKIE}=`))?.split("=")[1];
  return value ? normalizeLocale(value) : null;
}

export function LanguageProvider({ children, initialLocale = DEFAULT_LOCALE }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const selected = readCookie() || initialLocale;
    setLocaleState(selected);
    document.documentElement.lang = selected;
  }, [initialLocale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    document.cookie = `${LANGUAGE_COOKIE}=${next}; Path=/; SameSite=Lax`;
    document.documentElement.lang = next;
  };

  const value = useMemo(() => ({ locale, setLocale, t: (key: TranslationKey) => translate(locale, key) }), [locale]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }
