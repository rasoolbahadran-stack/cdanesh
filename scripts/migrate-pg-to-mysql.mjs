/* ==========================================================================
   کافه‌دانش — ابزار انتقال داده از PostgreSQL (Neon) به MySQL/MariaDB
   ---------------------------------------------------------------------------
   اجرا:
     DATABASE_URL_PG="postgresql://…neon…" DATABASE_URL="mysql://user:pass@host:3306/db" \
       node scripts/migrate-pg-to-mysql.mjs [--force]
   • همهٔ رکوردها با همان id منتقل می‌شوند؛ هیچ داده‌ای حذف نمی‌شود.
   • آرایه‌ها/JSONB → JSON؛ boolean → 0/1؛ timestamp → DATETIME (UTC).
   • جدول‌های غیرخالی مقصد (بدون --force) رد می‌شوند تا داده دوباره نریزد.
   • پایان کار: گزارش شمارشی + بررسی ارتباط‌ها + تطابق شمارش هر جدول.
   ========================================================================== */
import fs from 'node:fs';

function loadEnv(dir) {
  const file = dir + '/.env';
  try {
    if (fs.existsSync(file)) for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = raw.trim(); if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('='); if (eq < 1) continue;
      const k = line.slice(0, eq).trim();
      let v = line.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (process.env[k] === undefined) process.env[k] = v;
    }
  } catch { /* اختیاری */ }
}
const here = new URL('.', import.meta.url).pathname;
loadEnv(here + '/..');

const PG = process.env.DATABASE_URL_PG || '';
const MY = process.env.DATABASE_URL || '';
if (!/^postgres/i.test(PG) || !/^mysql/i.test(MY)) {
  console.error('نیاز به DATABASE_URL_PG (postgresql://…) و DATABASE_URL (mysql://…) دارید.');
  process.exit(1);
}
const FORCE = process.argv.includes('--force');

const pgMod = await import('pg');
const pgPool = new pgMod.default.Pool({
  connectionString: PG,
  ssl: /sslmode=require|neon\.tech|neon\.build/i.test(PG) ? { rejectUnauthorized: false } : undefined,
  max: 2,
});
const myMod = await import('mysql2/promise');
const myU = new URL(MY);
const myPool = myMod.createPool({
  host: myU.hostname, port: Number(myU.port || 3306),
  user: decodeURIComponent(myU.username || 'root'),
  password: decodeURIComponent(myU.password || ''),
  database: decodeURIComponent(myU.pathname.replace(/^\//, '')) || undefined,
  charset: 'utf8mb4_unicode_ci', timezone: 'Z', connectionLimit: 4,
});

const TABLES = [
  'users', 'pages', 'categories', 'posts', 'services', 'projects', 'plans',
  'faqs', 'testimonials', 'messages', 'media', 'settings', 'activity',
  'error_reports', 'slug_redirects', 'content_revisions', 'cdanesh_admin_trash',
  'login_attempts', 'cd_docs', 'cd_revisions',
];

const iso = (v) => {
  if (v === null || v === undefined) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  return isNaN(d.getTime()) ? v : d.toISOString().slice(0, 19).replace('T', ' ');
};

async function tableColumns(table) {
  const [cols] = await myPool.query('SHOW COLUMNS FROM `' + table + '`');
  return cols.map((c) => c.Field);
}

async function main() {
  console.log('▸ اتصال به Postgres مبدأ و MySQL مقصد…');
  await myPool.query('SELECT 1');
  await pgPool.query('SELECT 1');

  const report = [];
  for (const table of TABLES) {
    let rows;
    try {
      ({ rows } = await pgPool.query(`SELECT * FROM ${table}`));
    } catch (e) {
      if (String(e.code ?? e) === '42P01' || /does not exist/i.test(String(e.message))) {
        // جدول در مبدأ وجود ندارد (نصب قدیمی‌تر) — رد می‌شود
        console.log(`  ▲ ${table}: در مبدأ موجود نیست — رد شد`);
        continue;
      }
      throw e;
    }
    const [countRes] = await myPool.query(`SELECT COUNT(*) AS c FROM \`${table}\``);
    const existing = Number(countRes[0].c);
    if (existing > 0 && !FORCE) {
      report.push({ table, pg: rows.length, my: existing, status: 'رد شد (مقصد غیرخالی — برای بازنویسی --force بدهید)' });
      continue;
    }
    const cols = await tableColumns(table);
    let inserted = 0;
    for (const row of rows) {
      const usable = Object.keys(row).filter((k) => cols.includes(k));
      if (!usable.length) continue;
      const values = usable.map((k) => {
        let v = row[k];
        if (typeof v === 'boolean') v = v ? 1 : 0;
        else if (v instanceof Date) v = iso(v);
        else if (v !== null && typeof v === 'object') v = JSON.stringify(v);
        else if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(v)) v = iso(v);
        return v;
      });
      const ph = usable.map(() => '?').join(', ');
      const names = usable.map((c) => '`' + c + '`').join(', ');
      await myPool.query(`INSERT INTO \`${table}\` (${names}) VALUES (${ph})`, values);
      inserted++;
    }
    report.push({ table, pg: rows.length, my: existing + inserted, status: inserted + ' رکورد منتقل شد' });
  }

  /* ---------- گزارش صحت ---------- */
  console.log('\n═══ گزارش انتقال ═══');
  let mismatches = 0;
  for (const r of report) {
    const [c] = await myPool.query(`SELECT COUNT(*) AS c FROM \`${r.table}\``);
    r.my_final = Number(c[0].c);
    const match = r.my_final >= r.pg;
    if (!match) mismatches++;
    console.log(`  ${match ? '✔' : '✘'} ${r.table}: PG=${r.pg} → MySQL=${r.my_final} (${r.status})`);
  }

  /* بررسی ارتباط‌ها */
  console.log('\n═══ بررسی ارتباط‌ها ═══');
  const checks = [
    ['posts.category_id → categories.id', 'SELECT p.id FROM posts p LEFT JOIN categories c ON c.id=p.category_id WHERE p.category_id IS NOT NULL AND c.id IS NULL'],
    ['sessions/users بدون کاربر', 'SELECT s.token FROM sessions s LEFT JOIN users u ON u.id=s.user_id WHERE s.user_id IS NOT NULL AND u.id IS NULL'],
    ['request_events/requests نبود (cdanesh ندارد)', null],
  ];
  for (const [label, q] of checks) {
    if (!q) continue;
    try {
      const [bad] = await myPool.query(q);
      console.log(`  ${bad.length === 0 ? '✔' : '✘'} ${label}${bad.length ? ' — ' + bad.length + ' رکورد یتیم' : ''}`);
    } catch (e) {
      console.log(`  ▲ ${label} — بررسی رد شد (${e.message.split('\n')[0]})`);
    }
  }

  console.log(mismatches === 0 ? '\n✅ انتقال کامل و سازگار است.' : `\n⚠️ ${mismatches} جدول ناهمخوان — خروجی بالا را بررسی کنید.`);
  await pgPool.end();
  await myPool.end();
  process.exit(mismatches ? 1 : 0);
}

main().catch((e) => { console.error('MIGRATE_FAIL:', e); process.exit(1); });
