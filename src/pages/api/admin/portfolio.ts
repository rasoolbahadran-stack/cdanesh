export const prerender = false;
import type { APIRoute } from 'astro';
import { upsertPortfolio, deletePortfolio, listAdminPortfolio } from '../../../lib/cms-db';
import { bool } from '../../../lib/http';

function clean(v: unknown, max = 3000): string {
  return String(v ?? '').trim().slice(0, max);
}

export const GET: APIRoute = async () => {
  try {
    const rows = await listAdminPortfolio();
    return new Response(JSON.stringify({ ok: true, rows }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const b = await request.json().catch(() => ({}));
    const slug = clean(b.slug, 120).replace(/\s+/g, '-');
    if (!slug || !clean(b.title, 200)) {
      return new Response(JSON.stringify({ ok: false, error: 'slug و title الزامی است' }), { status: 400 });
    }
    await upsertPortfolio({
      slug,
      title: clean(b.title, 200),
      excerpt: clean(b.excerpt, 600),
      description: clean(b.description, 3000),
      category: clean(b.category, 80) || 'وب‌سایت',
      tags: Array.isArray(b.tags) ? b.tags.map((t: unknown) => clean(t, 40)).slice(0, 8) : [],
      cover: clean(b.cover, 300),
      preview_webp: clean(b.preview_webp, 300),
      live_url: clean(b.live_url, 400),
      status: ['published', 'conceptual', 'soon'].includes(String(b.status)) ? String(b.status) : 'soon',
      sort_order: Number(b.sort_order) || 100,
      published: bool(b.published),
    });
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const b = await request.json().catch(() => ({}));
    const slug = clean(b.slug, 120);
    if (!slug) return new Response(JSON.stringify({ ok: false, error: 'slug الزامی است' }), { status: 400 });
    await deletePortfolio(slug);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
};
