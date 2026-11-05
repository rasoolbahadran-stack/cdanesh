/* وضعیت نشست — /api/auth/me */
import type { APIRoute } from 'astro';
import { sessionFromCookies } from '../../../lib/auth';
import { ok } from '../../../lib/http';

export const prerender = false;

export const GET: APIRoute = async (ctx) => {
  const session = sessionFromCookies(ctx.request.headers.get('cookie') || '');
  return ok(session ? { logged: true, username: session.u } : { logged: false });
};
