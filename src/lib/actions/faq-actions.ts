'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { logActivity } from '@/lib/activity'

export interface FaqFormState {
  ok?: boolean
  error?: string
}

/** کلیدهای صفحه‌ای که فرم افزودن سؤال برایشان فعال است (کلیدهای article: فقط خواندنی)
 *  توجه: فایل «use server» فقط می‌تواند تابع async صادر کند؛ این آرایه داخلی است. */
const FAQ_PAGE_KEYS = [
  'home',
  'web-design',
  'seo',
  'content-production',
  'ai-solutions',
  'speed-optimization',
  'uiux',
  'e-commerce',
  'support',
  'services',
  'request',
  'contact',
] as const

/** مسیرهای عمومی متناظر با هر pageKey برای revalidate */
const PAGE_KEY_PATHS: Record<string, string> = {
  home: '/',
  'web-design': '/services/web-design',
  seo: '/services/seo',
  'content-production': '/services/content-production',
  'ai-solutions': '/services/ai-solutions',
  'speed-optimization': '/services/speed-optimization',
  uiux: '/services/uiux',
  'e-commerce': '/services/e-commerce',
  support: '/services/support',
  services: '/services',
  request: '/request',
  contact: '/contact',
}

function isKnownPageKey(key: string): boolean {
  return (FAQ_PAGE_KEYS as readonly string[]).includes(key)
}

export async function upsertFaqAction(
  _prev: FaqFormState,
  formData: FormData
): Promise<FaqFormState> {
  try {
    await requireRole('EDITOR')

    const id = String(formData.get('id') ?? '').trim()
    const pageKey = String(formData.get('pageKey') ?? '').trim()
    const question = String(formData.get('question') ?? '').trim()
    const answer = String(formData.get('answer') ?? '').trim()
    const isActive = String(formData.get('isActive') ?? '1') === '1'
    const sortOrderRaw = Number(String(formData.get('sortOrder') ?? '0').trim())
    const sortOrder = Number.isFinite(sortOrderRaw)
      ? Math.max(0, Math.min(999, Math.trunc(sortOrderRaw)))
      : 0

    if (!pageKey || (!isKnownPageKey(pageKey) && !pageKey.startsWith('article:'))) {
      return { error: 'صفحه مقصد را انتخاب کنید.' }
    }
    if (question.length < 5) return { error: 'متن پرسش حداقل ۵ حرف باشد.' }
    if (answer.length < 10) return { error: 'متن پاسخ حداقل ۱۰ حرف باشد.' }

    let entityId = id
    if (id) {
      const existing = await db.faq.findUnique({ where: { id } })
      if (!existing) return { error: 'سؤال موردنظر یافت نشد.' }
      await db.faq.update({
        where: { id },
        data: { pageKey, question, answer, isActive, sortOrder },
      })
    } else {
      const created = await db.faq.create({
        data: { pageKey, question, answer, isActive, sortOrder },
      })
      entityId = created.id
    }

    await logActivity({
      action: 'faq.upsert',
      entityType: 'Faq',
      entityId,
      details: `${pageKey} — ${question.slice(0, 80)}`,
    })

    revalidatePath('/admin/faq')
    revalidatePath('/')
    const publicPath = PAGE_KEY_PATHS[pageKey]
    if (publicPath) revalidatePath(publicPath)
    if (pageKey === 'home' || !publicPath) revalidatePath('/faq')

    return { ok: true }
  } catch (err) {
    if (err instanceof Error && ['UNAUTHORIZED', 'FORBIDDEN'].includes(err.message)) {
      return { error: 'دسترسی غیرمجاز.' }
    }
    return { error: 'خطای غیرمنتظره در ذخیره سؤال.' }
  }
}

export async function toggleFaqAction(formData: FormData): Promise<void> {
  await requireRole('EDITOR')
  const id = String(formData.get('id') ?? '')
  const isActive = String(formData.get('isActive') ?? '') === '1'
  if (!id) return

  const existing = await db.faq.findUnique({ where: { id } })
  if (!existing) return

  await db.faq.update({ where: { id }, data: { isActive } })
  await logActivity({
    action: 'faq.toggle',
    entityType: 'Faq',
    entityId: id,
    details: `${existing.pageKey} — ${isActive ? 'فعال' : 'غیرفعال'}`,
  })
  revalidatePath('/admin/faq')
  revalidatePath('/')
}

export async function deleteFaqAction(formData: FormData): Promise<void> {
  await requireRole('EDITOR')
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const existing = await db.faq.findUnique({ where: { id } })
  if (!existing) return

  await db.faq.delete({ where: { id } })
  await logActivity({
    action: 'faq.delete',
    entityType: 'Faq',
    entityId: id,
    details: `${existing.pageKey} — ${existing.question.slice(0, 80)}`,
  })
  revalidatePath('/admin/faq')
  revalidatePath('/')
}
