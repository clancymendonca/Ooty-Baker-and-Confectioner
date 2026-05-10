import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getSiteBaseUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = new URL(getSiteBaseUrl()).origin;

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${origin}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${origin}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${origin}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${origin}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const rows = await prisma.product.findMany({
      select: { variety: true },
      distinct: ["variety"],
      where: { variety: { not: null } },
    });
    const categories = rows
      .map((r) => r.variety)
      .filter((v): v is string => typeof v === "string" && v.length > 0);

    const productEntries: MetadataRoute.Sitemap = categories.map((variety) => ({
      url: `${origin}/products/${encodeURIComponent(variety)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticEntries, ...productEntries];
  } catch (error) {
    logger.warn("sitemap: skipping product URLs (database unavailable)", {
      detail: error instanceof Error ? error.message : String(error),
    });
    return staticEntries;
  }
}
