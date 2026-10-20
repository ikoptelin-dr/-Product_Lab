import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site.config";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ["", "/privacy", "/consent", "/legal"].map((p) => ({
    url: `${siteConfig.siteUrl}${p}`,
    lastModified: now,
    changeFrequency: p ? "yearly" : "monthly",
    priority: p ? 0.3 : 1,
  }));
}
