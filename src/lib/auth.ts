import 'server-only'
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import type { Role } from '@prisma/client'

export const SESSION_COOKIE = 'cdanesh_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const MAX_FAILED_ATTEMPTS = 5
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000

// ─── هش رمز عبور (scrypt با نمک تصادفی) ─────────────────────────

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(':')
    if (!salt || !hash) return false
    const candidate = scryptSync(password, salt, 64)
    const expected = Buffer.from(hash, 'hex')
    return candidate.length === expected.length && timingSafeEqual(candidate, expected)
  } catch {
    return false
  }
}

// ─── نشست‌ها ─────────────────────────────────────────────────────

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(48).toString('base64url')
  const hdrs = await headers()

  await db.session.create({
    data: {
      token: createHash('sha256').update(token).digest('hex'),
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      userAgent: hdrs.get('user-agent')?.slice(0, 300) ?? null,
      ip: getClientIpFromHeaders(hdrs),
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS / 1000,
    path: '/',
  })

  // پاک‌سازی نشست‌های منقضی
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } })

  return token
}

export interface SessionUser {
  id: string
  username: string
  name: string
  email: string | null
  role: Role
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null

    const hashed = createHash('sha256').update(token).digest('hex')
    const session = await db.session.findUnique({
      where: { token: hashed },
      include: { user: true },
    })

    if (!session) return null
    if (session.expiresAt < new Date()) {
      await db.session.delete({ where: { id: session.id } }).catch(() => {})
      return null
    }
    if (!session.user.isActive) return null

    return {
      id: session.user.id,
      username: session.user.username,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    }
  } catch {
    return null
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    const hashed = createHash('sha256').update(token).digest('hex')
    await db.session.deleteMany({ where: { token: hashed } }).catch(() => {})
  }
  cookieStore.delete(SESSION_COOKIE)
}

// ─── کنترل دسترسی بر اساس نقش ───────────────────────────────────

const ROLE_RANK: Record<Role, number> = { AUTHOR: 1, EDITOR: 2, ADMIN: 3 }

export function hasRole(user: SessionUser | null, min: Role): boolean {
  if (!user) return false
  return ROLE_RANK[user.role] >= ROLE_RANK[min]
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}

export async function requireRole(min: Role): Promise<SessionUser> {
  const user = await requireUser()
  if (!hasRole(user, min)) throw new Error('FORBIDDEN')
  return user
}

// ─── محدودسازی تلاش ورود ────────────────────────────────────────

export async function isLoginBlocked(ip: string): Promise<boolean> {
  const since = new Date(Date.now() - ATTEMPT_WINDOW_MS)
  const failed = await db.loginAttempt.count({
    where: { ip, success: false, createdAt: { gt: since } },
  })
  return failed >= MAX_FAILED_ATTEMPTS
}

export async function recordLoginAttempt(ip: string, username: string, success: boolean): Promise<void> {
  await db.loginAttempt.create({ data: { ip, username, success } })
}

export async function clearLoginAttempts(ip: string, username: string): Promise<void> {
  await db.loginAttempt.deleteMany({ where: { ip, username } })
}

// ─── ابزار IP ───────────────────────────────────────────────────

export function getClientIpFromHeaders(hdrs: Headers): string {
  return (
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    hdrs.get('x-real-ip') ||
    'unknown'
  )
}

export async function getClientIp(): Promise<string> {
  const hdrs = await headers()
  return getClientIpFromHeaders(hdrs)
}
