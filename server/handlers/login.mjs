/* ═══ کافه‌دانش — ورود مدیر به پنل ابری (Vercel Function) ═══
   POST   /api/login   {username, password}  → ست‌کردن کوکی نشست
   GET    /api/login                             → بررسی اعتبار نشست فعلی
   DELETE /api/login                             → خروج (پاک‌کردن کوکی)
   رمز مدیر در Environment Variable با نام ADMIN_PASSWORD نگهداری می‌شود. */
import {
  signToken, isAuthed, sessionCookie, clearCookie, safeEqual,
  failCount, registerFail, clearFails, MAX_FAILS, json, readJsonBody, clientIp,
} from '../lib/admin-auth.mjs';

const MAX_AGE_SEC = 7 * 24 * 60 * 60; // نشست ۷ روزه

export default async function handler(req, res) {
  const method = (req.method || 'GET').toUpperCase();

  /* ─── بررسی نشست (برای پنل) ─── */
  if (method === 'GET') {
    if (!process.env.ADMIN_PASSWORD) {
      return json(res, 503, { ok: false, error: 'PASSWORD_NOT_SET' });
    }
    if (isAuthed(req)) return json(res, 200, { ok: true, mode: 'cloud', user: 'admin' });
    return json(res, 401, { ok: false, error: 'NO_SESSION' });
  }

  /* ─── خروج ─── */
  if (method === 'DELETE') {
    res.setHeader('Set-Cookie', clearCookie());
    return json(res, 200, { ok: true });
  }

  /* ─── ورود ─── */
  if (method === 'POST') {
    if (!process.env.ADMIN_PASSWORD) {
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
    const userOk = safeEqual(username, process.env.ADMIN_USERNAME || 'admin');
    const passOk = safeEqual(password, process.env.ADMIN_PASSWORD);

    if (userOk && passOk) {
      clearFails(ip);
      res.setHeader('Set-Cookie', sessionCookie(signToken(), MAX_AGE_SEC));
      return json(res, 200, { ok: true, mode: 'cloud', user: 'admin' });
    }

    const left = MAX_FAILS - registerFail(ip);
    return json(res, 401, {
      ok: false, error: 'BAD_CREDENTIALS', left: Math.max(0, left),
      message: left > 0 ? 'نام کاربری یا رمز عبور درست نیست.' : 'ورود موقتاً قفل شد.',
    });
  }

  return json(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
}
