import type { MetadataRoute } from "next";
import data from "../directory.json";

const baseUrl = "https://paidmcp.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/build`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/connect`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/submit`, changeFrequency: "weekly", priority: 0.7 },
  ];

  const listingPages: MetadataRoute.Sitemap = data.mcps.map((mcp) => ({
    url: `${baseUrl}/mcp/${mcp.id}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...listingPages];
}
