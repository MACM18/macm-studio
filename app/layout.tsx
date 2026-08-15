import type { Metadata } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://macm.lk"),
  title: "MACM — Bespoke software, precisely engineered",
  description:
    "Engineering-led web platforms, custom SaaS applications, and high-performance websites built for ambitious teams.",
  openGraph: {
    title: "MACM — Bespoke software, precisely engineered",
    description: "High-performance web platforms and custom software, scoped clearly and built to last.",
    url: "https://macm.lk",
    siteName: "MACM",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "MACM — Software built to move fast. Made to last." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MACM — Bespoke software, precisely engineered",
    description: "High-performance web platforms and custom software, scoped clearly and built to last.",
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
