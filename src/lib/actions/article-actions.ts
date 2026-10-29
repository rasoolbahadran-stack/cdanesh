'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getSessionUser, hasRole, getClientIp } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { slugify, estimateReadTime } from '@/lib/fa'

// ─── اعتبارسنجی مشترک ───────────────────────────────────────────

const articleSchema = z.object({
  title: z.string().trim().min(5, 'عنوان باید حداقل ۵ حرف باشد.').max(200),
  slug: z
    .string()
    .trim()
    .min(2, 'اسلاگ الزامی است.')
    .max(140)
    .regex(/^[a-z0-9\u0600-\u06FF-]+$/, 'اسلاگ فقط می‌تواند شامل حروف، عدد و خط تیره باشد.'),
  excerpt: z.string().trim().max(400).optional().default(''),
  content: z.string().min(20, 'محتوای مقاله بسیار کوتاه است.'),
  categoryId: z.string().optional().nullable(),
  coverImage: z.string().max(400).optional().nullable(),
  coverAlt: z.string().max(300).optional().nullable(),
  metaTitle: z.string().trim().max(70).optional().nullable(),
  metaDescription: z.string().trim().max(170).optional().nullable(),
  canonicalUrl: z.string().trim().max(300).optional().nullable(),
  ogTitle: z.string().trim().max(100).optional().nullable(),
  ogDescription: z.string().trim().max(200).optional().nullable(),
  ogImage: z.string().trim().max(400).optional().nullable(),
  noindex: z.boolean().optional().default(false),
  relatedSlugs: z.array(z.string().trim().max(140)).max(5).optional().default([]),
  focusKeyword: z.string().trim().max(100).optional().nullable(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED']),
  scheduledAt: z.string().optional().nullable(),
  tagNames: z.array(z.string().trim().min(1).max(40)).max(8).optional().default([]),
})

export interface ArticleFormState {
  ok?: boolean
  error?: string
  fieldErrors?: Record<string, string>
  articleId?: string
}

async function requireAuthor() {
  const user = await getSessionUser()
  if (!user || !hasRole(user, 'AUTHOR')) throw new Error('UNAUTHORIZED')
  return user
}

async function upsertTags(tagNames: string[]): Promise<string[]> {
  const ids: string[] = []
  for (const name of tagNames) {
    const tag = await db.tag.upsert({
      where: { name },
      update: {},
      create: { name, slug: slugify(name) || `tag-${Date.now()}` },
    })
    ids.push(tag.id)
  }
  return ids
}

function parseScheduled(status: string, scheduledAt: string | null | undefined): Date | null {
  if (status === 'SCHEDULED' && scheduledAt) {
    const d = new Date(scheduledAt)
    if (!Number.isNaN(d.getTime()) && d.getTime() > Date.now()) return d
  }
  return null
}

// ─── ایجاد مقاله ────────────────────────────────────────────────

export async function createArticleAction(
  _prev: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  try {
    const user = await requireAuthor()
    const ip = await getClientIp()

    const raw = {
      title: String(formData.get('title') ?? ''),
      slug: String(formData.get('slug') ?? ''),
      excerpt: String(formData.get('excerpt') ?? ''),
      content: String(formData.get('content') ?? ''),
      categoryId: String(formData.get('categoryId') ?? '') || null,
      coverImage: String(formData.get('coverImage') ?? '') || null,
      coverAlt: String(formData.get('coverAlt') ?? '') || null,
      metaTitle: String(formData.get('metaTitle') ?? '') || null,
      metaDescription: String(formData.get('metaDescription') ?? '') || null,
      canonicalUrl: String(formData.get('canonicalUrl') ?? '') || null,
      ogTitle: String(formData.get('ogTitle') ?? '') || null,
      ogDescription: String(formData.get('ogDescription') ?? '') || null,
      ogImage: String(formData.get('ogImage') ?? '') || null,
      noindex: String(formData.get('noindex') ?? '') === '1',
      relatedSlugs: String(formData.get('relatedSlugs') ?? '')
        .split('،')
        .map((t) => t.trim())
        .filter(Boolean),
      focusKeyword: String(formData.get('focusKeyword') ?? '') || null,
      status: String(formData.get('status') ?? 'DRAFT'),
      scheduledAt: String(formData.get('scheduledAt') ?? '') || null,
      tagNames: String(formData.get('tagNames') ?? '')
        .split('،')
        .map((t) => t.trim())
        .filter(Boolean),
    }

    const parsed = articleSchema.safeParse(raw)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form')
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      return { error: 'فرم را بررسی کنید.', fieldErrors }
    }

    const data = parsed.data
    const exists = await db.article.findUnique({ where: { slug: data.slug } })
    if (exists) {
      return { error: 'این اسلاگ قبلاً استفاده شده است.', fieldErrors: { slug: 'اسلاگ تکراری است.' } }
    }

    const scheduled = parseScheduled(data.status, data.scheduledAt)
    const article = await db.article.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        content: data.content,
        categoryId: data.categoryId || null,
        coverImage: data.coverImage || null,
        coverAlt: data.coverAlt || null,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        canonicalUrl: data.canonicalUrl || null,
        ogTitle: data.ogTitle || null,
        ogDescription: data.ogDescription || null,
        ogImage: data.ogImage || null,
        noindex: data.noindex,
        relatedSlugs: JSON.stringify(data.relatedSlugs || []),
        focusKeyword: data.focusKeyword || null,
        status: data.status,
        readTime: estimateReadTime(data.content),
        authorId: user.id,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
        scheduledAt: scheduled,
        tags: {
          create: (await upsertTags(data.tagNames)).map((tagId) => ({ tagId })),
        },
      },
    })

    await logActivity({
      userId: user.id,
      action: 'article.create',
      entityType: 'Article',
      entityId: article.id,
      details: article.title,
      ip,
    })

    revalidatePath('/admin/articles')
    revalidatePath('/blog')
    revalidatePath('/')

    return { ok: true, articleId: article.id }
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return { error: 'دسترسی غیرمجاز؛ دوباره وارد شوید.' }
    }
    return { error: 'خطای غیرمنتظره؛ دوباره تلاش کنید.' }
  }
}

