/* تغییر رمز مدیر: /api/admin/password
   ---------------------------------------------------------------------------
   قرارداد امنیتی حفظ می‌شود:
   • اگر کاربر رمز جدید ثبت کند → هش SHA-256 در جدول users ذخیره می‌شود و
     در ورود بعدی مقدم بر ADMIN_PASSWORD_HASH بررسی می‌گردد.
   • متغیر محیطی ADMIN_PASSWORD_HASH بدون تغییر باقی می‌ماند و همچنان
     به‌عنوان مرجع اصلی (fallback) کار می‌کند.
   • برای تغییر، رمز فعلی باید درست وارد شود.
   --------------------------------------------------------------------------- */
import type { APIRoute } from 'astro';
import { fail, unauthorized, serverError, readJson, str } from '../../../lib/http';
import { sessionFromCookies, sha256, isSecureRequest, refreshSession, setDbPasswordHash } from '../../../lib/auth';
import { q1 } from '../../../lib/db';
import { logActivity } from '../../../lib/seed';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  const session = sessionFromCookies(ctx.request.headers.get('cookie') || '');
  if (!session) return unauthorized();
  try {
    const body = (await readJson(ctx.request)) as { current?: unknown; next?: unknown; next2?: unknown };
    const current = str(body.current, 128);
    const next = str(body.next, 128);
    const next2 = str(body.next2, 128);

    if (next.length < 8) return fail('رمز جدید باید حداقل ۸ کاراکتر باشد', 'WEAK');
    if (next !== next2) return fail('تکرار رمز جدید با رمز جدید یکسان نیست', 'MISMATCH');

    /* رمز فعلی: اول هش دیتابیس (اگر هست)، بعد متغیر محیطی */
    const user = await q1<{ username: string; password_hash: string }>(
      'SELECT username, password_hash FROM users WHERE username = $1',
      [session.u],
    );
    const envHash = process.env.ADMIN_PASSWORD_HASH || '';
    const dbHash = user?.password_hash || '';
    const currentHash = sha256(current);
    const okCurrent = dbHash ? currentHash === dbHash : envHash ? currentHash === envHash : false;
    if (!okCurrent) return fail('رمز فعلی نادرست است', 'BAD_CURRENT');

    if (user) {
      await q1('UPDATE users SET password_hash = $1, updated_at = now() WHERE username = $2', [sha256(next), session.u]);
    } else {
      await q1('INSERT INTO users (username, password_hash) VALUES ($1, $2)', [session.u, sha256(next)]);
    }
    setDbPasswordHash(sha256(next));

    /* نشست فعلی هم تازه‌سازی می‌شود تا از ادامهٔ کار Interrupt نشود */
    const headers: Record<string, string> = { 'content-type': 'application/json; charset=utf-8' };
    const cookie = refreshSession({ u: session.u, role: session.role }, isSecureRequest(ctx.request));
    if (cookie) headers['set-cookie'] = cookie;
    await logActivity('security', 'users', null, 'رمز مدیر از پنل تغییر کرد');
    return new Response(JSON.stringify({ ok: true, message: 'رمز مدیر با موفقیت تغییر کرد', data: { changed: true } }), {
      status: 200,
      headers,
    });
  } catch (e) {
    return serverError(e);
  }
};
