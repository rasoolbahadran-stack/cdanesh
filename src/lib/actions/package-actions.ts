'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import type { SimpleFormState } from '@/lib/actions/admin-actions'

const SERVICE_TYPES = ['web-design', 'e-commerce', 'uiux', 'seo', 'content-production', 'speed-optimization', 'ai-solutions', 'support', 'other']

const packageSchema = z.object({
  serviceType: z.string().refine((v) => SERVICE_TYPES.includes(v), 'نوع خدمت نامعتبر است.'),
  name: z.string().trim().min(2, 'نام پکیج حداقل ۲ حرف است.').max(80),
  slug: z
    .string()
    .trim()
    .max(60)
    .regex(/^[a-z0-9-]*$/, 'اسلاگ فقط حروف کوچک لاتین، عدد و خط تیره.')
    .optional(),
  audience: z.string().trim().max(300).optional(),
  features: z.string().max(3000).optional(),
  excluded: z.string().max(2000).optional(),
  duration: z.string().trim().max(120).optional(),
  support: z.string().trim().max(120).optional(),
  priceToman: z
    .string()
    .trim()
    .max(20)
    .regex(/^\d*$/, 'قیمت فقط عدد (تومان) — خالی یعنی «نیازمند برآورد».')
    .optional(),
  priceNote: z.string().trim().max(200).optional(),
  note: z.string().trim().max(300).optional(),
  marketBasis: z.string().trim().max(300).optional(),
  featured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
})

function linesToJson(raw: string): string {
  return JSON.stringify(
    raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 20)
  )
}

export async function savePackageAction(
  _prev: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  try {
    const admin = await requireRole('ADMIN')
    const parsed = packageSchema.safeParse({
      serviceType: String(formData.get('serviceType') ?? ''),
      name: String(formData.get('name') ?? ''),
      slug: String(formData.get('slug') ?? '').toLowerCase(),
      audience: String(formData.get('audience') ?? ''),
      features: String(formData.get('features') ?? ''),
      excluded: String(formData.get('excluded') ?? ''),
      duration: String(formData.get('duration') ?? ''),
      support: String(formData.get('support') ?? ''),
      priceToman: String(formData.get('priceToman') ?? ''),
      priceNote: String(formData.get('priceNote') ?? ''),
      note: String(formData.get('note') ?? ''),
      marketBasis: String(formData.get('marketBasis') ?? ''),
      featured: formData.get('featured') === 'on',
      isPublished: formData.get('isPublished') === 'on',
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'خطای اعتبارسنجی.' }

    const d = parsed.data
    const data = {
      serviceType: d.serviceType,
      name: d.name,
      slug: d.slug || null,
      audience: d.audience || null,
      features: linesToJson(d.features ?? ''),
      excluded: linesToJson(d.excluded ?? ''),
      duration: d.duration || null,
      support: d.support || null,
      // قیمت فقط در حالت «نهایی» منتشر می‌شود؛ مقدار ذخیره می‌شود ولی نمایش با pricingMode کنترل می‌شود
      priceToman: d.priceToman || null,
      priceNote: d.priceNote || null,
      note: d.note || null,
      marketBasis: d.marketBasis || null,
      featured: d.featured ?? false,
      isPublished: d.isPublished ?? false,
    }

    const id = String(formData.get('id') ?? '')
    if (id) {
      if (d.slug) {
        const clash = await db.package.findFirst({ where: { slug: d.slug, NOT: { id } } })
        if (clash) return { error: 'این اسلاگ برای پکیج دیگری استفاده شده است.' }
      }
      await db.package.update({ where: { id }, data })
      await logActivity({ userId: admin.id, action: 'package.update', entityType: 'Package', entityId: id, details: d.name })
    } else {
      if (d.slug && (await db.package.findUnique({ where: { slug: d.slug } }))) {
        return { error: 'این اسلاگ قبلاً استفاده شده است.' }
      }
      await db.package.create({ data })
      await logActivity({ userId: admin.id, action: 'package.create', entityType: 'Package', details: d.name })
    }

    revalidatePath('/admin/packages')
    revalidatePath('/')
    return { ok: true }
  } catch (err) {
    if (err instanceof Error && ['UNAUTHORIZED', 'FORBIDDEN'].includes(err.message)) return { error: 'دسترسی غیرمجاز.' }
    return { error: 'خطای غیرمنتظره.' }
  }
}

export async function togglePackagePublishAction(formData: FormData): Promise<void> {
  const admin = await requireRole('ADMIN')
  const id = String(formData.get('id') ?? '')
  const next = formData.get('next') === '1'
  if (!id) return
  await db.package.update({ where: { id }, data: { isPublished: next } })
  await logActivity({ userId: admin.id, action: 'package.toggle_publish', entityType: 'Package', entityId: id, details: next ? 'published' : 'draft' })
  revalidatePath('/admin/packages')
  revalidatePath('/')
}

export async function deletePackageAction(formData: FormData): Promise<void> {
  await requireRole('ADMIN')
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await db.package.delete({ where: { id } })
  await logActivity({ action: 'package.delete', entityType: 'Package', entityId: id })
  revalidatePath('/admin/packages')
  revalidatePath('/')
}
