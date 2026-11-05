/* API مدیریت: فهرست و ایجاد موجودیت‌ها — /api/admin/[entity] */
import type { APIRoute } from 'astro';
import { ENTITIES } from '../../../../lib/entities';
import { makeList, makeCreate } from '../../../../lib/crud';

export const prerender = false;

export const GET: APIRoute = async (ctx) => {
  const entity = ENTITIES[String(ctx.params.entity)];
  if (!entity) return new Response(JSON.stringify({ ok: false, error: 'NOT_FOUND', message: 'موجودیت ناشناخته' }), { status: 404 });
  return makeList(entity)(ctx.request);
};

export const POST: APIRoute = async (ctx) => {
  const entity = ENTITIES[String(ctx.params.entity)];
  if (!entity) return new Response(JSON.stringify({ ok: false, error: 'NOT_FOUND', message: 'موجودیت ناشناخته' }), { status: 404 });
  return makeCreate(entity)(ctx.request);
};
