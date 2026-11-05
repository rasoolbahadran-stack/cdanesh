/* ═══ کافه‌دانش — هستهٔ احراز هویت و اعتبارسنجی پنل ابری ═══
   این ماژول منطق مشترک api/login.mjs و api/articles.mjs است و
   عمداً «خالص» نوشته شده تا با تست واحد هم قابل بررسی باشد.
   رمز مدیر در متغیر محیطی ورسل نگهداری می‌شود و هرگز در کد عمومی نیست.
   تغییر نام کاربری/رمز از خود پنل: در لایهٔ ذخیره‌سازی (دیتابیس Postgres یا
   در نبود آن Vercel Blob — کلید users.json) با هش pbkdf2 ذخیره می‌شود؛ شمارهٔ نسخهٔ رمز (pv) در توکن نشست می‌آید تا با هر تغییر رمز،
   همهٔ نشست‌های فعال روی همهٔ دستگاه‌ها بی‌اعتبار شوند. */
import crypto from 'node:crypto';
import { blobHead, blobPut, blobFetch } from './blob-safe.mjs';
import { readDoc, writeDoc, dbEnabled } from './store.mjs';

export const COOKIE_NAME = 'cd_admin';
const DAY = 24 * 60 * 60 * 1000;
const USERS_KEY = 'users.json';

function secret() {
  // اگر ADMIN_SESSION_SECRET ست شده باشد از همان استفاده می‌شود؛
  // در غیر این صورت رمز مدیر «امضای» توکن است — یعنی با عوض‌کردن
  // رمز در ورسل، همهٔ نشست‌های قبلی خودبه‌خود باطل می‌شوند.
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
}

/* ─── کاربران ابری (users.json در Blob) با کش ۴۵ ثانیه‌ای ─── */
let usersCache = { data: null, at: 0 };
/* آخرین خواندن users.json به‌خاطر خطای زیرساخت (کندی/قطعی Blob) شکست خورد —
   نه به‌خاطر «فایل هنوز ساخته نشده». برای تفکیک UNAUTH کاذب از pv=۰ واقعی. */
let usersReadDegraded = false;

function isNotFound(e) {
  return e && (e.name === 'BlobNotFoundError' || /not ?found|does ?not exist|NoSuchKey/i.test(String((e && e.message) || e)));
}

/* آیا فضای ذخیره‌سازی ساخت‌یافته داریم؟ (دیتابیس یا Blob — کافی است یکی)
   دیتابیس (DATABASE_URL) اولویت دارد؛ Blob حالت سازگاری قدیم است. */
export function hasAnyStorage() {
  return dbEnabled() || !!process.env.BLOB_READ_WRITE_TOKEN;
}

/* خواندن users.json از لایهٔ ذخیره‌سازی (دیتابیس → در نبود آن Blob).
   نبود سند = null (عادی)؛ خطای زیرساخت = throw (که با retry/کش مدیریت می‌شود). */
async function readUsersRaw() {
  if (dbEnabled()) return readDoc(USERS_KEY);
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const meta = await blobHead(USERS_KEY);
  const r = await blobFetch(meta.url);
  if (!r.ok) throw new Error('BLOB_FETCH_' + r.status);
  return r.json();
}

async function readUsers(force) {
  if (!hasAnyStorage()) return null;
  if (!force && usersCache.data && Date.now() - usersCache.at < 45 * 1000) return usersCache.data;
  const read = readUsersRaw;
  try {
    const u = await read();
    usersCache = { data: (u && u.username && u.hash) ? u : null, at: Date.now() };
    usersReadDegraded = false;
  } catch (e) {
    /* یک تلاش فوری دیگر: خطاهای گذرا (شروع سرد، کندی لحظه‌ای شبکه) همین‌جا جبران می‌شود */
    let u = null, failed = e;
    if (!isNotFound(e)) {
      try {
        await new Promise(r => setTimeout(r, 400));
        u = await read();
      } catch (e2) { failed = e2; }
    }
    if (u) {
      usersCache = { data: (u && u.username && u.hash) ? u : null, at: Date.now() };
      usersReadDegraded = false;
      return usersCache.data;
    }
    /* نکتهٔ مهم: شکستِ خواندن «کش» نمی‌شود (at=0) — درخواست بعدی دوباره تلاش می‌کند
       و از یک خطای گذرا، ۴۵ ثانیه وضعیت خراب ساخته نمی‌شود. */
    usersCache = { data: null, at: 0 };
    usersReadDegraded = !isNotFound(failed); // «سند نیست» وضعیت عادی است؛ بقیه = زیرساخت
  }
  return usersCache.data;
}

