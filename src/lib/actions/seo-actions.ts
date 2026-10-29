'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import type { SimpleFormState } from '@/lib/actions/admin-actions'

const redirectSchema = z.object({
  fromPath: z
    .string()
    .trim()
    .max(300)
    .regex(/^\/[^\s]*$/, 'مسیر مبدأ باید با / شروع شود (مثلاً /old-page).'),
  toPath: z
    .string()
    .trim()
    .max(300)
    .regex(/^\/[^\s]*$|^https?:\/\/[^\s]+$/, 'مقصد باید مسیر داخلی (با /) یا آدرس کامل باشد.'),
  statusCode: z.union([z.literal('301'), z.literal('302'), z.literal('307'), z.literal('308')]),
})

export async function createRedirectAction(
  _prev: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  try {
    await requireRole('EDITOR')
    const parsed = redirectSchema.safeParse({
      fromPath: String(formData.get('fromPath') ?? ''),
      toPath: String(formData.get('toPath') ?? ''),
      statusCode: String(formData.get('statusCode') ?? '301'),
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'خطای اعتبارسنجی.' }

    const exists = await db.redirect.findUnique({ where: { fromPath: parsed.data.fromPath } })
    if (exists) return { error: 'برای این مسیر قبلاً ریدایرکت ثبت شده است.' }

    await db.redirect.create({
      data: {
        fromPath: parsed.data.fromPath,
        toPath: parsed.data.toPath,
        statusCode: Number(parsed.data.statusCode),
        isActive: true,
      },
    })
    await logActivity({ action: 'redirect.create', entityType: 'Redirect', details: `${parsed.data.fromPath} → ${parsed.data.toPath}` })
    revalidatePath('/admin/seo')
    return { ok: true }
  } catch (err) {
    if (err instanceof Error && ['UNAUTHORIZED', 'FORBIDDEN'].includes(err.message)) return { error: 'دسترسی غیرمجاز.' }
    return { error: 'خطای غیرمنتظره.' }
  }
}

export async function toggleRedirectAction(formData: FormData): Promise<void> {
  await requireRole('EDITOR')
  const id = String(formData.get('id') ?? '')
  const next = formData.get('next') === '1'
  if (!id) return
  await db.redirect.update({ where: { id }, data: { isActive: next } })
  await logActivity({ action: 'redirect.toggle', entityType: 'Redirect', entityId: id, details: next ? 'active' : 'inactive' })
  revalidatePath('/admin/seo')
}

export async function deleteRedirectAction(formData: FormData): Promise<void> {
  await requireRole('EDITOR')
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await db.redirect.delete({ where: { id } })
  await logActivity({ action: 'redirect.delete', entityType: 'Redirect', entityId: id })
  revalidatePath('/admin/seo')
}
