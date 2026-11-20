/* خروج ادمین — /api/auth/logout */
import type { APIRoute } from 'astro';
import { logoutCookie, isSecureRequest, sessionFromCookies } from '../../../lib/auth';
import { logActivity } from '../../../lib/seed';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  const session = sessionFromCookies(ctx.request.headers.get('cookie') || '');
  if (session) await logActivity('logout', 'auth', null, 'خروج از پنل مدیریت');
  return new Response(JSON.stringify({ ok: true, message: 'با موفقیت خارج شدید' }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'set-cookie': logoutCookie(isSecureRequest(ctx.request)),
    },
  });
};
