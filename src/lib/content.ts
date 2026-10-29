import 'server-only'
import { db } from '@/lib/db'
import { parseSource, type Block } from '@/lib/blocks'

/** مقاله «قابل نمایش عمومی» = منتشرشده یا زمان‌بندی‌شده‌ای که زمانش رسیده */
function visibleWhere() {
  const now = new Date()
  return {
    OR: [
      { status: 'PUBLISHED' as const, publishedAt: { lte: now } },
      { status: 'SCHEDULED' as const, scheduledAt: { lte: now } },
    ],
  }
}

export interface ArticleListItem {
  id: string
  slug: string
  title: string
  excerpt: string | null
  coverImage: string | null
  coverAlt: string | null
  readTime: number
  publishedAt: Date | null
  category: { name: string; slug: string } | null
}

const listSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverImage: true,
  coverAlt: true,
  readTime: true,
  publishedAt: true,
  category: { select: { name: true, slug: true } },
} as const

export async function getPublishedArticles(opts: {
  page?: number
  perPage?: number
  catSlug?: string
  tagSlug?: string
  q?: string
}): Promise<{ items: ArticleListItem[]; total: number; page: number; perPage: number; pages: number }> {
  const page = Math.max(1, opts.page || 1)
  const perPage = opts.perPage || 9

  const where: Record<string, unknown> = { ...visibleWhere() }
  if (opts.catSlug) where.category = { slug: opts.catSlug }
  if (opts.tagSlug) where.tags = { some: { tag: { slug: opts.tagSlug } } }
  if (opts.q) {
    where.OR = [
      { title: { contains: opts.q } },
      { excerpt: { contains: opts.q } },
      { slug: { contains: opts.q } },
    ]
  }

  const [items, total] = await Promise.all([
    db.article.findMany({
      where,
      select: listSelect,
      orderBy: [{ publishedAt: 'desc' }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.article.count({ where }),
  ])

  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) }
}

export async function getLatestArticles(n = 3): Promise<ArticleListItem[]> {
  return db.article.findMany({
    where: visibleWhere(),
    select: listSelect,
    orderBy: [{ publishedAt: 'desc' }],
    take: n,
  })
}

export async function getCategories() {
  return db.category.findMany({ orderBy: { sortOrder: 'asc' } })
}

export interface FullArticle {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  coverImage: string | null
  coverAlt: string | null
  metaTitle: string | null
  metaDescription: string | null
  canonicalUrl: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
  noindex: boolean
  readTime: number
  publishedAt: Date | null
  updatedAt: Date
  category: { name: string; slug: string } | null
  author: { name: string }
  tags: { tag: { name: string; slug: string } }[]
  relatedSlugs: string
}

export async function getArticleBySlug(slug: string): Promise<FullArticle | null> {
  const a = await db.article.findFirst({
    where: { slug, ...visibleWhere() },
    include: {
      category: { select: { name: true, slug: true } },
      author: { select: { name: true } },
      tags: { include: { tag: { select: { name: true, slug: true } } } },
    },
  })
  return (a as FullArticle) || null
}

export async function getRelatedArticles(article: FullArticle, n = 3): Promise<ArticleListItem[]> {
  let slugs: string[] = []
  try {
    slugs = JSON.parse(article.relatedSlugs || '[]')
  } catch {
    slugs = []
  }

  if (slugs.length) {
    const items = await db.article.findMany({
      where: { slug: { in: slugs }, ...visibleWhere() },
      select: listSelect,
      take: n,
    })
    if (items.length) return items
  }

  // جایگزین: مقالات هم‌دسته
  return db.article.findMany({
    where: { ...visibleWhere(), id: { not: article.id }, categoryId: article.category?.name ? undefined : undefined, category: article.category ? { slug: article.category.slug } : undefined },
    select: listSelect,
    orderBy: { publishedAt: 'desc' },
    take: n,
  })
}

export function parseArticleContent(content: string): Block[] {
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) return parsed as Block[]
  } catch {
    // فرمت JSON نیست → متن خط‌محور پنل
  }
  return parseSource(content)
}

export async function getFaqForPage(pageKey: string): Promise<{ q: string; a: string }[]> {
  const rows = await db.faq.findMany({
    where: { pageKey, isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
  return rows.map((r) => ({ q: r.question, a: r.answer }))
}

export async function getPortfolioItems(opts: { onlyHome?: boolean; limit?: number } = {}) {
  const where: Record<string, unknown> = { isPublished: true }
  if (opts.onlyHome) where.showOnHome = true
  const items = await db.portfolioItem.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  })
  const parsed = items.map((p) => ({
    ...p,
    chips: safeArr(p.chips),
  }))
  return opts.limit ? parsed.slice(0, opts.limit) : parsed
}

export async function getPortfolioBySlug(slug: string) {
  const p = await db.portfolioItem.findUnique({ where: { slug } })
  if (!p || !p.isPublished) return null
  let chips: string[] = []
  let sections: {
    h1?: string
    goal?: string[]
    points?: string[]
    specs?: [string, string][]
    features?: [string, string][]
  } = {}
  try {
    chips = JSON.parse(p.chips || '[]')
  } catch {}
  try {
    sections = JSON.parse(p.sections || '{}')
  } catch {}
  return { ...p, chips, sections }
}

function safeArr(json: string): string[] {
  try {
    const v = JSON.parse(json || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
