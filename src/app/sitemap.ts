import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

// Update to the real domain when deployed
const siteUrl = "https://learnhub.example.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/courses`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/register`,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/login`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Every published course gets its own sitemap entry
  const courses = await db.course.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const coursePages: MetadataRoute.Sitemap = courses.map((course) => ({
    url: `${siteUrl}/courses/${course.slug}`,
    lastModified: course.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...coursePages];
}
