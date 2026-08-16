import type { Metadata } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://macm.lk"),
  title: "MACM — Websites and web development, built with care",
  description:
    "Web design, web development, and custom web applications built around ambitious teams.",
  openGraph: {
    title: "MACM — Websites and web development, built with care",
    description: "Websites and custom web applications, scoped clearly and built with care.",
    url: "https://macm.lk",
    siteName: "MACM",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "MACM — Websites that work. Built with care." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MACM — Websites and web development, built with care",
    description: "Websites and custom web applications, scoped clearly and built with care.",
    images: ["/og.jpg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
