/* ==========================================================================
   کافه‌دانش — میان‌افزار امنیت
   • راه‌اندازی دیتابیس در اولین درخواست
   • محافظت از /admin/* و /api/admin/* با نشست ادمین سمت سرور
   • هدرهای امنیتی پایه برای همهٔ پاسخ‌ها
   ========================================================================== */
import { defineMiddleware } from 'astro:middleware';
import { boot } from './lib/bootstrap';
import { sessionFromCookies } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    await boot();
  } catch (e) {
    console.error('[cdanesh] boot failed:', e);
    return new Response(
      `<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><title>خطای دیتابیس</title><body style="font-family:Tahoma;padding:40px;text-align:center"><h1>اتصال دیتابیس برقرار نشد</h1><p>لطفاً تنظیمات DATABASE_URL یا وضعیت سرویس را بررسی کنید.</p><code style="display:block;white-space:pre-wrap;text-align:right">${String((e as Error)?.message || e)}</code></body></html>`,
      { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } },
    );
  }

  const path = context.url.pathname;
  const session = sessionFromCookies(context.request.headers.get('cookie') || '');
  context.locals.admin = session;

  /* مسیرهای مدیریتی */
  const isAdminPage = path === '/admin' || path.startsWith('/admin/');
  const isAdminPageLogin = path === '/admin/login';
  const isAdminApi = path.startsWith('/api/admin');

  if (isAdminPage && !isAdminPageLogin && !session) {
    return context.redirect('/admin/login?next=' + encodeURIComponent(path), 302);
  }
  if (isAdminPageLogin && session) {
    return context.redirect('/admin', 302);
  }
  if (isAdminApi && !session) {
    return new Response(JSON.stringify({ ok: false, error: 'UNAUTHORIZED', message: 'برای این عملیات باید وارد پنل شوید' }), {
      status: 401,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const response = await next();

  /* هدرهای امنیتی پایه */
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
});
