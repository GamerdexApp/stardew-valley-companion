import type { MetadataRoute } from "next";

const siteUrl = "https://stardew-valley.gamerdex.app";

/** The landing page is the only public page. The tracker pages hold private data and ask not to be indexed. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteUrl, changeFrequency: "monthly", priority: 1 }];
}
