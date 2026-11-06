// احراز هویت پنل مدیریت — JWT امضاشده در کوکی httpOnly
import { SignJWT, jwtVerify } from 'jose';
import type { AstroCookies } from 'astro';

const COOKIE = 'cd_admin';
const ALG = 'HS256';

function secretKey(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET || 'cdanesh-dev-secret-change-me';
  return new TextEncoder().encode(secret);
}

export interface AdminSession {
  email: string;
  name: string;
}

export function verifyCredentials(email: string, password: string): AdminSession | null {
  const em = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const pw = process.env.ADMIN_PASSWORD || '';
  if (!em || !pw) return null;
  if (email.trim().toLowerCase() === em && password === pw) {
    return { email: em, name: 'مدیر کافه دانش' };
  }
  return null;
}

export async function createSession(cookies: AstroCookies, session: AdminSession) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey());
  cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession(cookies: AstroCookies) {
  cookies.delete(COOKIE, { path: '/' });
}

export async function getSession(cookies: AstroCookies): Promise<AdminSession | null> {
  const token = cookies.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.email !== 'string') return null;
    return { email: payload.email, name: String(payload.name ?? 'مدیر') };
  } catch {
    return null;
  }
}
