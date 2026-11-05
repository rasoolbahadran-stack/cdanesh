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
  const request = context.request;
  const session = sessionFromCookies(request.headers.get('cookie') || '');
  context.locals.admin = session;

  /* ---------- بررسی Origin برای POST/PUT/PATCH/DELETE (ضد CSRF) ----------
     جایگزین دقیق checkOrigin داخلی Astro: از هدرهای forwarded استفاده می‌کند
     تا هم روی Vercel و هم پشت پراکسی/محلی درست کار کند.
     • درخواست‌های فرم‌مانند (multipart/urlencoded/text-plain) بدون Origin → 403
       (مرورگرها همیشه Origin ارسال می‌کنند؛ فرم جعلی بین‌سایتی هم دارد).
     • JSON بدون Origin فقط برای کلاینت‌های غیرمرورگری مجاز است؛ مرورگر روی
       همهٔ POSTهای fetch درخواست پیش‌پرواز/CORS دارد و همان‌جا کنترل می‌شود. */
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  const isPrerendered = (context as unknown as { isPrerendered?: boolean }).isPrerendered === true;
  if (!isPrerendered && !safeMethods.includes(request.method)) {
    const origin = request.headers.get('origin');
    const ct = (request.headers.get('content-type') || '').toLowerCase();
    const formLike = ct.includes('multipart/form-data') || ct.includes('application/x-www-form-urlencoded') || ct.includes('text/plain');
    if (formLike) {
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
      const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
      const proto = request.headers.get('x-forwarded-proto') || (isLocal ? 'http' : 'https');
      const expected = proto ? `${proto}://${host}` : '';
      if (!origin || (expected && origin !== expected)) {
        return new Response('درخواست بین‌سایتی مجاز نیست (CSRF)', { status: 403, headers: { 'content-type': 'text/plain; charset=utf-8' } });
      }
    }
  }

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
