'use server'

import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import {
  createSession,
  destroySession,
  getSessionUser,
  isLoginBlocked,
  recordLoginAttempt,
  clearLoginAttempts,
  verifyPassword,
  hashPassword,
  getClientIp,
} from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { z } from 'zod'

export interface LoginState {
  error?: string
}

const loginSchema = z.object({
  username: z.string().trim().min(2).max(80),
  password: z.string().min(6).max(100),
})

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const ip = await getClientIp()
  const username = String(formData.get('username') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!username || !password) {
    return { error: 'نام کاربری و رمز عبور را وارد کنید.' }
  }

  const blocked = await isLoginBlocked(ip)
  if (blocked) {
    return { error: 'تلاش‌های ناموفق زیاد بوده است؛ ۱۵ دقیقه دیگر دوباره امتحان کنید.' }
  }

  const parsed = loginSchema.safeParse({ username, password })
  if (!parsed.success) {
    await recordLoginAttempt(ip, username, false)
    return { error: 'نام کاربری یا رمز عبور نامعتبر است.' }
  }

  const user = await db.user.findUnique({ where: { username: parsed.data.username } })

  if (!user || !user.isActive || !verifyPassword(parsed.data.password, user.passwordHash)) {
    await recordLoginAttempt(ip, username, false)
    return { error: 'نام کاربری یا رمز عبور اشتباه است.' }
  }

  await recordLoginAttempt(ip, username, true)
  await clearLoginAttempts(ip, username)
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
  await createSession(user.id)
  await logActivity({ userId: user.id, action: 'auth.login', ip })

  redirect('/admin')
}

export async function logoutAction(): Promise<void> {
  const user = await getSessionUser()
  if (user) {
    await logActivity({ userId: user.id, action: 'auth.logout' })
  }
  await destroySession()
  redirect('/admin/login')
}

const passwordSchema = z.object({
  current: z.string().min(6, 'رمز فعلی را وارد کنید.'),
  next: z
    .string()
    .min(8, 'رمز جدید باید حداقل ۸ کاراکتر باشد.')
    .max(100)
    .regex(/[a-zA-Z]/, 'رمز جدید باید حداقل یک حرف داشته باشد.')
    .regex(/\d/, 'رمز جدید باید حداقل یک رقم داشته باشد.'),
})

export interface ChangePasswordState {
  ok?: boolean
  error?: string
}

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const user = await getSessionUser()
  if (!user) return { error: 'ابتدا وارد شوید.' }

  const current = String(formData.get('current') ?? '')
  const next = String(formData.get('next') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (next !== confirm) {
    return { error: 'تکرار رمز جدید مطابقت ندارد.' }
  }

  const parsed = passwordSchema.safeParse({ current, next })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'رمز واردشده معتبر نیست.' }
  }

  const dbUser = await db.user.findUnique({ where: { id: user.id } })
  if (!dbUser || !verifyPassword(current, dbUser.passwordHash)) {
    return { error: 'رمز عبور فعلی اشتباه است.' }
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(next) },
  })

  // خروج از نشست‌های دیگر برای امنیت، سپس ایجاد نشست تازه
  await db.session.deleteMany({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
  })
  await createSession(user.id)
  await logActivity({ userId: user.id, action: 'auth.password_change' })

  return { ok: true }
}
