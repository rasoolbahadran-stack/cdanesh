/* ═══ کافه‌دانش CMS — صفحات ابری (دیتابیس Postgres / سازگاری Blob) ═══
   GET  /api/pages  → کل فهرست (فقط مدیر)
   PUT  /api/pages  {pages:[…]} → ذخیرهٔ کل فهرست (فقط مدیر)
   ساختار هر صفحه: {slug, eyebrow?, title, lead?, seoTitle, seoDesc,
                    status: 'published'|'draft', blocks, updated}
   داده در لایهٔ store.mjs نگهداری می‌شود (Postgres با DATABASE_URL، وگرنه Blob
   با کلید pages.json)؛ /p/<slug> و /terms و /privacy سمت سرور از همین داده رندر می‌شوند. */
import { readDoc, writeDoc, DB_MS } from '../lib/store.mjs';
import { isAuthedAsync, json, readJsonBody } from '../lib/admin-auth.mjs';

const DOC_KEY = 'pages.json';
const MAX_PAGES = 60;

/* اسلاگ رزروشده = مسیرهای استاتیک سایت که نباید در /p/<slug> بازنویسی شوند */
const RESERVED = new Set(['blog', 'article', 'admin', 'admin-login', 'api', 'assets', 'p']);

function validatePages(list) {
  if (!Array.isArray(list)) return 'داده ارسالی یک فهرست نیست.';
  if (list.length > MAX_PAGES) return 'تعداد صفحات بیش از حد مجاز است.';
  const seen = new Set();
  for (const p of list) {
    if (!p || typeof p !== 'object' || Array.isArray(p)) return 'ساختار یکی از صفحات نامعتبر است.';
    if (typeof p.slug !== 'string' || !/^[a-zA-Z0-9\u0600-\u06FF-]{1,60}$/.test(p.slug)) {
      return 'اسلاگ نامعتبر است: ' + String(p.slug == null ? '—' : p.slug).slice(0, 40);
    }
    if (RESERVED.has(p.slug)) return 'اسلاگ «' + p.slug + '» برای مسیرهای خود سایت رزرو است.';
    if (seen.has(p.slug)) return 'اسلاگ تکراری است: ' + p.slug;
    seen.add(p.slug);
    if (typeof p.title !== 'string' || !p.title.trim() || p.title.length > 200) {
      return 'عنوان صفحه «' + p.slug + '» نامعتبر است.';
    }
    if (JSON.stringify(p).length > 300 * 1024) return 'حجم صفحه «' + p.slug + '» بیش از حد مجاز است.';
    if (p.status && !['published', 'draft'].includes(p.status)) {
      return 'وضعیت نامعتبر برای صفحه «' + p.slug + '».';
    }
  }
  return null;
}

export default async function handler(req, res) {
  const method = (req.method || 'GET').toUpperCase();
  const hasStorage = !!process.env.BLOB_READ_WRITE_TOKEN || !!process.env.DATABASE_URL;
  const noStorage = () => json(res, 503, {
    ok: false, error: 'NO_BLOB',
    message: 'فضای ذخیره‌سازی (دیتابیس یا Blob) هنوز به پروژه وصل نشده است.',
  });

  if (method === 'GET') {
    if (!hasStorage) return noStorage();
    if (!(await isAuthedAsync(req))) return json(res, 401, { ok: false, error: 'UNAUTH', message: 'نشست منقضی شده؛ دوباره وارد شو.' });
    let list = [];
    try {
      const data = await readDoc(DOC_KEY, { ms: DB_MS });
      list = Array.isArray(data) ? data : (data && Array.isArray(data.pages) ? data.pages : []);
    } catch (e) {
      return json(res, 500, { ok: false, error: 'STORE_ERROR', message: String((e && e.message) || e) });
    }
    return json(res, 200, { ok: true, mode: 'cloud', db: !!process.env.DATABASE_URL, count: list.length, pages: list });
  }

  if (method === 'PUT' || method === 'POST') {
    if (!hasStorage) return noStorage();
    if (!(await isAuthedAsync(req))) return json(res, 401, { ok: false, error: 'UNAUTH', message: 'نشست منقضی شده؛ دوباره وارد شو.' });
    let body;
    try { body = await readJsonBody(req); }
    catch (e) {
      const err = String((e && e.message) || e);
      return json(res, err === 'BODY_TOO_LARGE' ? 413 : 400, { ok: false, error: err });
    }
    const invalid = validatePages(body.pages);
    if (invalid) return json(res, 400, { ok: false, error: 'INVALID', message: invalid });
    try {
      await writeDoc(DOC_KEY, body.pages, { ms: DB_MS }); // عملیات مدیر
      return json(res, 200, { ok: true, count: body.pages.length, updatedAt: new Date().toISOString() });
    } catch (e) {
      return json(res, 500, { ok: false, error: 'STORE_ERROR', message: String((e && e.message) || e) });
    }
  }

  return json(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
}
