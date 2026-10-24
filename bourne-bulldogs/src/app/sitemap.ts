import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: Array<[string, number]> = [
    ["/", 1],
    ["/about", 0.8],
    ["/club-overview", 0.8],
    ["/join", 0.9],
    ["/merch", 0.7],
    ["/contact", 0.7],
  ];
  const now = new Date();
  return routes.map(([path, priority]) => ({ url: `${SITE_URL}${path === "/" ? "" : path}`, lastModified: now, changeFrequency: "monthly", priority }));
}
