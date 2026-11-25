/* ورود ادمین — /api/auth/login */
import type { APIRoute } from 'astro';
import { login, isSecureRequest, loginThrottle, clientIp } from '../../../lib/auth';
import { ok, fail, serverError, readJson } from '../../../lib/http';
import { logActivity } from '../../../lib/seed';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  try {
    const ip = clientIp(ctx.request);
    const throttle = loginThrottle(ip);
    if (!throttle.allowed) {
      await logActivity('security', 'auth', null, 'تلاش ورود بیش از حد مجاز (مسدودسازی موقت)');
      return fail(`تلاش‌های ناموفق زیاد؛ ${throttle.retryAfter} ثانیه دیگر تلاش کنید`, 'RATE_LIMITED', 429);
    }
    const body = await readJson(ctx.request);
    const result = await login(String(body.username || ''), String(body.password || ''), ip, isSecureRequest(ctx.request));
    if (!result.ok || !result.cookie) {
      await logActivity('security', 'auth', null, result.error === 'LOGIN_LOCKED' ? 'تلاش ورود در حالت قفل ۱۵ دقیقه‌ای' : 'تلاش ناموفق ورود به پنل مدیریت');
      return fail(result.message || 'ورود ناموفق بود', result.error || 'BAD_CREDENTIALS', result.error === 'LOGIN_LOCKED' ? 429 : 401);
    }
    await logActivity('login', 'auth', null, 'ورود موفق به پنل مدیریت: ' + String(result.user?.username || '').slice(0, 40));
    return new Response(JSON.stringify({ ok: true, message: 'خوش آمدید! در حال انتقال به پنل…', data: { username: result.user?.username || '', mustChangePassword: !!result.user?.mustChangePassword } }), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'set-cookie': result.cookie,
      },
    });
  } catch (e) {
    return serverError(e);
  }
};
