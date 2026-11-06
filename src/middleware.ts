// محافظت از مسیرهای /admin و API های مدیریتی
import { defineMiddleware } from 'astro:middleware';
import { getSession } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect, isPrerendered } = context;
  const path = url.pathname;

  // در بیلد استاتیک، middleware اجرا نمی‌شود (فایل کنار گذاشته شده)
  if (isPrerendered) return next();

  const isAdminPage = path === '/admin' || path.startsWith('/admin/');
  const isAdminApi = path.startsWith('/api/admin');

  if (isAdminPage || isAdminApi) {
    // مسیر ورود مجاز است
    if (isAdminPage && (path === '/admin/login')) {
      const session = await getSession(cookies);
      if (session) return redirect('/admin');
      return next();
    }
    const session = await getSession(cookies);
    if (!session) {
      if (isAdminApi) {
        return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return redirect('/admin/login');
    }
  }

  return next();
});