// ─── ویرایش مقاله (با ثبت نسخه و ذخیره خودکار) ──────────────────

export async function updateArticleAction(
  _prev: ArticleFormState,
  formData: FormData
): Promise<ArticleFormState> {
  try {
    const user = await requireAuthor()
    const ip = await getClientIp()

    const id = String(formData.get('id') ?? '')
    if (!id) return { error: 'شناسه مقاله نامعتبر است.' }

    const existing = await db.article.findUnique({ where: { id } })
    if (!existing) return { error: 'مقاله یافت نشد.' }

    const isAutosave = String(formData.get('autosave') ?? '') === '1'

    const raw = {
      title: String(formData.get('title') ?? ''),
      slug: String(formData.get('slug') ?? ''),
      excerpt: String(formData.get('excerpt') ?? ''),
      content: String(formData.get('content') ?? ''),
      categoryId: String(formData.get('categoryId') ?? '') || null,
      coverImage: String(formData.get('coverImage') ?? '') || null,
      coverAlt: String(formData.get('coverAlt') ?? '') || null,
      metaTitle: String(formData.get('metaTitle') ?? '') || null,
      metaDescription: String(formData.get('metaDescription') ?? '') || null,
      canonicalUrl: String(formData.get('canonicalUrl') ?? '') || null,
      ogTitle: String(formData.get('ogTitle') ?? '') || null,
      ogDescription: String(formData.get('ogDescription') ?? '') || null,
      ogImage: String(formData.get('ogImage') ?? '') || null,
      noindex: String(formData.get('noindex') ?? '') === '1',
      relatedSlugs: String(formData.get('relatedSlugs') ?? '')
        .split('،')
        .map((t) => t.trim())
        .filter(Boolean),
      focusKeyword: String(formData.get('focusKeyword') ?? '') || null,
      status: String(formData.get('status') ?? existing.status),
      scheduledAt: String(formData.get('scheduledAt') ?? '') || null,
      tagNames: String(formData.get('tagNames') ?? '')
        .split('،')
        .map((t) => t.trim())
        .filter(Boolean),
    }

    const parsed = articleSchema.safeParse(raw)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form')
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      return { error: isAutosave ? 'ذخیره خودکار ناموفق؛ فرم را بررسی کنید.' : 'فرم را بررسی کنید.', fieldErrors }
    }

    const data = parsed.data

    const slugTaken = await db.article.findFirst({ where: { slug: data.slug, id: { not: id } } })
    if (slugTaken) {
      return { error: 'اسلاگ تکراری است.', fieldErrors: { slug: 'این اسلاگ برای مقاله دیگری است.' } }
    }

    const contentChanged = existing.content !== data.content || existing.title !== data.title

    // ثبت نسخه قبل از تغییر (حداکثر ۲۰ نسخه اخیر)
    if (contentChanged && !isAutosave) {
      await db.articleRevision.create({
        data: {
          articleId: id,
          title: existing.title,
          content: existing.content,
          metaTitle: existing.metaTitle,
          metaDescription: existing.metaDescription,
          editedById: user.id,
        },
      })
      const revisions = await db.articleRevision.findMany({
        where: { articleId: id },
        orderBy: { createdAt: 'desc' },
        skip: 20,
      })
      if (revisions.length) {
        await db.articleRevision.deleteMany({
          where: { id: { in: revisions.map((r) => r.id) } },
        })
      }
    }

    const scheduled = parseScheduled(data.status, data.scheduledAt)
    const wasPublished = existing.status === 'PUBLISHED'

    await db.article.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        content: data.content,
        categoryId: data.categoryId || null,
        coverImage: data.coverImage || null,
        coverAlt: data.coverAlt || null,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        canonicalUrl: data.canonicalUrl || null,
        ogTitle: data.ogTitle || null,
        ogDescription: data.ogDescription || null,
        ogImage: data.ogImage || null,
        noindex: data.noindex,
        relatedSlugs: JSON.stringify(data.relatedSlugs || []),
        focusKeyword: data.focusKeyword || null,
        status: data.status,
        readTime: estimateReadTime(data.content),
        // اگر اولین بار منتشر می‌شود، زمان انتشار ثبت شود
        publishedAt: data.status === 'PUBLISHED' ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
        scheduledAt: scheduled,
        tags: {
          deleteMany: {},
          create: (await upsertTags(data.tagNames)).map((tagId) => ({ tagId })),
        },
      },
    })

    await logActivity({
      userId: user.id,
      action: isAutosave ? 'article.autosave' : 'article.update',
      entityType: 'Article',
      entityId: id,
      details: `${data.title}${contentChanged && !isAutosave ? ' (نسخه ثبت شد)' : ''}${wasPublished ? '' : ` → ${data.status}`}`,
      ip,
    })

    revalidatePath('/admin/articles')
    revalidatePath(`/admin/articles/${id}`)
    revalidatePath('/blog')
    revalidatePath(`/blog/${data.slug}`)

    return { ok: true, articleId: id }
  } catch (err) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return { error: 'دسترسی غیرمجاز؛ دوباره وارد شوید.' }
    }
    return { error: 'خطای غیرمنتظره؛ دوباره تلاش کنید.' }
  }
}

