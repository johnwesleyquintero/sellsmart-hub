import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://wesleyquintero.vercel.app";
  const posts = await import("@/data/blog.json").then((m) => m.default.posts);

  // Core pages
  const routes = ["", "/tools", "/blog", "/about", "/contact"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 1,
  }));

  // Blog posts
  const blogRoutes = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.id}`,
    lastModified: new Date(post.date),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...routes, ...blogRoutes];
}
