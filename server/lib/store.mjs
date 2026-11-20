/* ═══ کافه‌دانش CMS — لایهٔ ذخیره‌سازی یکپارچه (Postgres + Vercel Blob) ═══
   معماری «مسیر ب»: داده‌های ساخت‌یافته (مقالات، صفحات، پیام‌ها، درگاه‌ها، کاربران)
   در یک پایگاه دادهٔ واقعی PostgreSQL (پلن رایگان Neon متصل به ورسل) نگهداری
   می‌شوند؛ فایل‌های رسانه (تصاویر و …) همان‌طور که قبل در Vercel Blob می‌مانند.

   • اگر DATABASE_URL در متغیرهای محیطی ست شده باشد → همهٔ خواندن/نوشتن‌ها با
     پایگاه داده انجام می‌شود (سریع، اتمیک، بدون شروع سردِ چندثانیه‌ای Blob).
   • اگر DATABASE_URL ست نباشد → دقیقاً رفتار قبلی (Blob) اجرا می‌شود؛ یعنی
     انتشار این نسخه هیچ‌چیز را قبل از تنظیم دیتابیس نمی‌شکند.
   • کلیدها همان نام‌های قبلی هستند (articles.json ، pages.json و…) تا
     «مهاجرت یک‌کلیکی» فقط کپی همین سندها از Blob به دیتابیس باشد.

   جدول‌ها (خودکار ساخته می‌شوند):
     cd_docs(key TEXT PK, value JSONB, updated_at)          ← سندهای JSON
     cd_revisions(id, doc_key, data JSONB, saved_at)        ← تاریخچهٔ نسخه‌ها */
import { blobHead, blobPut, blobFetch, PUBLIC_MS, ADMIN_MS } from './blob-safe.mjs';

export const DB_MS = 20000; // سقف هر پرس‌وجوی دیتابیس

/* ─── تشخیص حالت ───
   فقط رشتهٔ اتصال واقعی Postgres معتبر است؛ هر مقدار دیگری (مقدار اشتباه،
   آدرس فایل و…) نادیده گرفته می‌شود تا به‌جای خطا، به حالت سازگاری Blob برویم. */
export function dbEnabled() {
  const cs = process.env.DATABASE_URL || '';
  return /^postgres(ql)?:\/\//i.test(cs);
}

/* ─── استخر اتصال (تنبل + یکی برای کل پروسه) ─── */
let _pool = null;
let _schemaPromise = null;

function sslFor(cs) {
  if (/sslmode=disable/i.test(cs)) return false;
  if (/localhost|127\.0\.0\.1|\[::1\]/i.test(cs)) return false;
  /* Neon و همهٔ سرویس‌های Postgres ابری TLS می‌خواهند؛ امضای سرور رایگان‌ها
     معمولاً CA عمومی نیست — rejectUnauthorized:false استاندارد این سرویس‌هاست. */
  return { rejectUnauthorized: false };
}

async function getPool() {
  if (_pool) return _pool;
  const pg = await import('pg');
  const cs = process.env.DATABASE_URL;
  _pool = new pg.default.Pool({
    connectionString: cs,
    max: 3, // سرورلس — اتصال‌های موازی کم
    idleTimeoutMillis: 15000,
    connectionTimeoutMillis: 10000,
    ssl: sslFor(cs),
  });
  /* سقف زمانی هر دستور SQL — روی خودِ پایگاه داده اعمال می‌شود */
  _pool.on('error', () => { /* خطای اتصال بی‌کار: نادیده (درخواست‌ها با race guard محافظت می‌شوند) */ });
  return _pool;
}

async function withTimeout(p, ms) {
  let t;
  const timeout = new Promise((_, rej) => { t = setTimeout(() => rej(new Error('DB_TIMEOUT')), ms || DB_MS); });
  try { return await Promise.race([p, timeout]); }
  finally { clearTimeout(t); }
}

/* ─── ساخت خودکار جدول‌ها (یک‌بار در هر پروسه) ─── */
export async function ensureSchema() {
  if (!_schemaPromise) {
    _schemaPromise = (async () => {
      const pool = await getPool();
      await withTimeout(pool.query(`
        CREATE TABLE IF NOT EXISTS cd_docs (
          key        TEXT PRIMARY KEY,
          value      JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`), 15000);
      await withTimeout(pool.query(`
        CREATE TABLE IF NOT EXISTS cd_revisions (
          id       BIGSERIAL PRIMARY KEY,
          doc_key  TEXT NOT NULL,
          data     JSONB NOT NULL,
          saved_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`), 15000);
      await withTimeout(pool.query(`
        CREATE INDEX IF NOT EXISTS cd_revisions_key_idx
          ON cd_revisions (doc_key, saved_at DESC)`), 15000);
    })().catch(e => { _schemaPromise = null; throw e; });
  }
  return _schemaPromise;
}

/* ─── وضعیت اتصال (برای کارت داشبورد) ─── */
export async function pingDb() {
  if (!dbEnabled()) return { enabled: false, ok: false, error: 'NOT_CONFIGURED' };
  try {
    const pool = await getPool();
    await withTimeout(pool.query('SELECT 1'), 8000);
    return { enabled: true, ok: true, error: '' };
  } catch (e) {
    return { enabled: true, ok: false, error: String((e && e.message) || e).slice(0, 200) };
  }
}

/* ═══ سندها ═══
   قرارداد یکسان در هر دو حالت:
   • readDoc  → مقدار JSON یا null (نبود سند عادی است، خطا نیست)
   • هر خطای زیرساخت throw می‌شود تا هندلر ۵۰۳/۵۰۰ روشن بدهد */

