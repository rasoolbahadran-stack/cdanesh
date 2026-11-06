export const prerender = false;
import type { APIRoute } from 'astro';
import { insertMessage, dbAvailable } from '../../lib/db';

function clean(v: unknown, max = 500): string {
  return String(v ?? '').trim().slice(0, max);
}

async function handle(kind: 'contact' | 'consult', request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = clean(body.name, 120);
    const phone = clean(body.phone, 30);
    if (!name || !phone) {
      return new Response(JSON.stringify({ ok: false, error: 'نام و شماره تماس الزامی است' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const data = {
      name,
      phone,
      email: clean(body.email, 160),
      service: clean(body.service, 120),
      message: clean(body.message, 3000),
      meta: { ua: request.headers.get('user-agent')?.slice(0, 200) ?? '', lang: 'fa' },
    };
    if (dbAvailable()) {
      await insertMessage(kind, data);
      return new Response(JSON.stringify({ ok: true, stored: 'db' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // در نبود دیتابیس، درخواست موفق درنظر گرفته می‌شود (حالت پیش‌نمایش)
    console.log(`[${kind}] message received (no DB):`, data.name, data.phone);
    return new Response(JSON.stringify({ ok: true, stored: 'log' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'خطای سرور' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const POST: APIRoute = async ({ request }) => handle('contact', request);
