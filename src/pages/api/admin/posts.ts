export const prerender = false;
import type { APIRoute } from 'astro';
import { upsertPost, deletePost, listAdminPosts } from '../../../lib/cms-db';
import { ENTITIES } from '../../../lib/entities';
import { makeCreate } from '../../../lib/crud';
import { bool } from '../../../lib/http';
import { sessionFromCookies } from '../../../lib/auth';

/* بررسی دوم احراز هویت در خودِ عملیات (دفاع در عمق) — میان‌افزار هم چک می‌کند */
function unauthorized(): Response {
  return new Response(
    JSON.stringify({ ok: false, error: 'UNAUTHORIZED', message: 'برای این عملیات باید وارد پنل شوید' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } },
  );
}

function clean(v: unknown, max = 5000): string {
  return String(v ?? '').trim().slice(0, max);
}
export const GET: APIRoute = async ({ request }) => {
  if (!sessionFromCookies(request.headers.get('cookie') || '')) return unauthorized();
  try {
    const rows = await listAdminPosts();
    /* هم {data} (قرارداد یکنواخت APIهای مدیریتی) و هم {rows} (سازگاری با مصرف‌کننده‌های فعلی) */
    return new Response(JSON.stringify({ ok: true, data: rows, rows }), { headers: { 'Content-Type': 'application/json' } });
  } catch { return new Response(JSON.stringify({ ok: false, error: 'بارگذاری مقاله‌ها ممکن نشد' }), { status: 500 }); }
};
/** ایجاد مقاله با همان اعتبارسنجی و امن‌سازی CRUD عمومی */
export const POST: APIRoute = async (ctx) => makeCreate(ENTITIES.posts)(ctx.request);
/** سازگاری با فرم قدیمی؛ ایجاد یا ذخیره بر اساس اسلاگ */
export const PUT: APIRoute = async ({ request }) => {
  if (!sessionFromCookies(request.headers.get('cookie') || '')) return unauthorized();
  try {
    const b = await request.json().catch(() => ({}));
    const slug = clean(b.slug, 120).replace(/\s+/g, '-');
    if (!slug || !clean(b.title, 200)) return new Response(JSON.stringify({ ok: false, error: 'اسلاگ و عنوان الزامی است' }), { status: 400 });
    await upsertPost({
      slug, title: clean(b.title, 200), excerpt: clean(b.excerpt, 600),
      content: String(b.content ?? ''), category: clean(b.category, 80) || 'عمومی',
      cover: clean(b.cover, 300), read_minutes: Number(b.read_minutes) || 6,
      published: bool(b.published),
    });
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch { return new Response(JSON.stringify({ ok: false, error: 'ذخیره مقاله ناموفق بود' }), { status: 500 }); }
};
export const DELETE: APIRoute = async ({ request }) => {
  if (!sessionFromCookies(request.headers.get('cookie') || '')) return unauthorized();
  try {
    const b = await request.json().catch(() => ({}));
    const slug = clean(b.slug, 120);
    if (!slug) return new Response(JSON.stringify({ ok: false, error: 'اسلاگ الزامی است' }), { status: 400 });
    await deletePost(slug);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch { return new Response(JSON.stringify({ ok: false, error: 'حذف مقاله ناموفق بود' }), { status: 500 }); }
};
