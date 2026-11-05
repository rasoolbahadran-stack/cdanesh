/* API رسانه‌ها: فهرست، آپلود و حذف — /api/admin/media */
import type { APIRoute } from 'astro';
import { q, q1 } from '../../../lib/db';
import { ok, fail, unauthorized, serverError, num } from '../../../lib/http';
import { sessionFromCookies } from '../../../lib/auth';
import { saveImage, deleteImage } from '../../../lib/storage';
import { logActivity } from '../../../lib/seed';

export const prerender = false;

const admin = (request: Request) => !!sessionFromCookies(request.headers.get('cookie') || '');

export const GET: APIRoute = async (ctx) => {
  if (!admin(ctx.request)) return unauthorized();
  try {
    const rows = await q('SELECT * FROM media ORDER BY id DESC LIMIT 200');
    return ok(rows);
  } catch (e) {
    return serverError(e);
  }
};

export const POST: APIRoute = async (ctx) => {
  if (!admin(ctx.request)) return unauthorized();
  try {
    const form = await ctx.request.formData();
    const file = form.get('file');
    const alt = String(form.get('alt') || '').slice(0, 300);
    if (!(file instanceof File)) {
      return fail('فایلی برای آپلود ارسال نشده است', 'NO_FILE');
    }
    const result = await saveImage(file);
    if (!result.ok || !result.url) {
      return fail(result.message || 'آپلود ناموفق بود', result.error || 'UPLOAD_FAIL');
    }
    const row = await q1(
      'INSERT INTO media (filename, url, mime, size, alt) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [result.filename || '', result.url, result.mime || 'image', result.size || 0, alt || file.name],
    );
    await logActivity('upload', 'media', Number(row?.id), `تصویر «${result.filename}» بارگذاری شد`);
    return ok(row, 'تصویر با موفقیت بارگذاری شد');
  } catch (e) {
    return serverError(e);
  }
};

export const DELETE: APIRoute = async (ctx) => {
  if (!admin(ctx.request)) return unauthorized();
  try {
    const id = num(new URL(ctx.request.url).searchParams.get('id'), 0);
    const row = await q1('SELECT * FROM media WHERE id = $1', [id]);
    if (!row) return fail('تصویر موردنظر پیدا نشد', 'NOT_FOUND', 404);
    await deleteImage(String(row.url));
    await q('DELETE FROM media WHERE id = $1', [id]);
    await logActivity('delete', 'media', id, 'تصویر حذف شد');
    return ok({ id }, 'تصویر حذف شد');
  } catch (e) {
    return serverError(e);
  }
};
