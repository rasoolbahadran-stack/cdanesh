/* ═══ کافه‌دانش — هستهٔ احراز هویت و اعتبارسنجی پنل ابری ═══
   این ماژول منطق مشترک api/login.mjs و api/articles.mjs است و
   عمداً «خالص» نوشته شده تا با تست واحد هم قابل بررسی باشد.
   رمز مدیر در متغیر محیطی ورسل نگهداری می‌شود و هرگز در کد عمومی نیست. */
import crypto from 'node:crypto';

export const COOKIE_NAME = 'cd_admin';
const DAY = 24 * 60 * 60 * 1000;

function secret() {
  // اگر ADMIN_SESSION_SECRET ست شده باشد از همان استفاده می‌شود؛
  // در غیر این صورت رمز مدیر «امضای» توکن است — یعنی با عوض‌کردن
  // رمز در ورسل، همهٔ نشست‌های قبلی خودبه‌خود باطل می‌شوند.
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
}

/* ─── توکن نشست: exp.hmac(exp) ─── */
export function signToken(ttlMs = 7 * DAY, now = Date.now()) {
  const exp = String(now + ttlMs);
  const sig = crypto.createHmac('sha256', secret()).update('cdanesh-admin:' + exp).digest('base64url');
  return exp + '.' + sig;
}

export function verifyToken(token, now = Date.now()) {
  if (!token || !secret()) return false;
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < now) return false;
  const want = crypto.createHmac('sha256', secret()).update('cdanesh-admin:' + exp).digest('base64url');
  const a = Buffer.from(sig), b = Buffer.from(want);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ─── کوکی ─── */
export function getCookie(req, name = COOKIE_NAME) {
  const raw = req.headers.cookie || '';
  const row = raw.split(/;\s*/).find(r => r.startsWith(name + '='));
  return row ? decodeURIComponent(row.slice(name.length + 1)) : '';
}

export function isAuthed(req, now = Date.now()) {
  return verifyToken(getCookie(req), now);
}

export function sessionCookie(token, maxAgeSec) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
}

export const clearCookie = () => sessionCookie('', 0);

/* ─── مقایسهٔ زمان‌ثابت (ضد timing attack) ─── */
export function safeEqual(a, b) {
  const ba = Buffer.from(String(a == null ? '' : a));
  const bb = Buffer.from(String(b == null ? '' : b));
  if (ba.length !== bb.length) {
    try { crypto.timingSafeEqual(ba, ba); } catch (e) { /* noop */ }
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

/* ─── محدودساز تلاش ورود (در حافظهٔ هر نمونهٔ سرور) ─── */
const FAIL_MS = 15 * 60 * 1000;
const fails = new Map();

export function failCount(ip, now = Date.now()) {
  const f = fails.get(ip);
  return f && now - f.at < FAIL_MS ? f.count : 0;
}

export function registerFail(ip, now = Date.now()) {
  const count = failCount(ip, now) + 1;
  fails.set(ip, { count, at: now });
  if (fails.size > 5000) {
    for (const [k, v] of fails) if (now - v.at > FAIL_MS) fails.delete(k);
  }
  return count;
}

export const clearFails = ip => fails.delete(ip);
export const MAX_FAILS = 5;

/* ─── اعتبارسنجی لیست مقالات ورودی (PUT) ───
   خروجی: null یعنی معتبر؛ در غیر این صورت پیام خطای فارسی */
export function validateArticles(list) {
  if (!Array.isArray(list)) return 'داده ارسالی یک فهرست نیست.';
  if (list.length > 300) return 'تعداد مقالات بیش از حد مجاز (۳۰۰) است.';
  const seen = new Set();
  for (const a of list) {
    if (!a || typeof a !== 'object' || Array.isArray(a)) return 'ساختار یکی از مقاله‌ها نامعتبر است.';
    if (typeof a.slug !== 'string' || !/^[a-zA-Z0-9\u0600-\u06FF-]{1,80}$/.test(a.slug)) {
      return 'اسلاگ نامعتبر است: ' + String(a.slug == null ? '—' : a.slug).slice(0, 40);
    }
    if (typeof a.title !== 'string' || !a.title.trim() || a.title.length > 300) {
      return 'عنوان مقاله با اسلاگ «' + a.slug + '» نامعتبر است.';
    }
    if (seen.has(a.slug)) return 'اسلاگ تکراری است: ' + a.slug;
    seen.add(a.slug);
    if (JSON.stringify(a).length > 200 * 1024) return 'حجم مقاله «' + a.slug + '» بیش از حد مجاز است.';
    if (a.status && !['published', 'draft', 'scheduled'].includes(a.status)) {
      return 'وضعیت نامعتبر برای مقاله «' + a.slug + '».';
    }
  }
  return null;
}

/* ─── فیلتر عمومی: حذف پیش‌نویس و زمان‌بندی‌شدهٔ نرسیده ─── */
export function isPublicNow(a, now = Date.now()) {
  if (!a || typeof a !== 'object') return false;
  if (a.status === 'draft') return false;
  if (a.status === 'scheduled') {
    if (!a.publishAt) return false;
    const t = new Date(a.publishAt).getTime();
    return Number.isFinite(t) && t <= now;
  }
  return true;
}

export function publicOnly(list, now = Date.now()) {
  return (Array.isArray(list) ? list : []).filter(a => isPublicNow(a, now));
}

/* ─── مرتب‌سازی استاندارد (جدیدترین اول) ─── */
export const sorted = list =>
  (Array.isArray(list) ? list.slice() : []).sort((x, y) => (y.sort || 0) - (x.sort || 0));

/* ─── پاسخ JSON کوتاه ─── */
export function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

/* ─── خواندن بدنهٔ JSON با سقف حجم ─── */
export function readJsonBody(req, limit = 3 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let d = '';
    req.on('data', c => {
      d += c;
      if (d.length > limit) { reject(new Error('BODY_TOO_LARGE')); req.destroy(); }
    });
    req.on('end', () => {
      if (!d) return resolve({});
      try { resolve(JSON.parse(d)); }
      catch (e) { reject(new Error('BAD_JSON')); }
    });
    req.on('error', reject);
  });
}

export function clientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}
