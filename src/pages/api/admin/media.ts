/* API رسانه‌ها: فهرست (جست‌وجو/مرتب‌سازی)، آپلود، ویرایش alt، حذف با بررسی استفاده — /api/admin/media */
import type { APIRoute } from 'astro';
import { q, q1 } from '../../../lib/db';
import { ok, fail, unauthorized, serverError, num, str } from '../../../lib/http';
import { sessionFromCookies } from '../../../lib/auth';
import { saveImage } from '../../../lib/storage';
import { logActivity } from '../../../lib/seed';

export const prerender = false;

const admin = (request: Request) => !!sessionFromCookies(request.headers.get('cookie') || '');

async function ensureTrashTable() {
  await q(`CREATE TABLE IF NOT EXISTS cdanesh_admin_trash (
    id bigserial PRIMARY KEY,
    entity text NOT NULL,
    entity_id bigint NOT NULL,
    snapshot jsonb NOT NULL,
    deleted_at timestamptz NOT NULL DEFAULT now(),
    restored_at timestamptz
  )`);
}

/* بررسی اینکه آیا فایل در محتوای سایت استفاده شده است */
async function findUsage(url: string): Promise<string[]> {
  if (!url || url.startsWith('data:')) return [];
  const used: string[] = [];
  const check = async (label: string, sql: string, params: unknown[]) => {
    try {
      const rows = await q<{ label: string }>(sql, params);
      if (rows.length) used.push(...rows.map(() => label));
    } catch { /* جدولی موجود نیست؛ نادیده گرفته می‌شود */ }
  };
  await check('محتوای صفحات', `SELECT 1 AS label FROM pages WHERE content LIKE $1 OR featured_image = $2`, [`%${url}%`, url]);
  await check('مقالات', `SELECT 1 AS label FROM posts WHERE content LIKE $1 OR cover_image = $2`, [`%${url}%`, url]);
  await check('خدمات', `SELECT 1 AS label FROM services WHERE content LIKE $1 OR image = $2`, [`%${url}%`, url]);
  await check('نمونه‌کارها', `SELECT 1 AS label FROM projects WHERE content LIKE $1 OR cover_image = $2 OR gallery::text LIKE $1`, [`%${url}%`, url]);
  await check('تعرفه‌ها', `SELECT 1 AS label FROM plans WHERE features::text LIKE $1 OR description LIKE $1`, [`%${url}%`, url]);
  await check('نظرات مشتریان', `SELECT 1 AS label FROM testimonials WHERE avatar = $1`, [url]);
  await check('پیام‌ها', `SELECT 1 AS label FROM messages WHERE message LIKE $1`, [`%${url}%`]);
  return used;
}

export const GET: APIRoute = async (ctx) => {
  if (!admin(ctx.request)) return unauthorized();
  try {
    const url = new URL(ctx.request.url);
    const search = url.searchParams.get('q');
    const sort = url.searchParams.get('sort') || 'newest';
    const params: unknown[] = [];
    let where = '';
    if (search) {
      params.push(`%${search}%`);
      where = `WHERE filename ILIKE $1 OR alt ILIKE $1`;
    }
    const order =
      sort === 'oldest' ? 'id ASC' :
      sort === 'size' ? 'size DESC' :
      sort === 'name' ? 'filename ASC' : 'id DESC';
    const rows = await q(`SELECT * FROM media ${where} ORDER BY ${order} LIMIT 500`, params);
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

/* ویرایش عنوان/متن جایگزین تصویر */
export const PATCH: APIRoute = async (ctx) => {
  if (!admin(ctx.request)) return unauthorized();
  try {
    const body = (await ctx.request.json()) as { id?: unknown; alt?: unknown };
    const id = num(body.id, 0);
    const alt = str(body.alt, 300);
    if (!id) return fail('شناسهٔ تصویر نامعتبر است', 'BAD_ID');
    const row = await q1('UPDATE media SET alt = $1 WHERE id = $2 RETURNING *', [alt, id]);
    if (!row) return fail('تصویر موردنظر پیدا نشد', 'NOT_FOUND', 404);
    await logActivity('update', 'media', id, 'متن جایگزین تصویر ویرایش شد');
    return ok(row, 'متن جایگزین ذخیره شد');
  } catch (e) {
    return serverError(e);
  }
};

export const DELETE: APIRoute = async (ctx) => {
  if (!admin(ctx.request)) return unauthorized();
  try {
    const url = new URL(ctx.request.url);
    const id = num(url.searchParams.get('id'), 0);
    const force = url.searchParams.get('force') === '1';
    const row = await q1('SELECT * FROM media WHERE id = $1', [id]);
    if (!row) return fail('تصویر موردنظر پیدا نشد', 'NOT_FOUND', 404);

    if (!force) {
      const used = await findUsage(String(row.url));
      if (used.length) {
        return new Response(JSON.stringify({
          ok: false,
          error: 'IN_USE',
          message: `این تصویر در ${used.join(' و ')} استفاده شده است. برای حذف قطعی دوباره تأیید کنید.`,
          data: { usedIn: used },
        }), { status: 409, headers: { 'content-type': 'application/json; charset=utf-8' } });
      }
    }

    await ensureTrashTable();
    await q(
      'INSERT INTO cdanesh_admin_trash(entity, entity_id, snapshot) VALUES($1, $2, $3::jsonb)',
      ['media', id, JSON.stringify(row)],
    );
    await q('DELETE FROM media WHERE id = $1', [id]);
    await logActivity('delete', 'media', id, 'تصویر به سطل زباله منتقل شد');
    return ok({ id }, 'تصویر به سطل زباله منتقل شد؛ فایل تا حذف قطعی قابل بازیابی است.');
  } catch (e) {
    return serverError(e);
  }
};
