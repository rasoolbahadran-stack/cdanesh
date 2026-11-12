export const prerender = false;
import type { APIRoute } from 'astro';
import { upsertPost, deletePost, listAdminPosts } from '../../../lib/cms-db';
import { q1 } from '../../../lib/db';

function clean(v: unknown, max = 5000): string {
  return String(v ?? '').trim().slice(0, max);
}

/** لیست مقالات (برای پنل) */
export const GET: APIRoute = async () => {
  try {
    const rows = await listAdminPosts();
    return new Response(JSON.stringify({ ok: true, rows }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'ذخیره مقاله انجام نشد؛ ورودی‌ها و اتصال پایگاه داده را بررسی کنید.' }), { status: 500 });
  }
};

/** ایجاد/ویرایش مقاله */
export const PUT: APIRoute = async ({ request }) => {
  try {
    const b = await request.json().catch(() => ({}));
    const slug = clean(b.slug, 120).replace(/\s+/g, '-');
    if (!slug || !clean(b.title, 200)) {
      return new Response(JSON.stringify({ ok: false, error: 'slug و title الزامی است' }), { status: 400 });
    }
    const id = Number(b.id) || 0;
    const collision = await q1<{id:number}>('SELECT id FROM posts WHERE slug=$1 AND ($2=0 OR id<>$2)', [slug,id]);
    if (collision) return new Response(JSON.stringify({ok:false,error:'این نشانی قبلاً برای مقاله دیگری ثبت شده است.'}), {status:409,headers:{'Content-Type':'application/json'}});
    await upsertPost({
      id: id || undefined,
      slug,
      title: clean(b.title, 200),
      excerpt: clean(b.excerpt, 600),
      content: String(b.content ?? ''),
      category: clean(b.category, 80) || 'عمومی',
      cover: clean(b.cover, 300),
      read_minutes: Number(b.read_minutes) || 6,
      published: Boolean(b.published),
    });
    const saved = await q1<{id:number}>('SELECT id FROM posts WHERE slug=$1', [slug]);
    return new Response(JSON.stringify({ ok: true, id: saved?.id ?? id }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
};

/** حذف مقاله */
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const b = await request.json().catch(() => ({}));
    const slug = clean(b.slug, 120);
    if (!slug) return new Response(JSON.stringify({ ok: false, error: 'slug الزامی است' }), { status: 400 });
    await deletePost(slug);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
};
