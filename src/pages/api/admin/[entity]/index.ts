/* API مدیریت: فهرست و ایجاد موجودیت‌ها — /api/admin/[entity] */
import type { APIRoute } from 'astro';
import { ENTITIES } from '../../../../lib/entities';
import { makeList, makeCreate } from '../../../../lib/crud';
import { q } from '../../../../lib/db';
import { sessionFromCookies } from '../../../../lib/auth';

export const prerender = false;

/* شمارش مقالات هر دسته — ستون «مقالات» فهرست دسته‌بندی‌ها و هشدار حذف */
async function withCategoryCounts(rows: Array<Record<string, unknown>>): Promise<Array<Record<string, unknown>>> {
  try {
    const counts = await q<{ category_id: number; count: number }>(
      'SELECT category_id, COUNT(*)::int AS count FROM posts WHERE category_id IS NOT NULL GROUP BY category_id',
    );
    const map = new Map(counts.map((c) => [Number(c.category_id), Number(c.count)]));
    return rows.map((row) => ({ ...row, post_count: map.get(Number(row.id)) || 0 }));
  } catch {
    return rows;
  }
}

export const GET: APIRoute = async (ctx) => {
  const entity = ENTITIES[String(ctx.params.entity)];
  if (!entity) return new Response(JSON.stringify({ ok: false, error: 'NOT_FOUND', message: 'موجودیت ناشناخته' }), { status: 404 });
  const response = await makeList(entity)(ctx.request);
  if (String(ctx.params.entity) !== 'categories' || !sessionFromCookies(ctx.request.headers.get('cookie') || '')) return response;
  try {
    const body = JSON.parse(await response.text());
    if (body?.ok && Array.isArray(body.data)) body.data = await withCategoryCounts(body.data);
    return new Response(JSON.stringify(body), { status: response.status, headers: { 'content-type': 'application/json; charset=utf-8' } });
  } catch {
    return response;
  }
};

export const POST: APIRoute = async (ctx) => {
  const entity = ENTITIES[String(ctx.params.entity)];
  if (!entity) return new Response(JSON.stringify({ ok: false, error: 'NOT_FOUND', message: 'موجودیت ناشناخته' }), { status: 404 });
  return makeCreate(entity)(ctx.request);
};
