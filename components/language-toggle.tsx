"use client";

import { useLanguage } from "@/components/language-provider";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLanguage();
  return <div className={`language-toggle${compact ? " compact" : ""}`} role="group" aria-label={t("language.switch")}>
    <button type="button" className={locale === "en" ? "active" : ""} aria-pressed={locale === "en"} onClick={() => setLocale("en")}>EN</button>
    <button type="button" className={locale === "si" ? "active" : ""} aria-pressed={locale === "si"} onClick={() => setLocale("si")}>සිංහල</button>
  </div>;
}
