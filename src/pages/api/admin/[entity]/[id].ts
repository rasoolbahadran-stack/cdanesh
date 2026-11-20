/* API مدیریت: تک‌رکورد — /api/admin/[entity]/[id] */
import type { APIRoute } from 'astro';
import { ENTITIES } from '../../../../lib/entities';
import { makeOne, makeUpdate, makeDelete } from '../../../../lib/crud';

export const prerender = false;

const pick = (name: string) => ENTITIES[String(name)];

export const GET: APIRoute = async (ctx) => {
  const entity = pick(ctx.params.entity as string);
  if (!entity) return new Response(JSON.stringify({ ok: false, error: 'NOT_FOUND', message: 'موجودیت ناشناخته' }), { status: 404 });
  return makeOne(entity)(ctx.request);
};

export const PUT: APIRoute = async (ctx) => {
  const entity = pick(ctx.params.entity as string);
  if (!entity) return new Response(JSON.stringify({ ok: false, error: 'NOT_FOUND', message: 'موجودیت ناشناخته' }), { status: 404 });
  return makeUpdate(entity)(ctx.request);
};

export const PATCH: APIRoute = async (ctx) => {
  const entity = pick(ctx.params.entity as string);
  if (!entity) return new Response(JSON.stringify({ ok: false, error: 'NOT_FOUND', message: 'موجودیت ناشناخته' }), { status: 404 });
  return makeUpdate(entity)(ctx.request);
};

export const DELETE: APIRoute = async (ctx) => {
  const entity = pick(ctx.params.entity as string);
  if (!entity) return new Response(JSON.stringify({ ok: false, error: 'NOT_FOUND', message: 'موجودیت ناشناخته' }), { status: 404 });
  return makeDelete(entity)(ctx.request);
};
