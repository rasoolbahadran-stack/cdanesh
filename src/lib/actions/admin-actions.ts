'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { unlink } from 'fs/promises'
import path from 'path'
import type { RequestStatus, Role } from '@prisma/client'
import { db } from '@/lib/db'
import { getSessionUser, hasRole, requireRole } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { slugify } from '@/lib/fa'

export interface SimpleFormState {
  ok?: boolean
  error?: string
}

// ─── دسته‌بندی‌ها ────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().trim().min(2, 'نام دسته حداقل ۲ حرف است.').max(60),
  description: z.string().trim().max(300).optional(),
})

export async function createCategoryAction(
  _prev: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  try {
    await requireRole('EDITOR')
    const parsed = categorySchema.safeParse({
      name: String(formData.get('name') ?? ''),
      description: String(formData.get('description') ?? '') || undefined,
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message }

    const baseSlug = slugify(parsed.data.name) || `cat-${Date.now()}`
    let slug = baseSlug
    let i = 1
    while (await db.category.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`
    }

    await db.category.create({
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description ?? null,
      },
    })

    await logActivity({ action: 'category.create', entityType: 'Category', details: parsed.data.name })
    revalidatePath('/admin/categories')
    revalidatePath('/blog')
    return { ok: true }
  } catch (err) {
    if (err instanceof Error && ['UNAUTHORIZED', 'FORBIDDEN'].includes(err.message)) return { error: 'دسترسی غیرمجاز.' }
    return { error: 'خطای غیرمنتظره.' }
  }
}

export async function updateCategoryAction(formData: FormData): Promise<void> {
  await requireRole('EDITOR')
  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  if (!id || name.length < 2) return
  await db.category.update({ where: { id }, data: { name } })
  await logActivity({ action: 'category.update', entityType: 'Category', entityId: id, details: name })
  revalidatePath('/admin/categories')
  revalidatePath('/blog')
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireRole('EDITOR')
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await db.category.delete({ where: { id } })
  await logActivity({ action: 'category.delete', entityType: 'Category', entityId: id })
  revalidatePath('/admin/categories')
  revalidatePath('/blog')
}

// ─── برچسب‌ها ────────────────────────────────────────────────────

export async function deleteTagAction(formData: FormData): Promise<void> {
  await requireRole('EDITOR')
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await db.tag.delete({ where: { id } })
  await logActivity({ action: 'tag.delete', entityType: 'Tag', entityId: id })
  revalidatePath('/admin/categories')
}

// ─── نمونه‌کارها ────────────────────────────────────────────────

const portfolioSchema = z.object({
  title: z.string().trim().min(3, 'عنوان حداقل ۳ حرف است.').max(120),
  category: z.string().trim().min(2, 'دسته‌بندی الزامی است.').max(60),
  description: z.string().trim().min(10, 'توضیح حداقل ۱۰ حرف است.').max(600),
  imageUrl: z.string().trim().min(1, 'تصویر الزامی است.').max(400),
  link: z.union([z.string().trim().url('لینک نامعتبر است.').max(300), z.literal('')]).optional(),
  isPublished: z.boolean().optional(),
})

export async function createPortfolioAction(
  _prev: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  try {
    await requireRole('EDITOR')
    const parsed = portfolioSchema.safeParse({
      title: String(formData.get('title') ?? ''),
      category: String(formData.get('category') ?? ''),
      description: String(formData.get('description') ?? ''),
      imageUrl: String(formData.get('imageUrl') ?? ''),
      link: String(formData.get('link') ?? ''),
      isPublished: formData.get('isPublished') === 'on',
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message }

    const baseSlug = slugify(parsed.data.title) || `item-${Date.now()}`
    let slug = baseSlug
    let i = 1
    while (await db.portfolioItem.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`
    }

    const maxOrder = await db.portfolioItem.aggregate({ _max: { sortOrder: true } })

    await db.portfolioItem.create({
      data: {
        title: parsed.data.title,
        slug,
        category: parsed.data.category,
        description: parsed.data.description,
        imageUrl: parsed.data.imageUrl,
        link: parsed.data.link || null,
        isPublished: parsed.data.isPublished ?? true,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    })

    await logActivity({ action: 'portfolio.create', entityType: 'PortfolioItem', details: parsed.data.title })
    revalidatePath('/admin/portfolio')
    revalidatePath('/portfolio')
    revalidatePath('/')
    return { ok: true }
  } catch (err) {
    if (err instanceof Error && ['UNAUTHORIZED', 'FORBIDDEN'].includes(err.message)) return { error: 'دسترسی غیرمجاز.' }
    return { error: 'خطای غیرمنتظره.' }
  }
}

export async function updatePortfolioAction(formData: FormData): Promise<void> {
  await requireRole('EDITOR')
  const id = String(formData.get('id') ?? '')
  if (!id) return
  const title = String(formData.get('title') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const imageUrl = String(formData.get('imageUrl') ?? '').trim()
  const link = String(formData.get('link') ?? '').trim()
  const isPublished = formData.get('isPublished') === 'on'
  if (title.length < 3 || category.length < 2 || description.length < 10 || !imageUrl) return

  await db.portfolioItem.update({
    where: { id },
    data: { title, category, description, imageUrl, link: link || null, isPublished },
  })
  await logActivity({ action: 'portfolio.update', entityType: 'PortfolioItem', entityId: id, details: title })
  revalidatePath('/admin/portfolio')
  revalidatePath('/portfolio')
  revalidatePath('/')
}

export async function deletePortfolioAction(formData: FormData): Promise<void> {
  await requireRole('EDITOR')
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await db.portfolioItem.delete({ where: { id } })
  await logActivity({ action: 'portfolio.delete', entityType: 'PortfolioItem', entityId: id })
  revalidatePath('/admin/portfolio')
  revalidatePath('/portfolio')
  revalidatePath('/')
}

// ─── درخواست‌های مشتریان ────────────────────────────────────────

export async function updateRequestAction(formData: FormData): Promise<void> {
  const user = await getSessionUser()
  if (!user || !hasRole(user, 'EDITOR')) return
  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  const adminNote = String(formData.get('adminNote') ?? '').slice(0, 1000)
  if (!id || !['NEW', 'IN_REVIEW', 'WAITING_REPLY', 'ACCEPTED', 'CLOSED'].includes(status)) return

  await db.serviceRequest.update({
    where: { id },
    data: { status: status as RequestStatus, ...(formData.has('adminNote') ? { adminNote } : {}) },
  })
  await logActivity({ userId: user.id, action: 'request.update', entityType: 'ServiceRequest', entityId: id, details: status })
  revalidatePath('/admin/requests')
}

export async function deleteRequestAction(formData: FormData): Promise<void> {
  await requireRole('ADMIN')
  const id = String(formData.get('id') ?? '')
  if (!id) return
  await db.serviceRequest.delete({ where: { id } })
  await logActivity({ action: 'request.delete', entityType: 'ServiceRequest', entityId: id })
  revalidatePath('/admin/requests')
}

// ─── رسانه‌ها ────────────────────────────────────────────────────

export async function updateMediaAltAction(formData: FormData): Promise<void> {
  const user = await getSessionUser()
  if (!user || !hasRole(user, 'AUTHOR')) return
  const id = String(formData.get('id') ?? '')
  const alt = String(formData.get('alt') ?? '').slice(0, 300)
  if (!id) return
  await db.media.update({ where: { id }, data: { alt: alt || null } })
  await logActivity({ userId: user.id, action: 'media.update_alt', entityType: 'Media', entityId: id })
  revalidatePath('/admin/media')
}

export async function deleteMediaAction(formData: FormData): Promise<void> {
  await requireRole('EDITOR')
  const id = String(formData.get('id') ?? '')
  if (!id) return
  const media = await db.media.findUnique({ where: { id } })
  if (!media) return

  // حذف فایل از دیسک (در صورت وجود)
  if (media.path.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), 'public', media.path)
    await unlink(filePath).catch(() => {})
  }
  await db.media.delete({ where: { id } })
  await logActivity({ action: 'media.delete', entityType: 'Media', entityId: id, details: media.originalName })
  revalidatePath('/admin/media')
}

// ─── کاربران ────────────────────────────────────────────────────

const userSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'نام کاربری حداقل ۳ حرف است.')
    .max(60)
    .regex(/^[a-zA-Z0-9._-]+$/, 'نام کاربری فقط حروف لاتین، عدد، نقطه و خط تیره.'),
  name: z.string().trim().min(2, 'نام الزامی است.').max(80),
  email: z.union([z.string().trim().email('ایمیل نامعتبر.'), z.literal('')]).optional(),
  role: z.enum(['ADMIN', 'EDITOR', 'AUTHOR']),
  password: z.string().min(8, 'رمز عبور حداقل ۸ کاراکتر.').max(100).regex(/[a-zA-Z]/, 'رمز باید حرف داشته باشد.').regex(/\d/, 'رمز باید رقم داشته باشد.'),
})

