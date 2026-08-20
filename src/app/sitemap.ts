import { MetadataRoute } from 'next';
import { getDb } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = await getDb();

  const staticPages: MetadataRoute.Sitemap = [
    { url: 'https://trendforge.ai', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: 'https://trendforge.ai/search', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://trendforge.ai/tools', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ];

  const tools = db.prepare("SELECT slug, date_published, date_updated FROM tools WHERE status = 'published'").all() as { slug: string; date_published: string; date_updated: string }[];

  const toolPages: MetadataRoute.Sitemap = tools.map(tool => ({
    url: `https://trendforge.ai/tools/${tool.slug}`,
    lastModified: new Date(tool.date_updated || tool.date_published || new Date().toISOString()),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...toolPages];
}
