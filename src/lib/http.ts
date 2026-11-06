/* ==========================================================================
   کافه‌دانش — پاسخ‌های یکنواخت API + اعتبارسنجی + امن‌سازی HTML
   خروجی همهٔ عملیات نوشتن: {ok, error?, message?, data?}
   پیام خطا فارسی و قابل‌نمایش به مدیر است.
   ========================================================================== */

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
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function bool(v: unknown, fallback = false): boolean {
  if (typeof v === 'boolean') return v;
  if (v === 'true' || v === '1') return true;
  if (v === 'false' || v === '0') return false;
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
   فقط تگ‌های مجاز ویرایشگر نگه داشته می‌شوند؛ script/iframe/رویدادها حذف می‌شوند. */
const ALLOWED_TAGS = new Set([
  'p','br','hr','h2','h3','h4','strong','em','b','i','u','ul','ol','li','a','img',
  'blockquote','table','thead','tbody','tr','th','td','div','span','figure','figcaption',
]);
const URL_ATTRS = new Set(['href', 'src']);

export function sanitizeHtml(html: string): string {
  let out = String(html || '');
  out = out.replace(/<!--[\s\S]*?-->/g, '');
  out = out.replace(/<(script|style|iframe|object|embed|form|input|button|link|meta)[\s\S]*?<\/\1>/gi, '');
  out = out.replace(/<(script|style|iframe|object|embed|form|input|button|link|meta)[^>]*\/?>/gi, '');
  out = out.replace(/<([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^<>]*?)?)\/?>/g, (m, tag: string, attrs: string) => {
    const t = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(t)) return '';
    const safeAttrs: string[] = [];
    const attrRe = /([a-zA-Z-]+)\s*=\s*"([^"]*)"|([a-zA-Z-]+)\s*=\s*'([^']*)'/g;
    let am: RegExpExecArray | null;
    while ((am = attrRe.exec(attrs)) !== null) {
      const name = (am[1] || am[3] || '').toLowerCase();
      const value = am[2] ?? am[4] ?? '';
      if (name.startsWith('on')) continue;
      if (name === 'style') {
        if (/expression|javascript:/i.test(value)) continue;
        safeAttrs.push(`style="${value.replace(/"/g, '&quot;')}"`);
        continue;
      }
      if (URL_ATTRS.has(name)) {
        if (/^\s*(javascript|data(?!:image\/)|vbscript):/i.test(value)) continue;
        safeAttrs.push(`${name}="${value.replace(/"/g, '&quot;')}"`);
        continue;
      }
      if (name === 'target' || name === 'rel' || name === 'alt' || name === 'title' || name === 'class' || name === 'loading' || name === 'colspan' || name === 'rowspan') {
        safeAttrs.push(`${name}="${value.replace(/"/g, '&quot;')}"`);
      }
    }
    void m;
    return `<${t}${safeAttrs.length ? ' ' + safeAttrs.join(' ') : ''}>`;
  });
  return out;
}

export function stripTags(html: string, max = 260): string {
  const s = String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return s.slice(0, max);
}