async function readDocBlob(key) {
  const meta = await blobHead(key); // نبود → BlobNotFoundError → null
  const r = await blobFetch(meta.url);
  if (!r.ok) throw new Error('BLOB_FETCH_' + r.status);
  return r.json();
}

export async function readDoc(key, opts = {}) {
  if (dbEnabled()) {
    const pool = await getPool();
    await ensureSchema();
    const r = await withTimeout(pool.query('SELECT value FROM cd_docs WHERE key = $1', [key]), opts.ms);
    return r.rows.length ? r.rows[0].value : null;
  }
  try {
    return await readDocBlob(key);
  } catch (e) {
    if (isBlobNotFound(e)) return null;
    throw e;
  }
}

export async function writeDoc(key, value, opts = {}) {
  if (dbEnabled()) {
    const pool = await getPool();
    await ensureSchema();
    await withTimeout(pool.query(
      `INSERT INTO cd_docs (key, value, updated_at) VALUES ($1, $2::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [key, JSON.stringify(value == null ? null : value)]
    ), opts.ms || ADMIN_MS);
    return;
  }
  await blobPut(key, JSON.stringify(value), {
    access: 'public', addRandomSuffix: false, contentType: 'application/json; charset=utf-8',
    ms: opts.ms || ADMIN_MS,
  });
}

function isBlobNotFound(e) {
  return e && (e.name === 'BlobNotFoundError' || /not ?found|does ?not exist|NoSuchKey/i.test(String((e && e.message) || e)));
}

/* ─── خواندن → تغییر → نوشتن، به‌صورت اتمیک ───
   در حالت دیتابیس: تراکنش واقعی با SELECT … FOR UPDATE (دو درخواست هم‌زمان
   هرگز روی هم سوار نمی‌شوند — مثلاً دو پیام فرم هم‌زمان هیچ‌وقت گم نمی‌شود).
   در حالت Blob: بهترین تلاش (مثل قبل).
   fn(cur) → مقدار جدید؛ اگر fn خطا بدهد، هیچ تغییری نوشته نمی‌شود.
   خروجی: { prev, next } — prev مقدار پیش از تغییر (برای تاریخچهٔ نسخه‌ها). */
export async function modifyDoc(key, fn, opts = {}) {
  if (dbEnabled()) {
    const pool = await getPool();
    await ensureSchema();
    const client = await pool.connect();
    try {
      await withTimeout(client.query('BEGIN'), opts.ms);
      const r = await withTimeout(client.query('SELECT value FROM cd_docs WHERE key = $1 FOR UPDATE', [key]), opts.ms);
      const prev = r.rows.length ? r.rows[0].value : null;
      const next = await fn(prev);
      await withTimeout(client.query(
        `INSERT INTO cd_docs (key, value, updated_at) VALUES ($1, $2::jsonb, now())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
        [key, JSON.stringify(next)]
      ), opts.ms);
      await withTimeout(client.query('COMMIT'), opts.ms);
      return { prev, next };
    } catch (e) {
      try { await client.query('ROLLBACK'); } catch (e2) { /* noop */ }
      throw e;
    } finally {
      client.release();
    }
  }
  const prev = await readDoc(key, opts);
  const next = await fn(prev);
  await writeDoc(key, next, opts);
  return { prev, next };
}

/* ═══ تاریخچهٔ نسخه‌ها (فقط حالت دیتابیس؛ در حالت Blob بی‌اثر) ═══ */
export function revisionsSupported() {
  return dbEnabled();
}

export async function addRevision(docKey, data, opts = {}) {
  if (!dbEnabled()) return false;
  const pool = await getPool();
  await ensureSchema();
  await withTimeout(pool.query(
    'INSERT INTO cd_revisions (doc_key, data) VALUES ($1, $2::jsonb)',
    [docKey, JSON.stringify(data)]
  ), opts.ms || ADMIN_MS);
  /* نگه‌داری ۱۰ نسخهٔ آخر برای هر سند */
  await withTimeout(pool.query(
    `DELETE FROM cd_revisions
      WHERE doc_key = $1
        AND id NOT IN (
          SELECT id FROM cd_revisions WHERE doc_key = $1
          ORDER BY saved_at DESC, id DESC LIMIT 10
        )`, [docKey]
  ), opts.ms || ADMIN_MS).catch(() => { /* هرم کردن نسخه‌های قدیمی حیاتی نیست */ });
  return true;
}

export async function listRevisions(docKey, limit = 10, opts = {}) {
  if (!dbEnabled()) return [];
  const pool = await getPool();
  await ensureSchema();
  const r = await withTimeout(pool.query(
    'SELECT id, saved_at, data FROM cd_revisions WHERE doc_key = $1 ORDER BY saved_at DESC, id DESC LIMIT $2',
    [docKey, limit]
  ), opts.ms);
  return r.rows.map(row => ({ id: row.id, savedAt: row.saved_at, data: row.data }));
}

/* ─── اطلاعات یک سند در دیتابیس (برای صفحهٔ مهاجرت) ─── */
export async function dbDocInfo(key) {
  if (!dbEnabled()) return { exists: false };
  try {
    const pool = await getPool();
    await ensureSchema();
    const r = await withTimeout(pool.query(
      'SELECT updated_at, pg_column_size(value) AS bytes FROM cd_docs WHERE key = $1', [key]
    ), 8000);
    return r.rows.length
      ? { exists: true, updatedAt: r.rows[0].updated_at, bytes: Number(r.rows[0].bytes || 0) }
      : { exists: false };
  } catch (e) {
    return { exists: false, error: String((e && e.message) || e).slice(0, 120) };
  }
}
