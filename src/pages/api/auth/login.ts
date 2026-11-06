export const prerender = false;
import type { APIRoute } from 'astro';
import { verifyCredentials, createSession } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '');
    const password = String(body.password || '');
    const session = verifyCredentials(email, password);
    if (!session) {
      return new Response(JSON.stringify({ ok: false, error: 'ایمیل یا رمز عبور درست نیست' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    await createSession(cookies, session);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'خطای سرور' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
