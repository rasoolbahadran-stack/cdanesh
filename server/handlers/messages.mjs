/* ═══ کافه‌دانش — پیام‌های ابری (فرم تماس و درخواست) ═══
   POST /api/messages  {message:{…}}  → ثبت پیام جدید (عمومی — فرم‌های سایت)
   GET  /api/messages                 → کل فهرست (فقط مدیر)
   PUT  /api/messages {messages:[…]}  → ذخیرهٔ کل فهرست (وضعیت‌ها/حذف — فقط مدیر)
   داده در Vercel Blob با نام ثابت messages.json نگهداری می‌شود. */
import { blobHead, blobPut, blobFetch, ADMIN_MS } from '../lib/blob-safe.mjs';
import { isAuthedAsync, json, readJsonBody, clientIp } from '../lib/admin-auth.mjs';

const BLOB_KEY = 'messages.json';
const MAX_MESSAGES = 300;
const MAX_LEN = { name: 80, phone: 14, email: 120, service: 40, subject: 200, package: 80, budget: 60, message: 4000 };

/* نبود فایل در Blob با خطای مشخص */
function isNotFound(e) {
  return e && (e.name === 'BlobNotFoundError' || /not ?found|does ?not exist|NoSuchKey/i.test(String((e && e.message) || e)));
}

async function readBlob() {
  const meta = await blobHead(BLOB_KEY);
  const r = await blobFetch(meta.url);
  if (!r.ok) throw new Error('BLOB_FETCH_' + r.status);
  const list = await r.json();
  return Array.isArray(list) ? list : [];
}

async function writeBlob(list, ms) {
  await blobPut(BLOB_KEY, JSON.stringify(list), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json; charset=utf-8',
    ...(ms ? { ms } : {}),
  });
}

/* ─── نرمال‌سازی ارقام فارسی/عربی و اعتبارسنجی موبایل ایران ─── */
function normalizeDigits(v) {
  return String(v || '')
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[\s\-()]/g, '');
}

const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ─── محدودساز نرخ ارسال پیام (هر IP: حداکثر ۵ پیام در ۱۰ دقیقه) ─── */
const WIN_MS = 10 * 60 * 1000;
const hits = new Map();
function tooMany(ip, now = Date.now()) {
  const arr = (hits.get(ip) || []).filter(t => now - t < WIN_MS);
  if (arr.length >= 5) { hits.set(ip, arr); return true; }
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some(t => now - t < WIN_MS)) hits.delete(k);
  }
  return false;
}

/* اعتبارسنجی پیام ورودی؛ خروجی: {rec} یا {error}
   بدنه می‌تواند تخت (فیلدها مستقیم) یا تودرتو ({message:{…}}) باشد. */
function buildRecord(body, now) {
  const m = (body && typeof body === 'object' && body.message && typeof body.message === 'object')
    ? body.message
    : (body || {});
  const kind = m.kind === 'request' ? 'request' : 'contact';
  const name = clean(m.name, MAX_LEN.name);
  const phone = normalizeDigits(m.phone);
  const email = clean(m.email, MAX_LEN.email);
  const message = clean(m.message, MAX_LEN.message);
  const subject = clean(m.subject, MAX_LEN.subject);
  const service = clean(m.service, MAX_LEN.service);
  const pkg = clean(m.package, MAX_LEN.package);
  const budget = clean(m.budget, MAX_LEN.budget);

  if (name.length < 2) return { error: 'نام را کامل وارد کنید.' };
  if (!/^09\d{9}$/.test(phone)) return { error: 'شماره موبایل معتبر نیست.' };
  if (email && !EMAIL_RE.test(email)) return { error: 'ایمیل معتبر نیست.' };
  if (message.length < 5) return { error: 'متن پیام خیلی کوتاه است.' };

  const d = now;
  const pad = n => String(n).padStart(2, '0');
  const ref = 'CD-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate())
    + '-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds())
    + '-' + Math.random().toString(36).slice(2, 4).toUpperCase();

  return {
    rec: {
      id: 'm' + d.getTime().toString(36) + Math.random().toString(36).slice(2, 6),
      ref, kind, name, phone, email,
      service, subject, package: pkg, budget, message,
      date: d.toISOString(),
      status: 'new',
    },
  };
}

/* اعتبارسنجی فهرست ورودی مدیر (PUT) */
function validateList(list) {
  if (!Array.isArray(list)) return 'داده ارسالی یک فهرست نیست.';
  if (list.length > MAX_MESSAGES) return 'تعداد پیام‌ها بیش از حد مجاز است.';
  for (const m of list) {
    if (!m || typeof m !== 'object') return 'ساختار یکی از پیام‌ها نامعتبر است.';
    if (!m.id || typeof m.id !== 'string') return 'هر پیام باید شناسه داشته باشد.';
    if (m.status && !['new', 'read', 'replied'].includes(m.status)) {
      return 'وضعیت نامعتبر برای پیام ' + m.id;
    }
    if (JSON.stringify(m).length > 16 * 1024) return 'حجم یکی از پیام‌ها بیش از حد مجاز است.';
  }
  return null;
}

const newestFirst = list =>
  list.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