export async function createUserAction(
  _prev: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  try {
    const admin = await requireRole('ADMIN')
    const parsed = userSchema.safeParse({
      username: String(formData.get('username') ?? ''),
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      role: String(formData.get('role') ?? 'AUTHOR'),
      password: String(formData.get('password') ?? ''),
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message }

    const { hashPassword } = await import('@/lib/auth')
    const exists = await db.user.findUnique({ where: { username: parsed.data.username } })
    if (exists) return { error: 'این نام کاربری قبلاً ثبت شده است.' }

    await db.user.create({
      data: {
        username: parsed.data.username,
        name: parsed.data.name,
        email: parsed.data.email || null,
        role: parsed.data.role,
        passwordHash: hashPassword(parsed.data.password),
      },
    })

    await logActivity({
      userId: admin.id,
      action: 'user.create',
      entityType: 'User',
      details: `${parsed.data.username} (${parsed.data.role})`,
    })
    revalidatePath('/admin/users')
    return { ok: true }
  } catch (err) {
    if (err instanceof Error && ['UNAUTHORIZED', 'FORBIDDEN'].includes(err.message)) return { error: 'دسترسی غیرمجاز.' }
    return { error: 'خطای غیرمنتظره.' }
  }
}

export async function updateUserAction(formData: FormData): Promise<void> {
  const admin = await requireRole('ADMIN')
  const id = String(formData.get('id') ?? '')
  const role = String(formData.get('role') ?? '')
  const isActive = formData.get('isActive') === 'on'
  if (!id || !['ADMIN', 'EDITOR', 'AUTHOR'].includes(role)) return
  if (id === admin.id && (!isActive || role !== 'ADMIN')) return // جلوگیری از خودقفل‌کنی

  await db.user.update({ where: { id }, data: { role: role as Role, isActive } })
  if (!isActive) await db.session.deleteMany({ where: { userId: id } })
  await logActivity({ userId: admin.id, action: 'user.update', entityType: 'User', entityId: id, details: `${role} active=${isActive}` })
  revalidatePath('/admin/users')
}

export async function resetUserPasswordAction(formData: FormData): Promise<void> {
  const admin = await requireRole('ADMIN')
  const id = String(formData.get('id') ?? '')
  const password = String(formData.get('password') ?? '')
  if (!id || password.length < 8 || !/[a-zA-Z]/.test(password) || !/\d/.test(password)) return

  const { hashPassword } = await import('@/lib/auth')
  await db.user.update({ where: { id }, data: { passwordHash: hashPassword(password) } })
  await db.session.deleteMany({ where: { userId: id } })
  await logActivity({ userId: admin.id, action: 'user.reset_password', entityType: 'User', entityId: id })
  revalidatePath('/admin/users')
}

// ─── تنظیمات سایت ───────────────────────────────────────────────

const SETTING_KEYS = [
  'siteName',
  'siteTagline',
  'ownerName',
  'ownerTitle',
  'phone',
  'website',
  'email',
  'address',
  'defaultMetaTitle',
  'defaultMetaDescription',
  'ogImage',
  'pricingMode',
  'paymentGateway',
  'socials',
] as const

export async function saveSettingsAction(
  _prev: SimpleFormState,
  formData: FormData
): Promise<SimpleFormState> {
  try {
    await requireRole('ADMIN')
    for (const key of SETTING_KEYS) {
      const value = String(formData.get(key) ?? '').trim().slice(0, 500)
      await db.siteSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    }
    await logActivity({ action: 'settings.update' })
    revalidatePath('/admin/settings')
    revalidatePath('/')
    return { ok: true }
  } catch (err) {
    if (err instanceof Error && ['UNAUTHORIZED', 'FORBIDDEN'].includes(err.message)) return { error: 'دسترسی غیرمجاز.' }
    return { error: 'خطای غیرمنتظره.' }
  }
}