async function writeUsers(u) {
  await writeDoc(USERS_KEY, u);
  usersCache = { data: u, at: Date.now() };
}

/* بعد از مهاجرت یک‌کلیکی (Blob → دیتابیس) کش کاربر باید خالی شود */
export function resetUsersCache() {
  usersCache = { data: null, at: 0 };
  usersReadDegraded = false;
}

const hashOf = (password, salt) =>
  crypto.pbkdf2Sync(String(password), String(salt), 120000, 32, 'sha256').toString('hex');

export function makeUserRecord(username, password, prevPv) {
  const salt = crypto.randomBytes(16).toString('hex');
  return {
    username: String(username || 'admin').slice(0, 40),
    salt,
    hash: hashOf(password, salt),
    pv: (prevPv || 0) + 1,
    updated: new Date().toISOString(),
  };
}

/* ورود: اول کاربر ابری (users.json)، بعد متغیرهای محیطی (سازگاری با تنظیم اولیه)
   کلید اضطراری: اگر users.json وجود داشته باشد اما ورود با آن نخورد، رمز ورسل
   (ADMIN_PASSWORD) همیشه هم پذیرفته می‌شود — تا با هر تغییر رمز در ورسل،
   دسترسی مدیر هیچ‌وقت از دست نرود (ضد قفل‌شدگی). */
export async function verifyLogin(username, password) {
  const u = await readUsers().catch(() => null);
  if (u) {
    const userOk = safeEqual(username, u.username);
    const passOk = userOk && safeEqual(hashOf(password, u.salt), u.hash);
    if (userOk && passOk) return { ok: true, pv: u.pv || 0, user: u.username };
    if (process.env.ADMIN_PASSWORD) {
      const envUser = process.env.ADMIN_USERNAME || 'admin';
      if (safeEqual(username, envUser) && safeEqual(password, process.env.ADMIN_PASSWORD)) {
        return { ok: true, pv: u.pv || 0, user: envUser };
      }
    }
    return { ok: false, pv: u.pv || 0, user: u.username };
  }
  if (!process.env.ADMIN_PASSWORD) return { ok: false, unconfigured: true, pv: 0 };
  const userOk = safeEqual(username, process.env.ADMIN_USERNAME || 'admin');
  const passOk = safeEqual(password, process.env.ADMIN_PASSWORD);
  return { ok: userOk && passOk, pv: 0, user: process.env.ADMIN_USERNAME || 'admin' };
}

/* تغییر اعتبارنامه (فقط با نشست معتبر — از پنل) */
export async function changeCredentials(currentPassword, newUsername, newPassword) {
  const cur = await readUsers(true).catch(() => null);
  // بررسی رمز فعلی: ابری یا محیطی
  let okCur = false, pv = 0;
  if (cur) { okCur = safeEqual(hashOf(currentPassword, cur.salt), cur.hash); pv = cur.pv || 0; }
  else if (process.env.ADMIN_PASSWORD) { okCur = safeEqual(currentPassword, process.env.ADMIN_PASSWORD); pv = 0; }
  if (!okCur) return { ok: false, error: 'BAD_CURRENT' };
  const rec = makeUserRecord(newUsername || (cur ? cur.username : (process.env.ADMIN_USERNAME || 'admin')), newPassword, pv);
  await writeUsers(rec);
  return { ok: true, username: rec.username, pv: rec.pv };
}

