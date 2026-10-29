import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { SITE } from '@/lib/site'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { path: '', priority: 1, changeFrequency: 'weekly' },
    { path: '/services/web-design', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/services/content-production', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/services/seo', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/ai-tools', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/portfolio', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/blog', priority: 0.8, changeFrequency: 'daily' },
    { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/request', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  ].map((p) => ({
    url: `${SITE.url}${p.path}`,
    lastModified: new Date(),
    changeFrequency: p.changeFrequency as MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: p.priority,
  }))

  let articles: MetadataRoute.Sitemap = []
  let categories: MetadataRoute.Sitemap = []

  try {
    const published = await db.article.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 500,
    })
    articles = published.map((a) => ({
      url: `${SITE.url}/blog/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    const cats = await db.category.findMany({ select: { slug: true, updatedAt: true } })
    categories = cats.map((c) => ({
      url: `${SITE.url}/blog?cat=${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.4,
    }))
  } catch {
    // دیتابیس در دسترس نبود؛ فقط صفحات ایستا
  }

  return [...staticPages, ...articles, ...categories]
}
