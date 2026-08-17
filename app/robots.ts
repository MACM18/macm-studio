import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/sign-in", "/portal", "/admin"],
    },
    sitemap: "https://macm.lk/sitemap.xml",
  };
}
