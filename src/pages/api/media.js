// /api/media — کتابخانه رسانه (آپلود/فهرست/حذف فایل روی Vercel Blob)
// GET    → فهرست فایل‌های رسانه (فقط مدیر)
// POST   → آپلود فایل (multipart/form-data، فیلد «file») (فقط مدیر)
// DELETE → حذف فایل با پارامتر ?url= (فقط مدیر)
export const prerender = false;

import { blobPut, blobList, blobDel, ADMIN_MS } from '../../../server/lib/blob-safe.mjs';
import { isAuthedAsync } from '../../../server/lib/admin-auth.mjs';

const PREFIX = 'media/';
const MAX_SIZE = 4 * 1024 * 1024; // ۴ مگابایت
const OK_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif',
  'application/pdf', 'application/zip', 'video/mp4',
];

const json = (status, obj) => new Response(JSON.stringify(obj), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

/* نشست مدیر از کوکی — سازگار با همان توکن api/login */
async function authed(request) {
  try {
    return await isAuthedAsync({ headers: { cookie: request.headers.get('cookie') || '' } });
  } catch { return false; }
}

const safeName = (n) => String(n || 'file')
  .replace(/[\\/:*?"<>|#\s]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(-80) || 'file';

export async function GET({ request }) {
  if (!(await authed(request))) return json(401, { ok: false, error: 'UNAUTH' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return json(503, { ok: false, error: 'NO_BLOB', message: 'فضای ابری (Vercel Blob) هنوز به پروژه وصل نشده است.' });
  try {
    const res = await blobList({ prefix: PREFIX, limit: 500, ms: ADMIN_MS });
    const media = (res.blobs || [])
      .map(b => ({ url: b.url, name: decodeURIComponent((b.pathname || '').replace(PREFIX, '')), size: b.size || 0, uploadedAt: b.uploadedAt || '' }))
      .sort((a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt)));
    return json(200, { ok: true, mode: 'cloud', media });
  } catch (e) {
    return json(500, { ok: false, error: 'BLOB_ERROR', message: String((e && e.message) || e) });
  }
}

export async function POST({ request }) {
  if (!(await authed(request))) return json(401, { ok: false, error: 'UNAUTH' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return json(503, { ok: false, error: 'NO_BLOB', message: 'فضای ابری (Vercel Blob) هنوز به پروژه وصل نشده است.' });
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') return json(400, { ok: false, error: 'NO_FILE', message: 'فایلی برای آپلود ارسال نشده است.' });
    const type = file.type || 'application/octet-stream';
    const isImage = type.startsWith('image/');
    if (!isImage && !OK_TYPES.includes(type)) return json(400, { ok: false, error: 'BAD_TYPE', message: 'این نوع فایل پذیرفته نمی‌شود.' });
    if (file.size > MAX_SIZE) return json(413, { ok: false, error: 'TOO_LARGE', message: 'حجم فایل بیش از ۴ مگابایت است.' });

    const buf = Buffer.from(await file.arrayBuffer());
    const key = PREFIX + Date.now().toString(36) + '-' + safeName(file.name);
    const blob = await blobPut(key, buf, { access: 'public', addRandomSuffix: false, contentType: type, ms: ADMIN_MS });
    return json(200, {
      ok: true,
      media: { url: blob.url, name: decodeURIComponent(key.replace(PREFIX, '')), size: file.size, uploadedAt: blob.uploadedAt || '' },
    });
  } catch (e) {
    return json(500, { ok: false, error: 'BLOB_ERROR', message: String((e && e.message) || e) });
  }
}

export async function DELETE({ request }) {
  if (!(await authed(request))) return json(401, { ok: false, error: 'UNAUTH' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return json(503, { ok: false, error: 'NO_BLOB', message: 'فضای ابری (Vercel Blob) هنوز به پروژه وصل نشده است.' });
  try {
    const url = new URL(request.url).searchParams.get('url') || '';
    if (!url.startsWith(PREFIX) && !url.includes('/media/')) return json(400, { ok: false, error: 'BAD_URL' });
    await blobDel(url, { ms: ADMIN_MS });
    return json(200, { ok: true });
  } catch (e) {
    return json(500, { ok: false, error: 'BLOB_ERROR', message: String((e && e.message) || e) });
  }
}
