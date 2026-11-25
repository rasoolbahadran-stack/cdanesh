/* ==========================================================================
   کافه‌دانش — میان‌افزار امنیت
   • راه‌اندازی دیتابیس در اولین درخواست
   • محافظت از /admin/* و /api/admin/* با نشست ادمین سمت سرور
   • هدرهای امنیتی پایه برای همهٔ پاسخ‌ها
   ========================================================================== */
import { defineMiddleware } from 'astro:middleware';
import { boot } from './lib/bootstrap';
import { sessionFromCookies } from './lib/auth';
import { q } from './lib/db';
import crypto from 'node:crypto';

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    await boot();
  } catch (e) {
    console.error('[cdanesh] boot failed:', e);
    return new Response(
      `<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>سرویس موقتاً در دسترس نیست</title><body style="font-family:Tahoma;padding:40px;text-align:center"><h1>سرویس موقتاً در دسترس نیست</h1><p>در برقراری ارتباط با سرویس مشکلی پیش آمده است. لطفاً چند دقیقه دیگر دوباره تلاش کنید.</p></body></html>`,
      { status: 503, headers: { 'content-type': 'text/html; charset=utf-8' } },
    );
  }

  const path = context.url.pathname;
  const isAdminPath = (p: string) => p === '/admin' || p.startsWith('/admin/');
  /* انتشار مقاله‌های زمان‌بندی‌شده در اولین درخواست پس از رسیدن موعد؛ حداکثر هر ۳۰ ثانیه در هر نمونه سرور */
  const scheduleRuntime = globalThis as unknown as { __cd_schedule_check?: number };
  if (!scheduleRuntime.__cd_schedule_check || Date.now() - scheduleRuntime.__cd_schedule_check > 30_000) {
    scheduleRuntime.__cd_schedule_check = Date.now();
    try {
      /* الگوی سازگار با MySQL: اول انتخاب مقاله‌های موعدرسیده، بعد انتشار
         با گارد status='scheduled' تا اجرای هم‌زمان/تکراری دوباره منتشر نکند. */
      const due = await q<{ id: number; title: string }>(
        `SELECT id, title FROM posts WHERE status='scheduled' AND published_at IS NOT NULL AND published_at <= now() LIMIT 50`
      );
      for (const item of due) {
        try {
          const done = await q(
            `UPDATE posts SET status='published', updated_at=now() WHERE id=$1 AND status='scheduled'`,
            [item.id],
          );
          const affected = Number(done[0]?.affectedRows ?? (done.length ? 1 : 0));
          if (affected === 0) continue; // نمونهٔ دیگر هم‌زمان منتشر کرده است
          await q('INSERT INTO activity(type,entity,entity_id,title) VALUES($1,$2,$3,$4)',
            ['publish', 'posts', item.id, 'انتشار زمان‌بندی‌شده مقاله: ' + String(item.title || '').slice(0, 160)]);
        } catch (logError) { console.warn('[cdanesh] scheduled post activity log failed:', logError); }
      }
    } catch (error) { console.warn('[cdanesh] scheduled publishing check failed:', error); }
  }
  const request = context.request;
  let session = sessionFromCookies(request.headers.get('cookie') || '');
  /* اعتبارسنجی سمت سرور نشست‌های دیتابیسی: نسخهٔ رمز (vid) و فعال‌بودن کاربر.
     تغییر رمز → pwd_version+1 → همهٔ کوکی‌های قبلی بی‌اعتبار می‌شوند. */
  if (session && session.uid > 0) {
    try {
      const row = (await q<{ pwd_version: number; is_active: number | boolean; must_change_password: number | boolean }>(
        'SELECT pwd_version, is_active, must_change_password FROM users WHERE id = $1',
        [session.uid],
      ))[0];
      if (!row || !(row.is_active === 1 || row.is_active === true) || Number(row.pwd_version) !== Number(session.vid)) {
        session = null;
      } else {
        session.mcp = row.must_change_password === 1 || row.must_change_password === true;
      }
    } catch { /* جدول آماده نیست — ادامه با امضای کوکی */ }
  }
  context.locals.admin = session;

  /* اجبار تغییر رمز اولیه: مدیرِ تازه‌نصب تا تغییر رمز فقط به حساب کاربری می‌رود */
  const passwordChangeExempt =
    path === '/api/admin/password' || path === '/api/auth/me' || path === '/api/auth/logout' ||
    path === '/admin/account' || path === '/admin/login';
  if (session && session.mcp && (isAdminPath(path) || path.startsWith('/api/admin')) && !passwordChangeExempt) {
    if (path.startsWith('/api')) {
      return new Response(JSON.stringify({ ok: false, error: 'PASSWORD_CHANGE_REQUIRED', message: 'برای ادامه ابتدا رمز عبور اولیه را تغییر دهید' }), {
        status: 403, headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }
    return context.redirect('/admin/account?force=1', 302);
  }

  /* کنترل دسترسی نقش‌ها: editor به تنظیمات سیستم، مدیریت کاربران و ابزارهای سیستمی دسترسی ندارد */
  const editorBlockedPages = path.startsWith('/admin/settings') || path.startsWith('/admin/users');
  const editorBlockedApis =
    path.startsWith('/api/admin/settings') || path.startsWith('/api/admin/users') ||
    path.startsWith('/api/admin/system') || path.startsWith('/api/admin/ai-config');
  if (session && session.role !== 'admin' && (editorBlockedPages || editorBlockedApis)) {
    if (path.startsWith('/api')) {
      return new Response(JSON.stringify({ ok: false, error: 'FORBIDDEN', message: 'این بخش فقط برای مدیر سیستم است' }), {
        status: 403, headers: { 'content-type': 'application/json; charset=utf-8' },
      });
    }
    return context.redirect('/admin', 302);
  }

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

  /* ریدایرکت دائمی اسلاگ قدیمی مقاله‌ها و صفحات */
  const slugMatch = path.match(/^\/(blog|page)\/([^/]+)\/?$/);
  if (slugMatch) {
    try {
      const entity = slugMatch[1] === 'blog' ? 'posts' : 'pages';
      const oldSlug = decodeURIComponent(slugMatch[2]);
      const redirectRows = await q<{ new_slug: string }>('SELECT new_slug FROM slug_redirects WHERE entity=$1 AND old_slug=$2 LIMIT 1', [entity, oldSlug]);
      const newSlug = redirectRows[0]?.new_slug;
      if (newSlug && newSlug !== oldSlug) {
        const destination = new URL('/' + slugMatch[1] + '/' + encodeURIComponent(newSlug), context.url);
        return Response.redirect(destination, 301);
      }
    } catch { /* در صورت نبود رکورد، مسیر اصلی ادامه می‌یابد */ }
  }
  /* مسیرهای مدیریتی */
  const isAdminPage = isAdminPath(path);
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

  let response: Response;
  try { response = await next(); } catch (error) {
    const traceId = crypto.randomUUID();
    const message = String((error as Error)?.message || 'خطای غیرمنتظره سرور').replace(/[\r\n\t]+/g, ' ').replace(/Bearer\s+\S+/gi, '[توکن حذف شد]').replace(/(password|token|secret|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, '$1=[حذف شد]').slice(0, 700);
    try { await q('INSERT INTO error_reports(trace_id,source,message,path,severity) VALUES($1,$2,$3,$4,$5)', [traceId, 'server', message, path.slice(0, 400), 'fatal']); } catch { /* ثبت خطا نباید خطای اصلی را مختل کند */ }
    return new Response('سرویس موقتاً با خطا روبه‌رو شد. شناسه پیگیری: ' + traceId, { status: 500, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }

  /* هدرهای امنیتی پایه */
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  /* ---------- کش لبهٔ Vercel برای صفحات محتوایی عمومی ----------
     صفحه‌های HTML عمومی با s-maxage=60 + stale-while-revalidate کش لبه می‌شوند:
     باز شدن صفحات از POP نزدیک کاربر و سریع؛ محتوای جدید پنل حداکثر پس از
     یک دقیقه (با revalidate پس‌زمینه‌ای) دیده می‌شود.
     پنل، API، پیش‌نمایش و صفحات فرم (که پارامتر query می‌خوانند) کش نمی‌شوند. */
  const contentType = response.headers.get('content-type') || '';
  const isFormish = path.startsWith('/consult') || path.startsWith('/contact');
  if (
    safeMethods.includes(request.method) &&
    !isAdminPage && !isAdminPageLogin && !isAdminApi &&
    !path.startsWith('/api') &&
    !isFormish &&
    response.status === 200 &&
    contentType.includes('text/html')
  ) {
    response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate, s-maxage=60, stale-while-revalidate=86400');
  }
  return response;
});
