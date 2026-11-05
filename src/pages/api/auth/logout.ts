/* خروج ادمین — /api/auth/logout */
import type { APIRoute } from 'astro';
import { logoutCookie, isSecureRequest } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  return new Response(JSON.stringify({ ok: true, message: 'با موفقیت خارج شدید' }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'set-cookie': logoutCookie(isSecureRequest(ctx.request)),
    },
  });
};
