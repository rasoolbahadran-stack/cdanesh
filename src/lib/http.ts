/* ==========================================================================
   کافه‌دانش — پاسخ‌های یکنواخت API + اعتبارسنجی + امن‌سازی HTML
   خروجی همهٔ عملیات نوشتن: {ok, error?, message?, data?}
   پیام خطا فارسی و قابل‌نمایش به مدیر است.
   ========================================================================== */
import { sanitizeHtmlHtml } from './html-sanitize';

export function ok(data: unknown = null, message = ''): Response {
  return new Response(JSON.stringify({ ok: true, message, data }), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export function fail(message: string, error = 'ERROR', status = 400): Response {
  return new Response(JSON.stringify({ ok: false, error, message }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export function unauthorized(message = 'برای این عملیات باید به پنل مدیریت وارد شوید'): Response {
  return fail(message, 'UNAUTHORIZED', 401);
}

export function serverError(e: unknown): Response {
  console.error('[API]', e);
  const message = process.env.NODE_ENV === 'development'
    ? ((e as Error)?.message || 'خطای غیرمنتظرهٔ سرور')
    : 'خطای داخلی سرور رخ داده است؛ لطفاً دوباره تلاش کنید.';
  return fail(message, 'SERVER_ERROR', 500);
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return (body && typeof body === 'object') ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/* ---------- اعتبارسنجی ---------- */
export function str(v: unknown, max = 500): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export function num(v: unknown, fallback = 0): number {
  /* نکتهٔ حیاتی: Number(null) و Number('') در جاوااسکریپت ۰ می‌دهند نه NaN؛
     بدون این گارد، «مقدار پیش‌فرض» هرگز اعمال نمی‌شد و مثلاً فهرست ادمین بدون
     پارامتر limit با LIMIT 1 اجرا می‌شد (علت اصلی نمایش تک‌ردیفی بخش‌ها). */
  if (v === null || v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function bool(v: unknown, fallback = false): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') {
    if (v === 1) return true;
    if (v === 0) return false;
  }
  if (typeof v === 'string') {
    const value = v.trim().toLowerCase();
    if (['true', '1', 'on', 'yes', 't'].includes(value)) return true;
    if (['false', '0', 'off', 'no', 'f', ''].includes(value)) return false;
  }
  return fallback;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const PHONE_RE = /^0\d{9,10}$/;

export function slugify(input: string, fallback = 'item'): string {
  let s = String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[\u200c\s]+/g, '-')           // نیم‌فاصله و فاصله
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!s) s = `${fallback}-${Date.now().toString(36)}`;
  return s.slice(0, 80);
}

export function requireFields(obj: Record<string, unknown>, fields: { key: string; label: string; min?: number }[]): string | null {
  for (const f of fields) {
    const v = typeof obj[f.key] === 'string' ? (obj[f.key] as string).trim() : obj[f.key];
    const len = typeof v === 'string' ? v.length : (v == null ? 0 : 1);
    if (len === 0 || (f.min && len < f.min)) {
      return `«${f.label}» الزامی است${f.min ? ` (حداقل ${f.min} کاراکتر)` : ''}`;
    }
  }
  return null;
}

/* ---------- امن‌سازی HTML محتوای ویرایشگر ----------
   پیاده‌سازی پارسرمحور در src/lib/html-sanitize.ts؛ این تابع فقط نقطهٔ
   اتصال همهٔ مسیرهای نوشتن است (CRUD عمومی، مقاله‌ها، رسانه، …).
   تفاوت کلیدی با نسخهٔ Regex قبلی: تگ‌های فرم/دکمه به‌جای حذفِ «همراه با
   کل متن داخلشان»، باز می‌شوند (unwrap) و متن مقاله حفظ می‌شود. */
export function sanitizeHtml(html: string): string {
  return sanitizeHtmlHtml(html);
}

export function stripTags(html: string, max = 260): string {
  const s = String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return s.slice(0, max);
}
