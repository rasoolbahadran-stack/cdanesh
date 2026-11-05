/* ═══ کافه‌دانش CMS — مهاجرت یک‌کلیکی داده‌های قدیمی (Blob → دیتابیس) ═══
   GET  /api/migrate → وضعیت: اتصال دیتابیس، اتصال Blob، وضعیت هر سند در دو سمت
   POST /api/migrate → کپی همهٔ سندهای موجود در Blob (مقالات، صفحات، پیام‌ها،
                        درگاه‌ها، کاربران) به پایگاه داده — بدون از دست رفتن چیزی.
   سندهای Blob دست‌نخورده می‌مانند (به‌عنوان نسخهٔ پشتیبان قدیم). */
import { blobHead, blobFetch, ADMIN_MS } from '../lib/blob-safe.mjs';
import { readDoc, writeDoc, dbEnabled, pingDb, dbDocInfo } from '../lib/store.mjs';
import { isAuthedAsync, resetUsersCache, json, readJsonBody } from '../lib/admin-auth.mjs';

const KEYS = ['articles.json', 'pages.json', 'messages.json', 'payments.json', 'users.json'];
const LABELS = {
  'articles.json': 'مقالات',
  'pages.json': 'صفحات',
  'messages.json': 'پیام‌ها',
  'payments.json': 'درگاه‌ها',
  'users.json': 'کاربر مدیر',
};

export default async function handler(req, res) {
  const method = (req.method || 'GET').toUpperCase();

  if (!(await isAuthedAsync(req))) {
    return json(res, 401, { ok: false, error: 'UNAUTH', message: 'نشست منقضی شده؛ دوباره وارد شو.' });
  }

  /* ─── وضعیت مهاجرت ─── */
  if (method === 'GET') {
    const db = await pingDb();
    const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
    const keys = [];
    for (const key of KEYS) {
      let blobInfo = { exists: false };
      if (hasBlob) {
        try {
          const meta = await blobHead(key, { ms: ADMIN_MS });
          blobInfo = { exists: true, bytes: meta.size || 0, uploadedAt: meta.uploadedAt || '' };
        } catch (e) {
          blobInfo = /not ?found|does ?not exist|NoSuchKey/i.test(String((e && e.message) || e)) || e.name === 'BlobNotFoundError'
            ? { exists: false }
            : { exists: false, error: String((e && e.message) || e).slice(0, 120) };
        }
      }
      const inDb = await dbDocInfo(key);
      keys.push({ key, label: LABELS[key] || key, blob: blobInfo, db: { exists: !!inDb.exists, updatedAt: inDb.updatedAt || '', error: inDb.error || '' } });
    }
    return json(res, 200, { ok: true, db, blob: { token: hasBlob }, keys });
  }

  /* ─── اجرای مهاجرت ─── */
  if (method === 'POST') {
    let body = {};
    try { body = await readJsonBody(req, 4 * 1024); } catch (e) { body = {}; }
    const force = !!(body && body.force);
    if (!dbEnabled()) {
      return json(res, 400, {
        ok: false, error: 'NO_DB',
        message: 'پایگاه داده هنوز متصل نیست. اول طبق راهنما DATABASE_URL را در ورسل تنظیم و یک‌بار منتشر کن، بعد مهاجرت را بزن.',
      });
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return json(res, 400, { ok: false, error: 'NO_BLOB', message: 'دسترسی به Blob (منبع داده‌های قدیمی) در دسترس نیست.' });
    }

    const migrated = [], skipped = [];
    for (const key of KEYS) {
      let exists = true, data = null;
      try {
        const meta = await blobHead(key, { ms: ADMIN_MS });
        const r = await blobFetch(meta.url);
        if (!r.ok) throw new Error('BLOB_FETCH_' + r.status);
        data = await r.json();
      } catch (e) {
        exists = /not ?found|does ?not exist|NoSuchKey/i.test(String((e && e.message) || e)) || e.name === 'BlobNotFoundError';
        if (!exists) return json(res, 500, { ok: false, error: 'BLOB_ERROR', message: 'خواندن ' + key + ' از Blob ناموفق بود: ' + String((e && e.message) || e) });
      }
      if (!exists || data == null) {
        skipped.push({ key, label: LABELS[key] || key, reason: 'empty' });
        continue;
      }
      if (!force && key === 'users.json') {
        /* کاربر مدیر: اگر در دیتابیس هست، نسخهٔ دیتابیس معتبرتر است (مگر force) */
        const inDb = await dbDocInfo(key);
        if (inDb.exists) { skipped.push({ key, label: LABELS[key], reason: 'db-already' }); continue; }
      }
      try {
        await writeDoc(key, data, { ms: ADMIN_MS });
        migrated.push({ key, label: LABELS[key] || key, count: Array.isArray(data) ? data.length : 1 });
      } catch (e) {
        return json(res, 500, { ok: false, error: 'DB_ERROR', message: 'نوشتن ' + key + ' در دیتابیس ناموفق بود: ' + String((e && e.message) || e) });
      }
    }
    if (migrated.some(m => m.key === 'users.json')) resetUsersCache();
    return json(res, 200, {
      ok: true,
      message: 'مهاجرت کامل شد. از این لحظه پایگاه داده منبع اصلی است؛ فایل‌های قدیمی Blob هم به‌عنوان پشتیبان باقی می‌مانند.',
      migrated, skipped,
    });
  }

  return json(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
}