// ─── انتشار/بازگردانی سریع ──────────────────────────────────────

export async function setArticleStatusAction(formData: FormData): Promise<void> {
  const user = await requireAuthor()
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')

  if (!id || !['DRAFT', 'PUBLISHED'].includes(status)) return

  const article = await db.article.findUnique({ where: { id } })
  if (!article) return

  await db.article.update({
    where: { id },
    data: {
      status,
      publishedAt: status === 'PUBLISHED' ? (article.publishedAt ?? new Date()) : article.publishedAt,
      scheduledAt: null,
    },
  })

  await logActivity({
    userId: user.id,
    action: 'article.status',
    entityType: 'Article',
    entityId: id,
    details: `${article.title} → ${status}`,
  })

  revalidatePath('/admin/articles')
  revalidatePath('/blog')
}

export async function deleteArticleAction(formData: FormData): Promise<void> {
  const user = await requireAuthor()
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const article = await db.article.findUnique({ where: { id } })
  if (!article) return

  await db.article.delete({ where: { id } })

  await logActivity({
    userId: user.id,
    action: 'article.delete',
    entityType: 'Article',
    entityId: id,
    details: article.title,
  })

  revalidatePath('/admin/articles')
  revalidatePath('/blog')
}

// ─── بازگردانی نسخه قبلی ────────────────────────────────────────

export async function revertRevisionAction(formData: FormData): Promise<void> {
  const user = await requireAuthor()
  const revisionId = String(formData.get('revisionId') ?? '')
  if (!revisionId) return

  const revision = await db.articleRevision.findUnique({
    where: { id: revisionId },
    include: { article: true },
  })
  if (!revision) return

  // نسخه فعلی قبل از بازگردانی ذخیره می‌شود
  await db.articleRevision.create({
    data: {
      articleId: revision.articleId,
      title: revision.article.title,
      content: revision.article.content,
      metaTitle: revision.article.metaTitle,
      metaDescription: revision.article.metaDescription,
      editedById: user.id,
    },
  })

  await db.article.update({
    where: { id: revision.articleId },
    data: {
      title: revision.title,
      content: revision.content,
      metaTitle: revision.metaTitle,
      metaDescription: revision.metaDescription,
      readTime: estimateReadTime(revision.content),
    },
  })

  await logActivity({
    userId: user.id,
    action: 'article.revert',
    entityType: 'Article',
    entityId: revision.articleId,
    details: `بازگردانی نسخه ${revision.createdAt.toISOString()}`,
  })

  revalidatePath(`/admin/articles/${revision.articleId}`)
  revalidatePath('/blog')
}
