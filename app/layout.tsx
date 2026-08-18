import type { Metadata } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "./globals.css";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/components/language-provider";
import { LANGUAGE_COOKIE, localeFromCookie } from "@/lib/i18n";

export const metadata: Metadata = {
  metadataBase: new URL("https://macm.lk"),
  title: "Web Design & Web Development in Sri Lanka | MACM",
  description: "MACM creates thoughtful websites, WordPress builds, and web applications for Sri Lankan businesses and remote teams.",
  authors: [{ name: "MACM" }],
  creator: "MACM",
  publisher: "MACM",
  alternates: { canonical: "https://macm.lk" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "Web Design & Web Development in Sri Lanka | MACM",
    description: "Thoughtful websites, WordPress builds, and web applications for Sri Lankan businesses and remote teams.",
    url: "https://macm.lk",
    siteName: "MACM",
    locale: "en_LK",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "MACM — Websites that work. Built with care." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Web Design & Web Development in Sri Lanka | MACM",
    description: "Thoughtful websites, WordPress builds, and web applications for Sri Lankan businesses and remote teams.",
    images: ["/og.jpg"],
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = localeFromCookie((await cookies()).get(LANGUAGE_COOKIE)?.value);
  return (
    <html lang={locale} suppressHydrationWarning>
      <body><LanguageProvider initialLocale={locale}>{children}</LanguageProvider></body>
    </html>
  );
}
