/* API تنظیمات سایت — /api/admin/settings */
import type { APIRoute } from 'astro';
import { getSiteSettings, saveSiteSettings, logActivity } from '../../../lib/seed';
import { ok, fail, unauthorized, serverError, readJson } from '../../../lib/http';
import { sessionFromCookies } from '../../../lib/auth';

export const prerender = false;

const admin = (request: Request) => !!sessionFromCookies(request.headers.get('cookie') || '');

export const GET: APIRoute = async (ctx) => {
  if (!admin(ctx.request)) return unauthorized();
  try {
    return ok(await getSiteSettings());
  } catch (e) {
    return serverError(e);
  }
};

export const PUT: APIRoute = async (ctx) => {
  if (!admin(ctx.request)) return unauthorized();
  try {
    const body = await readJson(ctx.request);
    const current = await getSiteSettings();

    /* ادغام بخش‌به‌بخش — کلیدهای ارسال‌نشده دست‌نخورده می‌مانند */
    const merged = {
      ...current,
      ...(body.identity ? { identity: { ...current.identity, ...body.identity } } : {}),
      ...(body.contact ? { contact: { ...current.contact, ...body.contact } } : {}),
      ...(body.seo ? { seo: { ...current.seo, ...body.seo, keywords: Array.isArray(body.seo.keywords) ? body.seo.keywords : current.seo.keywords } } : {}),
      ...(body.menu ? { menu: { ...current.menu, ...body.menu } } : {}),
      ...(body.footer ? { footer: { ...current.footer, ...body.footer } } : {}),
      ...(body.homepage ? { homepage: { ...current.homepage, ...body.homepage } } : {}),
    };

    /* اعتبارسنجی‌های کلیدی */
    if (merged.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(merged.contact.email))) {
      return fail('ایمیل واردشده معتبر نیست', 'VALIDATION');
    }

    await saveSiteSettings(merged);
    await logActivity('update', 'settings', null, 'تنظیمات سایت ذخیره شد');
    return ok(merged, 'تنظیمات با موفقیت ذخیره شد');
  } catch (e) {
    return serverError(e);
  }
};
