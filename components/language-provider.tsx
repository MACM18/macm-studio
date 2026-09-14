"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale, translate, type TranslationKey } from "@/lib/i18n";

type LanguageContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: TranslationKey) => string };
const LanguageContext = createContext<LanguageContextValue>({ locale: DEFAULT_LOCALE, setLocale: () => undefined, t: (key) => translate(DEFAULT_LOCALE, key) });

export function LanguageProvider({ children }: { children: ReactNode; initialLocale?: Locale }) {
  const value = useMemo(() => ({ locale: DEFAULT_LOCALE, setLocale: () => undefined, t: (key: TranslationKey) => translate(DEFAULT_LOCALE, key) }), []);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }

