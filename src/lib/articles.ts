import 'server-only'
import { db } from '@/lib/db'

/**
 * انتشار خودکار مقالات زمان‌بندی‌شده:
 * در هر بار خواندن لیست/جزئیات مقالات، مواردی که scheduledAt آن‌ها گذشته
 * و هنوز منتشر نشده‌اند، به‌صورت خودکار منتشر می‌شوند.
 * این سازوکار بدون نیاز به cron خارجی کار می‌کند (Lazy Publish).
 */
export async function publishDueScheduledArticles(): Promise<void> {
  try {
    await db.article.updateMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: new Date() },
      },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })
  } catch {
    // نباید نمایش سایت را مختل کند
  }
}

export interface PublishedArticleQuery {
  limit?: number
  categoryId?: string
  categorySlug?: string
  search?: string
  page?: number
  perPage?: number
  excludeId?: string
}

export async function getPublishedArticles(q: PublishedArticleQuery = {}) {
  await publishDueScheduledArticles()

  const { limit, categorySlug, search, page, perPage, excludeId } = q
  const where = {
    status: 'PUBLISHED' as const,
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(excludeId ? { id: { not: excludeId } } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { excerpt: { contains: search } },
            { content: { contains: search } },
            { tags: { some: { tag: { name: { contains: search } } } } },
          ],
        }
      : {}),
  }

  if (limit) {
    return db.article.findMany({
      where,
      include: { category: true, author: { select: { name: true } } },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    })
  }

  const per = perPage ?? 9
  const currentPage = Math.max(1, page ?? 1)
  const [items, total] = await Promise.all([
    db.article.findMany({
      where,
      include: { category: true, author: { select: { name: true } } },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip: (currentPage - 1) * per,
      take: per,
    }),
    db.article.count({ where }),
  ])

  return { items, total, page: currentPage, perPage: per, totalPages: Math.max(1, Math.ceil(total / per)) }
}

export async function getArticleBySlug(slug: string) {
  await publishDueScheduledArticles()

  return db.article.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      category: true,
      author: { select: { name: true } },
      tags: { include: { tag: true } },
    },
  })
}

export async function getPublishedPortfolio(limit?: number) {
  const query = {
    where: { isPublished: true },
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'desc' as const }],
    ...(limit ? { take: limit } : {}),
  }
  return db.portfolioItem.findMany(query)
}

export async function getCategories() {
  return db.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] })
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.siteSetting.findUnique({ where: { key } })
  return row?.value ?? null
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await db.siteSetting.findMany({ where: { key: { in: keys } } })
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}
