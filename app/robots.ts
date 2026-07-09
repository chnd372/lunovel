import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://lunovel.vercel.app/sitemap.xml",
    host: "https://lunovel.vercel.app",
  };
}
