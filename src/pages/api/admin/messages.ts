export const prerender = false;
import type { APIRoute } from 'astro';
import { listMessages, markMessageRead } from '../../../lib/db';

export const GET: APIRoute = async () => {
  try {
    const rows = await listMessages();
    return new Response(JSON.stringify({ ok: true, rows }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  try {
    const b = await request.json().catch(() => ({}));
    const id = Number(b.id);
    if (!id) return new Response(JSON.stringify({ ok: false, error: 'id الزامی است' }), { status: 400 });
    await markMessageRead(id);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
};
