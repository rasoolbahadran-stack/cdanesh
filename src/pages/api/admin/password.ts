/* تغییر رمز حساب — /api/admin/password
   ---------------------------------------------------------------------------
   سیاست امنیتی (مطابق اصلاحیهٔ امنیت پنل):
   • رمز فعلی باید درست باشد (تطبیق سمت سرور با هش bcrypt/SHA-256 ذخیره‌شده).
   • رمز جدید: حداقل ۱۰ کاراکتر، ترکیب حروف و اعداد (حداقل دو دستهٔ کاراکتر)،
     رد رمزهای ضعیف و پرتکرار، رد رمز یکسان با رمز فعلی.
   • ذخیره با bcrypt (هزینهٔ 10)؛ هش قدیمی SHA-256 در همین فرصت به bcrypt ارتقا می‌یابد.
   • پس از تغییر: pwd_version+1 → تمام نشست‌های قبلی باطل می‌شوند؛ فقط نشست
     فعلی با کوکی تازه ادامه می‌یابد. پرچم must_change_password صفر می‌شود.
   • هش رمز هرگز به مرورگر بازگردانده نمی‌شود و رمز خام هیچ‌جا ذخیره/لاگ نمی‌شود.
   --------------------------------------------------------------------------- */
import type { APIRoute } from 'astro';
import { fail, unauthorized, serverError, readJson, str } from '../../../lib/http';
import { sessionFromCookies, sha256, isSecureRequest, refreshSession, configuredPasswordHash, verifyPassword, hashPassword } from '../../../lib/auth';
import { q1 } from '../../../lib/db';
import { logActivity } from '../../../lib/seed';

export const prerender = false;

const WEAK_LIST = new Set([
  '12345678', '123456789', '1234567890', 'password', 'password1', 'password123',
  'qwerty123', 'qwerty12345', 'admin123', 'admin1234', 'admin12345', 'admin123456', 'administrator', 'admin2024', 'admin2025', 'admin2026',
  'azarakhsh', 'azarakhsh123', 'azarakhsh1234', 'cafedanesh', 'cdanesh', 'cdanesh123', 'cdanesh1234',
  'iloveyou', '11111111', '00000000', '12341234', 'abcdefgh', 'asdfghjk', 'letmein123',
  'abcd1234ef', 'changeme123', 'p@ssw0rd', 'p@ssw0rd1',
]);

export const POST: APIRoute = async (ctx) => {
  const session = sessionFromCookies(ctx.request.headers.get('cookie') || '');
  if (!session) return unauthorized();
  try {
    const body = (await readJson(ctx.request)) as { current?: unknown; next?: unknown; next2?: unknown };
    const current = str(body.current, 128);
    const next = str(body.next, 128);
    const next2 = str(body.next2, 128);

    /* --- سیاست رمز جدید --- */
    if (next.length < 10) return fail('رمز جدید باید حداقل ۱۰ کاراکتر باشد', 'WEAK');
    if (next !== next2) return fail('تکرار رمز جدید با رمز جدید یکسان نیست', 'MISMATCH');
    if (WEAK_LIST.has(next.toLowerCase())) return fail('این رمز بسیار ضعیف و پرتکرار است؛ رمز قوی‌تری انتخاب کنید', 'WEAK_COMMON');
    const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((r) => r.test(next)).length;
    if (classes < 2) return fail('رمز جدید باید ترکیبی از حروف و اعداد (یا نماد) باشد — حداقل دو نوع کاراکتر', 'WEAK_VARIETY');
    if (next === current) return fail('رمز جدید نباید با رمز فعلی یکسان باشد', 'SAME_AS_CURRENT');

    /* --- تطبیق رمز فعلی --- */
    let storedHash = '';
    let byId = 0;
    if (session.uid > 0) {
      const row = await q1<{ id: number; password_hash: string }>(
        'SELECT id, password_hash FROM users WHERE id = $1',
        [session.uid],
      );
      if (row) { storedHash = row.password_hash || ''; byId = Number(row.id); }
    } else {
      const row = await q1<{ id: number; password_hash: string }>(
        'SELECT id, password_hash FROM users WHERE username = $1',
        [session.u],
      );
      if (row) { storedHash = row.password_hash || ''; byId = Number(row.id); }
      else storedHash = configuredPasswordHash();
    }

    if (storedHash) {
      const verdict = await verifyPassword(current, storedHash);
      if (!verdict.ok) return fail('رمز فعلی نادرست است', 'BAD_CURRENT');
    } else {
      return fail('مرجع رمز یافت نشد؛ ابتدا با حساب مدیریتی وارد شوید', 'NO_HASH');
    }

    /* --- ذخیرهٔ رمز جدید با bcrypt --- */
    const newHash = await hashPassword(next);
    if (byId > 0) {
      await q1('UPDATE users SET password_hash = $1, updated_at = now(), must_change_password = 0, pwd_version = pwd_version + 1 WHERE id = $2', [newHash, byId]);
    } else {
      // حساب مرجع محیطی: در دیتابیس ثبت می‌شود تا پس از این از دیتابیس احراز شود
      await q1('INSERT INTO users (username, password_hash, role, must_change_password) VALUES ($1, $2, $3, 0)', [session.u, newHash, 'admin']);
      const created = await q1<{ id: number }>('SELECT id FROM users WHERE username = $1', [session.u]);
      byId = Number(created?.id || 0);
    }
    const newVid = Number(session.vid || 0) + 1;

    /* نشست فعلی با کوکی تازه ادامه می‌یابد؛ همهٔ نشست‌های دیگر به‌دلیل
       vid جدید در میان‌افزار رد می‌شوند (خروج از تمام نشست‌ها). */
    const headers: Record<string, string> = { 'content-type': 'application/json; charset=utf-8' };
    const cookie = refreshSession({ u: session.u, uid: byId || session.uid, role: session.role, vid: newVid }, isSecureRequest(ctx.request));
    if (cookie) headers['set-cookie'] = cookie;
    await logActivity('security', 'users', byId || null, 'رمز حساب از پنل تغییر کرد و نشست‌های قبلی باطل شدند');
    return new Response(JSON.stringify({ ok: true, message: 'رمز با موفقیت تغییر کرد؛ نشست‌های دیگر باطل شدند', data: { changed: true } }), {
      status: 200,
      headers,
    });
  } catch (e) {
    return serverError(e);
  }
};

/* جلوگیری از حذف warn بلااستفاده در برخی بیلدها */
void sha256;
