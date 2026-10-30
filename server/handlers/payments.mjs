/* ═══ کافه‌دانش — مدیریت درگاه پرداخت (Vercel Function + Vercel Blob) ═══
   GET /api/payments            → درگاه‌های فعال برای سایت (عمومی)؛
                                  با کوکی مدیر → کل فهرست
   PUT /api/payments {gateways:[…]} → ذخیرهٔ کل فهرست (فقط مدیر)
   داده در Vercel Blob با نام ثابت payments.json نگهداری می‌شود؛
   تا اولین ذخیره، پاسخ EMPTY است و دکمه‌های پرداخت سایت مخفی می‌مانند. */
import { head, put } from '@vercel/blob';
import { isAuthedAsync, json, readJsonBody } from '../lib/admin-auth.mjs';

const BLOB_KEY = 'payments.json';
const MAX_GATEWAYS = 20;

function isNotFound(e) {
  return e && (e.name === 'BlobNotFoundError' || /not ?found|does ?not exist|NoSuchKey/i.test(String((e && e.message) || e)));
}

async function readBlob() {
  const meta = await head(BLOB_KEY);
  const r = await fetch(meta.url, { cache: 'no-store' });
  if (!r.ok) throw new Error('BLOB_FETCH_' + r.status);
  const list = await r.json();
  return Array.isArray(list) ? list : [];
}

async function writeBlob(list) {
  await put(BLOB_KEY, JSON.stringify(list), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json; charset=utf-8',
  });
}

const clean = (v, max) => String(v == null ? '' : v).trim().slice(0, max);

/* اعتبارسنجی فهرست درگاه‌ها؛ خروجی: null یعنی معتبر */
function validateGateways(list) {
  if (!Array.isArray(list)) return 'داده ارسالی یک فهرست نیست.';
  if (list.length > MAX_GATEWAYS) return 'تعداد درگاه‌ها بیش از حد مجاز (۲۰) است.';
  for (const g of list) {
    if (!g || typeof g !== 'object') return 'ساختار یکی از درگاه‌ها نامعتبر است.';
    const name = clean(g.name, 60);
    const url = clean(g.url, 500);
    if (!name) return 'نام درگاه الزامی است.';
    if (!/^https:\/\/[^\s]+\.[^\s]+/i.test(url)) return 'آدرس درگاه «' + name + '» باید یک لینک https معتبر باشد.';
    if (g.pkg && !/^(starter|pro|shop|custom)$/.test(String(g.pkg))) return 'پکیج مرتبط درگاه «' + name + '» نامعتبر است.';
    if (JSON.stringify(g).length > 4 * 1024) return 'حجم دادهٔ درگاه «' + name + '» بیش از حد مجاز است.';
  }
  return null;
}

/* در هر گروه پکیج (pkg) فقط یک درگاه فعال بماند؛
   درگاه‌های بدون pkg یک گروه مستقل‌اند. این‌طوری می‌شود برای هر پکیج
   یک درگاه جدا (با لینک و مبلغ خودش) ثبت کرد. */
function singleActive(list) {
  const seen = new Set();
  return list.map(g => {
    const grp = String(g.pkg || '');
    const active = !!g.active && !seen.has(grp);
    if (active) seen.add(grp);
    return Object.assign({}, g, { active });
  });
}

export default async function handler(req, res) {
  const method = (req.method || 'GET').toUpperCase();
  const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

  if (method === 'GET') {
    if (!hasBlob) {
      return json(res, 503, { ok: false, error: 'NO_BLOB', message: 'فضای ابری (Vercel Blob) هنوز به پروژه وصل نشده است.' });
    }
    const authed = await isAuthedAsync(req);
    let list;
    try { list = await readBlob(); }
    catch (e) {
      if (isNotFound(e)) return json(res, 200, { ok: true, mode: 'cloud', count: 0, gateways: [] });
      return json(res, 500, { ok: false, error: 'BLOB_ERROR', message: String((e && e.message) || e) });
    }
    const out = authed
      ? list
      : list.filter(g => g.active).map(g => ({ id: g.id, name: g.name, url: g.url, pkg: g.pkg || '' })); // عمومی: فقط فعال‌ها بدون یادداشت
    return json(res, 200, { ok: true, mode: 'cloud', count: out.length, gateways: out });
  }

  if (method === 'PUT' || method === 'POST') {
    if (!hasBlob) {
      return json(res, 503, { ok: false, error: 'NO_BLOB', message: 'فضای ابری (Vercel Blob) هنوز به پروژه وصل نشده است.' });
    }
    if (!(await isAuthedAsync(req))) return json(res, 401, { ok: false, error: 'UNAUTH', message: 'نشست منقضی شده؛ دوباره وارد شو.' });

    let body;
    try { body = await readJsonBody(req, 256 * 1024); }
    catch (e) {
      const err = String((e && e.message) || e);
      return json(res, err === 'BODY_TOO_LARGE' ? 413 : 400, { ok: false, error: err });
    }

    const invalid = validateGateways(body.gateways);
    if (invalid) return json(res, 400, { ok: false, error: 'INVALID', message: invalid });

    const cleanList = singleActive(body.gateways).map(g => ({
      id: clean(g.id, 40) || ('g' + Date.now()),
      name: clean(g.name, 60),
      url: clean(g.url, 500),
      active: !!g.active,
      pkg: /^(starter|pro|shop|custom)$/.test(String(g.pkg || '')) ? String(g.pkg) : '',
      note: clean(g.note, 300),
    }));

    try {
      await writeBlob(cleanList);
      return json(res, 200, { ok: true, count: cleanList.length, gateways: cleanList });
    } catch (e) {
      return json(res, 500, { ok: false, error: 'BLOB_ERROR', message: String((e && e.message) || e) });
    }
  }

  return json(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
}