/* شمارهٔ نسخهٔ اعتبارنامه — برای باطل‌کردن نشست‌ها پس از تغییر رمز */
/* نسخهٔ فعلی رمز؛ null یعنی «به‌دلیل خطای زیرساخت نامشخص» (نه pv=۰) */
export async function currentPv() {
  const u = await readUsers().catch(() => null);
  if (u) { usersReadDegraded = false; return u.pv || 0; }
  return usersReadDegraded ? null : 0;
}

/* ─── توکن نشست: exp.pv.hmac(exp:pv) ───
   pv = شمارهٔ نسخهٔ رمز؛ با تغییر رمز از پنل، pv بالا می‌رود و
   توکن‌های قدیمی روی همهٔ دستگاه‌ها بی‌اعتبار می‌شوند.
   توکن‌های قدیمی (exp.sig) به‌صورت سازگارانه pv=۰ فرض می‌شوند. */
export function signToken(ttlMs = 7 * DAY, now = Date.now(), pv = 0) {
  const exp = String(now + ttlMs);
  const v = String(pv || 0);
  const sig = crypto.createHmac('sha256', secret()).update('cdanesh-admin:' + exp + ':' + v).digest('base64url');
  return exp + '.' + v + '.' + sig;
}

export function verifyToken(token, now = Date.now()) {
  if (!token || !secret()) return false;
  const parts = token.split('.');
  if (parts.length < 2) return false;
  const exp = parts[0];
  const v = parts.length === 3 ? parts[1] : '0';
  const sig = parts[parts.length - 1];
  if (!/^\d+$/.test(exp) || Number(exp) < now) return false;
  if (!/^\d+$/.test(v)) return false;
  const want = crypto.createHmac('sha256', secret()).update('cdanesh-admin:' + exp + ':' + v).digest('base64url');
  const a = Buffer.from(sig), b = Buffer.from(want);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ─── کوکی ─── */
export function getCookie(req, name = COOKIE_NAME) {
  const raw = req.headers.cookie || '';
  const row = raw.split(/;\s*/).find(r => r.startsWith(name + '='));
  return row ? decodeURIComponent(row.slice(name.length + 1)) : '';
}

export function isAuthed(req, now = Date.now()) {
  return verifyToken(getCookie(req), now);
}

/* احراز هویت کامل: اعتبار توکن + تطبیق نسخهٔ رمز (باطل‌کردن نشست پس از تغییر رمز)
   کش ۴۵ ثانیه‌ای readUsers یعنی بیش از یک درخواست اضافی به Blob در هر ۴۵ ثانیه نمی‌رود. */
export async function isAuthedAsync(req, now = Date.now()) {
  if (!verifyToken(getCookie(req), now)) return false;
  const token = getCookie(req);
  const parts = token.split('.');
  const tokenPv = parts.length === 3 ? Number(parts[1]) : 0;
  const pv = await currentPv();
  /* اگر users.json فقط به‌خاطر کندی/قطعی Blob خوانده نشد (pv = null)،
     توکن از نظر رمزنگاری معتبر است؛ نباید مدیر را بی‌جهت UNAUTH کنیم.
     (اگر واقعاً رمز عوض شده باشد، دفعهٔ بعد که Blob خوانا شود اعمال می‌شود.) */
  if (pv === null) return true;
  return tokenPv === pv;
}

export function sessionCookie(token, maxAgeSec) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
}

export const clearCookie = () => sessionCookie('', 0);

