import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { jalaliDateTime } from '@/lib/fa'
import { ArticleEditor, type EditorArticle } from '@/components/admin/article-editor'

export const metadata: Metadata = { title: 'ویرایش مقاله', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

function parseRelatedSlugs(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
  } catch {
    return []
  }
}

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const article = await db.article.findUnique({
    where: { id },
    include: { tags: { include: { tag: true } } },
  })
  if (!article) notFound()

  const editorArticle: EditorArticle = {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    status: article.status,
    categoryId: article.categoryId,
    tagNames: article.tags.map((t) => t.tag.name),
    coverImage: article.coverImage,
    coverAlt: article.coverAlt,
    scheduledAt: article.scheduledAt ? article.scheduledAt.toISOString() : null,
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    canonicalUrl: article.canonicalUrl,
    ogTitle: article.ogTitle,
    ogDescription: article.ogDescription,
    ogImage: article.ogImage,
    noindex: article.noindex,
    relatedSlugs: parseRelatedSlugs(article.relatedSlugs),
    focusKeyword: article.focusKeyword,
  }

  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true },
  })

  return (
    <>
      <div className="adm-topbar">
        <div>
          <h1>ویرایش مقاله</h1>
          <p className="lead">
            آخرین به‌روزرسانی: {jalaliDateTime(article.updatedAt)}
            <span dir="ltr" style={{ marginRight: 10, color: 'var(--faint)', fontSize: 12.5 }}>
              /blog/{article.slug}
            </span>
          </p>
        </div>
        <div className="adm-actions">
          <Link className="btn btn-ghost btn-sm" href={`/blog/${article.slug}`} target="_blank" rel="noreferrer">
            مشاهده در سایت
          </Link>
          <Link className="btn btn-ghost btn-sm" href="/admin/articles">
            ← فهرست مقالات
          </Link>
        </div>
      </div>

      <ArticleEditor mode="edit" categories={categories} article={editorArticle} />
    </>
  )
}
