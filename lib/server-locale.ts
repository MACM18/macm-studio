import { cookies } from "next/headers";
import { LANGUAGE_COOKIE, localeFromCookie } from "@/lib/i18n";

export async function getServerLocale() {
  return localeFromCookie((await cookies()).get(LANGUAGE_COOKIE)?.value);
}