/* ─── مقایسهٔ زمان‌ثابت (ضد timing attack) ─── */
export function safeEqual(a, b) {
  const ba = Buffer.from(String(a == null ? '' : a));
  const bb = Buffer.from(String(b == null ? '' : b));
  if (ba.length !== bb.length) {
    try { crypto.timingSafeEqual(ba, ba); } catch (e) { /* noop */ }
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

/* ─── محدودساز تلاش ورود (در حافظهٔ هر نمونهٔ سرور) ─── */
const FAIL_MS = 15 * 60 * 1000;
const fails = new Map();

export function failCount(ip, now = Date.now()) {
  const f = fails.get(ip);
  return f && now - f.at < FAIL_MS ? f.count : 0;
}

export function registerFail(ip, now = Date.now()) {
  const count = failCount(ip, now) + 1;
  fails.set(ip, { count, at: now });
  if (fails.size > 5000) {
    for (const [k, v] of fails) if (now - v.at > FAIL_MS) fails.delete(k);
  }
  return count;
}

export const clearFails = ip => fails.delete(ip);
export const MAX_FAILS = 5;

/* ─── اعتبارسنجی لیست مقالات ورودی (PUT) ───
   خروجی: null یعنی معتبر؛ در غیر این صورت پیام خطای فارسی */
export function validateArticles(list) {
  if (!Array.isArray(list)) return 'داده ارسالی یک فهرست نیست.';
  if (list.length > 300) return 'تعداد مقالات بیش از حد مجاز (۳۰۰) است.';
  const seen = new Set();
  for (const a of list) {
    const msg = validateSingleArticle(a);
    if (msg) return msg;
    if (seen.has(a.slug)) return 'اسلاگ تکراری است: ' + a.slug;
    seen.add(a.slug);
  }
  return null;
}

/* اعتبارسنجی «یک» مقاله (ذخیرهٔ تکی POST) — همان قواعد، با پیام دقیق */
export function validateSingleArticle(a) {
  if (!a || typeof a !== 'object' || Array.isArray(a)) return 'ساختار مقاله نامعتبر است.';
  if (typeof a.slug !== 'string' || !/^[a-zA-Z0-9\u0600-\u06FF-]{1,80}$/.test(a.slug)) {
    return 'اسلاگ نامعتبر است: ' + String(a.slug == null ? '—' : a.slug).slice(0, 40);
  }
  if (typeof a.title !== 'string' || !a.title.trim() || a.title.length > 300) {
    return 'عنوان مقاله با اسلاگ «' + a.slug + '» نامعتبر است.';
  }
  if (JSON.stringify(a).length > 200 * 1024) return 'حجم مقاله «' + a.slug + '» بیش از حد مجاز است.';
  if (a.status && !['published', 'draft', 'scheduled'].includes(a.status)) {
    return 'وضعیت نامعتبر برای مقاله «' + a.slug + '».';
  }
  return null;
}

/* ─── فیلتر عمومی: حذف پیش‌نویس و زمان‌بندی‌شدهٔ نرسیده ─── */
export function isPublicNow(a, now = Date.now()) {
  if (!a || typeof a !== 'object') return false;
  if (a.status === 'draft') return false;
  if (a.status === 'scheduled') {
    if (!a.publishAt) return false;
    const t = new Date(a.publishAt).getTime();
    return Number.isFinite(t) && t <= now;
  }
  return true;
}

export function publicOnly(list, now = Date.now()) {
  return (Array.isArray(list) ? list : []).filter(a => isPublicNow(a, now));
}

/* ─── مرتب‌سازی استاندارد (جدیدترین اول) ─── */
export const sorted = list =>
  (Array.isArray(list) ? list.slice() : []).sort((x, y) => (y.sort || 0) - (x.sort || 0));

/* ─── پاسخ JSON کوتاه ─── */
export function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

/* ─── خواندن بدنهٔ JSON با سقف حجم ─── */
export function readJsonBody(req, limit = 3 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let d = '';
    req.on('data', c => {
      d += c;
      if (d.length > limit) { reject(new Error('BODY_TOO_LARGE')); req.destroy(); }
    });
    req.on('end', () => {
      if (!d) return resolve({});
      try { resolve(JSON.parse(d)); }
      catch (e) { reject(new Error('BAD_JSON')); }
    });
    req.on('error', reject);
  });
}

export function clientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}
