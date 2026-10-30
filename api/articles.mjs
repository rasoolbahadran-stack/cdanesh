/* ═══ کافه‌دانش — مقالات ابری (Vercel Function + Vercel Blob) ═══
   GET  /api/articles            → کل فهرست (فقط برای پنل با کوکی)
   GET  /api/articles?scope=public → فهرست عمومی (بدون پیش‌نویس) برای سایت
   PUT  /api/articles  {articles:[…]} → ذخیرهٔ کامل فهرست (فقط مدیر)
   داده در Vercel Blob با نام ثابت articles.json نگهداری می‌شود؛
   تا قبل از اولین ذخیره، پاسخ 404/EMPTY است و سایت از دادهٔ همراه پروژه استفاده می‌کند. */
import { head, put } from '@vercel/blob';
import { isAuthed, validateArticles, publicOnly, sorted, json, readJsonBody } from '../lib/admin-auth.mjs';

const BLOB_KEY = 'articles.json';

/* نبود فایل در Blob با خطا متمایز می‌شود تا با خطای شبکه اشتباه نشود */
function isNotFound(e) {
  return e && (e.name === 'BlobNotFoundError' || /not ?found|does ?not exist|NoSuchKey/i.test(String((e && e.message) || e)));
}

async function readBlob() {
  const meta = await head(BLOB_KEY); // اگر نباشد throw می‌شود
  const r = await fetch(meta.url, { cache: 'no-store' });
  if (!r.ok) throw new Error('BLOB_FETCH_' + r.status);
  const list = await r.json();
  return Array.isArray(list) ? list : [];
}

export default async function handler(req, res) {
  const method = (req.method || 'GET').toUpperCase();
  const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

  if (method === 'GET') {
    if (!hasBlob) {
      return json(res, 503, { ok: false, error: 'NO_BLOB', message: 'فضای ابری (Vercel Blob) هنوز به پروژه وصل نشده است.' });
    }
    let list;
    try { list = await readBlob(); }
    catch (e) {
      if (isNotFound(e)) return json(res, 404, { ok: false, error: 'EMPTY' });
      return json(res, 500, { ok: false, error: 'BLOB_ERROR', message: String((e && e.message) || e) });
    }
    const url = new URL(req.url, 'http://local');
    const scope = url.searchParams.get('scope');
    const out = scope === 'public' ? publicOnly(list) : list;
    return json(res, 200, { ok: true, mode: 'cloud', count: out.length, articles: sorted(out) });
  }

  if (method === 'PUT' || method === 'POST') {
    if (!hasBlob) {
      return json(res, 503, { ok: false, error: 'NO_BLOB', message: 'فضای ابری (Vercel Blob) هنوز به پروژه وصل نشده است.' });
    }
    if (!isAuthed(req)) return json(res, 401, { ok: false, error: 'UNAUTH', message: 'نشست منقضی شده؛ دوباره وارد شو.' });

    let body;
    try { body = await readJsonBody(req); }
    catch (e) {
      const err = String((e && e.message) || e);
      return json(res, err === 'BODY_TOO_LARGE' ? 413 : 400, { ok: false, error: err });
    }

    const invalid = validateArticles(body.articles);
    if (invalid) return json(res, 400, { ok: false, error: 'INVALID', message: invalid });

    const clean = sorted(body.articles);
    try {
      const blob = await put(BLOB_KEY, JSON.stringify(clean), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json; charset=utf-8',
      });
      return json(res, 200, {
        ok: true, count: clean.length,
        updatedAt: blob.uploadedAt || new Date().toISOString(),
      });
    } catch (e) {
      return json(res, 500, { ok: false, error: 'BLOB_ERROR', message: String((e && e.message) || e) });
    }
  }

  return json(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
}