export default async function handler(req, res) {
  const method = (req.method || 'GET').toUpperCase();
  const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

  /* ─── ثبت پیام جدید (عمومی) ─── */
  if (method === 'POST') {
    if (!hasBlob) {
      return json(res, 503, { ok: false, error: 'NO_BLOB', message: 'فضای ابری (Vercel Blob) هنوز به پروژه وصل نشده است.' });
    }
    const ip = clientIp(req);
    if (tooMany(ip)) {
      return json(res, 429, { ok: false, error: 'RATE_LIMITED', message: 'پیام‌های زیادی ارسال شده؛ کمی بعد دوباره تلاش کنید.' });
    }

    let body;
    try { body = await readJsonBody(req, 64 * 1024); }
    catch (e) {
      const err = String((e && e.message) || e);
      return json(res, err === 'BODY_TOO_LARGE' ? 413 : 400, { ok: false, error: err });
    }

    // تلهٔ اسپم: فیلد website باید خالی بماند — پر بودن یعنی ربات؛ پاسخ موفق بی‌ثبت
    if (clean(body.website, 100)) return json(res, 200, { ok: true, ignored: true });

    const built = buildRecord(body, new Date());
    if (built.error) return json(res, 400, { ok: false, error: 'INVALID', message: built.error });

    let list = [];
    try { list = await readBlob(); }
    catch (e) {
      if (!isNotFound(e)) return json(res, 500, { ok: false, error: 'BLOB_ERROR', message: String((e && e.message) || e) });
    }
    list.unshift(built.rec);
    if (list.length > MAX_MESSAGES) list = list.slice(0, MAX_MESSAGES);
    try {
      await writeBlob(list);
      /* اعلان فوری تلگرام (اختیاری): اگر TELEGRAM_BOT_TOKEN و TELEGRAM_CHAT_ID
         در متغیرهای محیطی ورسل تنظیم شده باشد، پیام همان لحظه برای مدیر ارسال می‌شود.
         هر خطا روی ثبت پیام اثر ندارد (fire-and-forget با تایم‌اوت). */
      try {
        const tk = process.env.TELEGRAM_BOT_TOKEN, chatId = process.env.TELEGRAM_CHAT_ID;
        if (tk && chatId) {
          const rec = built.rec;
          const digits = String(rec.phone || '').replace(/\D/g, '');
          const intl = digits.startsWith('98') ? digits : (digits.startsWith('0') ? '98' + digits.slice(1) : digits);
          const wa = intl ? ('https://wa.me/' + intl) : '';
          const txt = '🔔 پیام جدید کافه‌دانش\n'
            + (rec.kind === 'request' ? 'درخواست خدمات' : 'پیام تماس') + ' — کد ' + rec.ref + '\n'
            + 'نام: ' + rec.name + '\n'
            + 'موبایل: ' + rec.phone + (rec.email ? '\nایمیل: ' + rec.email : '') + '\n'
            + (rec.service ? 'خدمت: ' + rec.service + '\n' : '')
            + (rec.package ? 'پکیج: ' + rec.package + '\n' : '')
            + (rec.budget ? 'بودجه: ' + rec.budget + '\n' : '')
            + '\n' + rec.message + (wa ? '\n\nپاسخ در واتس‌اپ:\n' + wa : '');
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 5000);
          try {
            await fetch('https://api.telegram.org/bot' + tk + '/sendMessage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chatId, text: txt.slice(0, 3500) }),
              signal: ctrl.signal,
            });
          } finally { clearTimeout(timer); }
        }
      } catch (e) { /* اعلان اختیاری است — خطا نادیده گرفته می‌شود */ }
      return json(res, 200, { ok: true, ref: built.rec.ref, id: built.rec.id, count: list.length });
    } catch (e) {
      return json(res, 500, { ok: false, error: 'BLOB_ERROR', message: String((e && e.message) || e) });
    }
  }

  /* ─── فهرست پیام‌ها (فقط مدیر) ─── */
  if (method === 'GET') {
    if (!hasBlob) {
      return json(res, 503, { ok: false, error: 'NO_BLOB', message: 'فضای ابری (Vercel Blob) هنوز به پروژه وصل نشده است.' });
    }
    if (!(await isAuthedAsync(req))) return json(res, 401, { ok: false, error: 'UNAUTH', message: 'نشست منقضی شده؛ دوباره وارد شو.' });
    try {
      const list = await readBlob();
      return json(res, 200, { ok: true, mode: 'cloud', count: list.length, messages: newestFirst(list) });
    } catch (e) {
      if (isNotFound(e)) return json(res, 200, { ok: true, mode: 'cloud', count: 0, messages: [] });
      return json(res, 500, { ok: false, error: 'BLOB_ERROR', message: String((e && e.message) || e) });
    }
  }

  /* ─── ذخیرهٔ کل فهرست (وضعیت/حذف — فقط مدیر) ─── */
  if (method === 'PUT') {
    if (!hasBlob) {
      return json(res, 503, { ok: false, error: 'NO_BLOB', message: 'فضای ابری (Vercel Blob) هنوز به پروژه وصل نشده است.' });
    }
    if (!(await isAuthedAsync(req))) return json(res, 401, { ok: false, error: 'UNAUTH', message: 'نشست منقضی شده؛ دوباره وارد شو.' });

    let body;
    try { body = await readJsonBody(req, 2 * 1024 * 1024); }
    catch (e) {
      const err = String((e && e.message) || e);
      return json(res, err === 'BODY_TOO_LARGE' ? 413 : 400, { ok: false, error: err });
    }

    const invalid = validateList(body.messages);
    if (invalid) return json(res, 400, { ok: false, error: 'INVALID', message: invalid });

    const cleanList = newestFirst(body.messages).slice(0, MAX_MESSAGES);
    try {
      await writeBlob(cleanList, ADMIN_MS); // عملیات مدیر — سقف ۶۰ ثانیه
      return json(res, 200, { ok: true, count: cleanList.length, messages: cleanList });
    } catch (e) {
      return json(res, 500, { ok: false, error: 'BLOB_ERROR', message: String((e && e.message) || e) });
    }
  }

  return json(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
}
