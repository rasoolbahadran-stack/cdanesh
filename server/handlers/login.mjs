/* ═══ کافه‌دانش — ورود مدیر به پنل ابری (Vercel Function) ═══
   POST   /api/login   {username, password}  → ست‌کردن کوکی نشست
   GET    /api/login                             → بررسی اعتبار نشست فعلی
   PUT    /api/login {currentPassword, username?, newPassword?} → تغییر اعتبارنامه از پنل
   DELETE /api/login                             → خروج (پاک‌کردن کوکی)
   اعتبارنامه: اول users.json در فضای ابری (قابل تغییر از پنل)، بعد ADMIN_PASSWORD در ورسل. */
import {
  signToken, isAuthedAsync, sessionCookie, clearCookie,
  verifyLogin, changeCredentials,
  failCount, registerFail, clearFails, MAX_FAILS, json, readJsonBody, clientIp,
} from '../lib/admin-auth.mjs';

const MAX_AGE_SEC = 7 * 24 * 60 * 60; // نشست ۷ روزه

export default async function handler(req, res) {
  const method = (req.method || 'GET').toUpperCase();

  /* ─── بررسی نشست (برای پنل) ─── */
  if (method === 'GET') {
    const hasUsers = !!(process.env.BLOB_READ_WRITE_TOKEN);
    if (!process.env.ADMIN_PASSWORD && !hasUsers) {
      return json(res, 503, { ok: false, error: 'PASSWORD_NOT_SET' });
    }
    if (await isAuthedAsync(req)) return json(res, 200, { ok: true, mode: 'cloud', user: 'admin' });
    return json(res, 401, { ok: false, error: 'NO_SESSION' });
  }

  /* ─── تغییر نام کاربری/رمز از خود پنل (فقط با نشست معتبر) ─── */
  if (method === 'PUT') {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return json(res, 503, { ok: false, error: 'NO_BLOB', message: 'فضای ابری وصل نیست؛ ابتدا در ورسل Blob را متصل و ADMIN_PASSWORD را ثبت کن.' });
    }
    if (!(await isAuthedAsync(req))) return json(res, 401, { ok: false, error: 'UNAUTH', message: 'نشست منقضی شده؛ دوباره وارد شو.' });
    let body;
    try { body = await readJsonBody(req, 10 * 1024); }
    catch (e) { return json(res, 400, { ok: false, error: 'BAD_BODY' }); }
    const currentPassword = String(body.currentPassword == null ? '' : body.currentPassword);
    const newUsername = String(body.username || '').trim().slice(0, 40);
    const newPassword = String(body.newPassword == null ? '' : body.newPassword);
    if (newUsername && !/^[a-zA-Z0-9._-]{3,40}$/.test(newUsername)) {
      return json(res, 400, { ok: false, error: 'BAD_USER', message: 'نام کاربری فقط حروف/عدد انگلیسی، نقطه، خط تیره و زیرخط — حداقل ۳ کاراکتر.' });
    }
    if (!newUsername && !newPassword) return json(res, 400, { ok: false, error: 'NOTHING_TO_CHANGE', message: 'چیزی برای تغییر وارد نشده است.' });
    if (newPassword && newPassword.length < 8) {
      return json(res, 400, { ok: false, error: 'WEAK_PASS', message: 'رمز جدید حداقل ۸ کاراکتر باشد.' });
    }
    const r = await changeCredentials(currentPassword, newUsername, newPassword);
    if (!r.ok) {
      return json(res, 403, { ok: false, error: 'BAD_CURRENT', message: 'رمز فعلی درست نیست.' });
    }
    // نشست تازه با نسخهٔ جدید صادر می‌شود (نشست‌های دیگر دستگاه‌ها باطل شده‌اند)
    res.setHeader('Set-Cookie', sessionCookie(signToken(MAX_AGE_SEC, Date.now(), r.pv), MAX_AGE_SEC));
    return json(res, 200, { ok: true, username: r.username, message: 'اعتبارنامهٔ مدیر به‌روزرسانی شد؛ نشست‌های دیگر دستگاه‌ها بسته شدند.' });
  }

  /* ─── خروج ─── */
  if (method === 'DELETE') {
    res.setHeader('Set-Cookie', clearCookie());
    return json(res, 200, { ok: true });
  }

  /* ─── ورود ─── */
  if (method === 'POST') {
    const configured = !!(process.env.ADMIN_PASSWORD || process.env.BLOB_READ_WRITE_TOKEN);
    if (!configured) {
      return json(res, 503, {
        ok: false, error: 'PASSWORD_NOT_SET',
        message: 'رمز مدیر (ADMIN_PASSWORD) هنوز در تنظیمات ورسل ثبت نشده است.',
      });
    }

    const ip = clientIp(req);
    if (failCount(ip) >= MAX_FAILS) {
      return json(res, 429, {
        ok: false, error: 'LOCKED',
        message: 'به‌دلیل تلاش‌های ناموفق، ورود موقتاً قفل است. بعداً تلاش کن.',
      });
    }

    let body;
    try { body = await readJsonBody(req, 10 * 1024); }
    catch (e) { return json(res, 400, { ok: false, error: 'BAD_BODY' }); }

    const username = String(body.username || '').trim();
    const password = String(body.password == null ? '' : body.password);
    const v = await verifyLogin(username, password);

    if (v.ok) {
      clearFails(ip);
      res.setHeader('Set-Cookie', sessionCookie(signToken(MAX_AGE_SEC, Date.now(), v.pv), MAX_AGE_SEC));
      return json(res, 200, { ok: true, mode: 'cloud', user: v.user || 'admin' });
    }

    const left = MAX_FAILS - registerFail(ip);
    return json(res, 401, {
      ok: false, error: 'BAD_CREDENTIALS', left: Math.max(0, left),
      message: left > 0 ? 'نام کاربری یا رمز عبور درست نیست.' : 'ورود موقتاً قفل شد.',
    });
  }

  return json(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
}
