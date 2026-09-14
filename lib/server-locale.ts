import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

export async function getServerLocale(): Promise<Locale> {
  return DEFAULT_LOCALE;
}
