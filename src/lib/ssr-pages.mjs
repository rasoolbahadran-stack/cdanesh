/* ═══ کافه‌دانش — دادهٔ صفحات ابری برای رندر سمت سرور (SSR) ═══
   ۱) فهرست ابری (Vercel Blob / pages.json) — صفحات ساخته‌شده و ویرایش‌شده از پنل
   ۲) دادهٔ همراه پروژه (src/data/pages.json) — صفحات پایه مثل شرایط استفاده و حریم خصوصی
   خروجی: فهرست صفحات برای /p/<slug> ، /terms ، /privacy و sitemap */
import bundled from '../data/pages.json';

const PAGES_KEY = 'pages.json';

/* ایمن‌سازی بحرانی: همان سیاست ssr-articles — import تنبل کتابخانهٔ Blob +
   سقف زمانی ۴ ثانیه برای هر فراخوانی؛ هر خطا فقط یعنی دادهٔ ابری نمی‌آید،
   نه مرگ صفحه با 500. */
let _blobMod = null;
async function blobHead(key) {
  if (!_blobMod) _blobMod = await import('@vercel/blob');
  return _blobMod.head(key, { abortSignal: AbortSignal.timeout(4000) });
}

export async function readCloudPages() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const meta = await blobHead(PAGES_KEY);
    const r = await fetch(meta.url, { cache: 'no-store', signal: AbortSignal.timeout(4000) });
    if (!r.ok) return null;
    const data = await r.json();
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.pages) ? data.pages : null);
    return list;
  } catch (e) {
    return null;
  }
}

export function isPagePublic(p, now) {
  const t = now || Date.now();
  if (!p || !p.slug) return false;
  if (p.status === 'draft') return false;
  return true;
}

/* فهرست کامل (ابری بر پایه می‌نشیند)؛ برای پنل */
export async function getAllPages() {
  let cloud = null;
  try { cloud = await readCloudPages(); } catch { cloud = null; }
  const bySlug = new Map();
  for (const p of bundled) bySlug.set(p.slug, p);
  if (cloud) for (const p of cloud) if (p && p.slug) bySlug.set(p.slug, p);
  return [...bySlug.values()];
}

/* فقط صفحات عمومی — برای /p/<slug> و sitemap */
export async function getPublicPages(now) {
  const all = await getAllPages();
  return all.filter(p => isPagePublic(p, now));
}

export function pageBySlug(list, slug) {
  return (list || []).find(p => p.slug === slug) || null;
}

/* اسلاگ‌های رزروشدهٔ مسیرهای استاتیک سایت — برای جلوگیری از تداخل در /p/<slug> */
export const RESERVED_SLUGS = new Set([
  'blog', 'article', 'admin', 'admin-login', 'api', 'assets', 'p',
]);
