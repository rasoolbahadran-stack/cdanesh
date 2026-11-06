export const prerender = false;
import type { APIRoute } from 'astro';
import { upsertPost, deletePost, listAdminPosts } from '../../../lib/cms-db';

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
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
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
    await upsertPost({
      slug,
      title: clean(b.title, 200),
      excerpt: clean(b.excerpt, 600),
      content: String(b.content ?? ''),
      category: clean(b.category, 80) || 'عمومی',
      cover: clean(b.cover, 300),
      read_minutes: Number(b.read_minutes) || 6,
      published: Boolean(b.published),
    });
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
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
