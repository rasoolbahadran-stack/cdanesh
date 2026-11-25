/* ==========================================================================
   کافه‌دانش — انتشار زمان‌بندی‌شده بدون سرویس خارجی (Cron جونی cPanel)
   ---------------------------------------------------------------------------
   اجرا:  node /home/<USER>/<APP>/scripts/cron-publish.mjs
   • تنظیمات از فایل .env کنار اسکریپت (ریشهٔ اپ) خوانده می‌شود.
   • انتشار اتمی و ایدمپوتنت: فقط مقاله‌هایی که هنوز وضعیت‌شان scheduled است
     منتشر می‌شوند؛ اجرای تکراری (دو بار Cron هم‌زمان) محتوای دوباره منتشر نمی‌کند.
   • خطاها در جدول activity ثبت می‌شوند تا در پنل دیده شوند.
   • خروجی این اسکریپت می‌تواند به لاگ Cron cPanel برود.
   ========================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');

/* ---- خواندن .env (بدون وابستگی خارجی) ---- */
(function loadEnv() {
  const file = path.join(appRoot, '.env');
  try {
    if (!fs.existsSync(file)) return;
    for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq < 1) continue;
      const k = line.slice(0, eq).trim();
      let v = line.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (process.env[k] === undefined) process.env[k] = v;
    }
  } catch { /* اختیاری */ }
})();

const url = process.env.DATABASE_URL || '';
const isMysql = /^mysql:\/\//i.test(url);
const isPg = /^postgres(ql)?:\/\//i.test(url);

if (!isMysql && !isPg) {
  console.error('[cron-publish] DATABASE_URL تنظیم نشده یا معتبر نیست (mysql:// یا postgresql://)');
  process.exit(1);
}

let sql;
let pool = null;
if (isMysql) {
  const mysql = await import('mysql2/promise');
  const u = new URL(url);
  pool = mysql.createPool({
    host: u.hostname, port: Number(u.port || 3306),
    user: decodeURIComponent(u.username || 'root'),
    password: decodeURIComponent(u.password || ''),
    database: decodeURIComponent(u.pathname.replace(/^\//, '')) || undefined,
    charset: 'utf8mb4_unicode_ci', timezone: 'Z', connectionLimit: 2,
  });
  sql = async (text, params = []) => {
    const t = text.replace(/\$(\d+)\b/g, '?');
    const [rows] = await pool.query(t, params.map((v) => (v instanceof Date ? v.toISOString().slice(0, 19).replace('T', ' ') : (typeof v === 'boolean' ? (v ? 1 : 0) : v))));
    if (Array.isArray(rows)) return rows;
    // UPDATE/INSERT بدون RETURNING → affectedRows
    return [{ affectedRows: Number(rows.affectedRows ?? 0), insertId: Number(rows.insertId ?? 0) }];
  };
} else {
  const { Pool } = await import('pg');
  pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, max: 2 });
  sql = async (text, params = []) => {
    const r = await pool.query(text, params);
    const rows = r.rows || [];
    if (!rows.length && /^\s*(INSERT|UPDATE|DELETE)\b/i.test(text)) return [{ affectedRows: Number(r.rowCount ?? 0) }];
    return rows;
  };
}

async function main() {
  const due = await sql(
    "SELECT id, title FROM posts WHERE status='scheduled' AND published_at IS NOT NULL AND published_at <= now() LIMIT 100",
  );
  let published = 0;
  for (const item of due) {
    // گارد status='scheduled' در خود UPDATE: اجرای تکراری دوباره منتشر نمی‌کند
    const done = await sql("UPDATE posts SET status='published', updated_at=now() WHERE id=$1 AND status='scheduled'", [item.id]);
    const affected = Number(done[0]?.affectedRows ?? (done.length ? 1 : 0));
    if (affected === 0) continue; // قبلاً منتشر شده — اجرای تکراری اثری ندارد
    published++;
    try {
      await sql('INSERT INTO activity(type,entity,entity_id,title) VALUES($1,$2,$3,$4)',
        ['publish', 'posts', item.id, 'انتشار زمان‌بندی‌شده مقاله: ' + String(item.title || '').slice(0, 160)]);
    } catch (e) { console.warn('[cron-publish] activity log failed:', e.message); }
  }
  console.log(`[cron-publish] ${new Date().toISOString()} — منتشرشده: ${published} از ${due.length} موعدرسیده`);
  try { await pool.end(); } catch { /* بی‌اثر */ }
  process.exit(0);
}

main().catch((e) => {
  console.error('[cron-publish] اجرای وظیفه ناموفق بود:', e && e.message);
  process.exit(1);
});
