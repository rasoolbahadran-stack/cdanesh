/* ==========================================================================
   کافه‌دانش — احراز هویت ادمین سمت سرور
   ---------------------------------------------------------------------------
   (همان قرارداد پروژهٔ مرجع نوامارکیو):
   • رمز به‌صورت SHA-256 در متغیر محیطی ADMIN_PASSWORD_HASH (هرگز در کد/گیت)
   • نشست: کوکی HttpOnly امضاشده با HMAC-SHA256 (ADMIN_SESSION_SECRET)
   • requireAdmin در تمام مسیرهای نوشتن/حذف چک می‌شود؛ مخفی‌کردن دکمه در
     فرانت‌اند جایگزین احراز هویت سرور نیست.
   ========================================================================== */
import crypto from 'node:crypto';
import { envOr } from './env';

const COOKIE_NAME = 'cd_admin';
const SESSION_MS = 1000 * 60 * 60 * 12; // ۱۲ ساعت

function secret(): string {
  // سازگاری با پروژهٔ قدیمی: از راز محرمانهٔ موجود در Vercel استفاده می‌شود.
  // در صورت نبود کلید جدا، هیچ مقدار ثابت توسعه‌ای برای امضای نشست پذیرفته نیست.
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD_HASH || '';
}

export function sha256(s: string): string {
  return crypto.createHash('sha256').update(String(s), 'utf8').digest('hex');
}

function sign(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return body + '.' + mac;
}

function verify(token: string): { u: string; role: string; exp: number } | null {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 2) return null;
    const sessionSecret = secret();
    if (!sessionSecret) return null;
    const expect = crypto.createHmac('sha256', sessionSecret).update(parts[0]).digest('base64url');
    const a = Buffer.from(parts[1]);
    const b = Buffer.from(expect);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
      const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
      if (payload.exp && payload.exp < Date.now()) return null;
      return payload;
    }
  } catch {
    /* کوکی نامعتبر */
  }
  return null;
}

export function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  String(header || '')
    .split(';')
    .forEach((p) => {
      const i = p.indexOf('=');
      if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
    });
  return out;
}

export interface LoginResult {
  ok: boolean;
  error?: string;
  message?: string;
  cookie?: string;
}

export function login(username: string, password: string, secureRequest: boolean): LoginResult {
  const legacyPassword = process.env.ADMIN_PASSWORD || '';
  const expectedHash = process.env.ADMIN_PASSWORD_HASH || (legacyPassword ? sha256(legacyPassword) : '');
  if (!expectedHash) {
    return { ok: false, error: 'NO_ADMIN_CONFIG', message: 'ADMIN_PASSWORD_HASH یا ADMIN_PASSWORD در متغیرهای محیطی تنظیم نشده است' };
  }
  const u = String(username || '');
  const p = String(password || '');
  if (u.length > 64 || p.length > 128) {
    return { ok: false, error: 'BAD_CREDENTIALS', message: 'نام کاربری یا رمز عبور نادرست است' };
  }
  const expected = Buffer.from(expectedHash, 'hex');
  const actual = Buffer.from(sha256(p), 'hex');
  const passwordMatches = expected.length === 32 && actual.length === 32 && crypto.timingSafeEqual(actual, expected);
  if (u !== (process.env.ADMIN_USERNAME || 'admin') || !passwordMatches) {
    return { ok: false, error: 'BAD_CREDENTIALS', message: 'نام کاربری یا رمز عبور نادرست است' };
  }
  const payload = { u, role: 'admin', exp: Date.now() + SESSION_MS };
  const token = sign(payload);
  const secure = secureRequest ? '; Secure' : '';
  return {
    ok: true,
    cookie: `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${SESSION_MS / 1000}`,
  };
}

export function sessionFromCookies(header: string): { u: string; role: string; exp: number } | null {
  const c = parseCookies(header)[COOKIE_NAME];
  if (!c) return null;
  const payload = verify(c);
  return payload && payload.role === 'admin' ? payload : null;
}

export function logoutCookie(secureRequest: boolean): string {
  const secure = secureRequest ? '; Secure' : '';
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=0`;
}

export function isSecureRequest(request: Request): boolean {
  const proto = request.headers.get('x-forwarded-proto') || new URL(request.url).protocol.replace(':', '');
  return proto === 'https';
}

/* ---------- محدودسازی تلاش ورود (حافظهٔ محلی) ---------- */
const attempts = new Map<string, { count: number; reset: number }>();

export function loginThrottle(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || rec.reset < now) {
    attempts.set(ip, { count: 1, reset: now + 60_000 });
    return { allowed: true };
  }
  rec.count += 1;
  if (rec.count > 8) {
    return { allowed: false, retryAfter: Math.ceil((rec.reset - now) / 1000) };
  }
  return { allowed: true };
}

export function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local'
  );
}
