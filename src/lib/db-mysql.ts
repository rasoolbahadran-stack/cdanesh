/* ==========================================================================
   کافه‌دانش — درایور MySQL / MariaDB (استقرار روی هاست cPanel / ایران‌هاست)
   ---------------------------------------------------------------------------
   همان رابط DbDriver (sql/exec/migrate) که سایر درایورها دارند، با این تفاوت
   که یک لایهٔ ترجمهٔ کوئری، گویش‌های رایج PostgreSQL استفاده‌شده در پروژه را
   به MySQL تبدیل می‌کند:
     • $1..$n → ?
     • ::int / ::bigint / ::text / ::jsonb / ::timestamptz → حذف کست
     • ILIKE → LIKE (با کولیشن utf8mb4_unicode_ci جست‌وجو حساس به حرف نیست)
     • ON CONFLICT (cols) DO UPDATE SET a=EXCLUDED.a → ON DUPLICATE KEY UPDATE a=VALUES(a)
     • ON CONFLICT … DO NOTHING → INSERT IGNORE
     • INSERT … RETURNING *|id → INSERT + SELECT بر اساس LAST_INSERT_ID()
     • UPDATE … WHERE … RETURNING … → UPDATE + SELECT با همان WHERE
   بقیهٔ توابع MySQL (now(), DATE_ADD و…) مستقیماً کار می‌کنند.
   مایگریشن‌ها با GET_LOCK اتمیک اجرا می‌شوند تا دو نمونهٔ هم‌زمان دوباره اجرا نکنند.
   ========================================================================== */
import { MYSQL_MIGRATIONS } from './schema-mysql';

type Row2 = Record<string, unknown>;

/* ---------- سریال‌سازی پارامترها ---------- */
function serializeParam(v: unknown): unknown {
  if (v === undefined || v === null) return null;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v instanceof Date) return v.toISOString().slice(0, 19).replace('T', ' ');
  if (Buffer.isBuffer(v)) return v;
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
}

/* ---------- ترجمهٔ گویش ---------- */
function translateDialect(input: string): string {
  let text = input;
  // کست‌های PostgreSQL
  text = text.replace(/::(int|integer|bigint|smallint|text|jsonb|json|timestamptz|timestamp|date|numeric|real|double\s+precision)\b/gi, '');
  // ILIKE → LIKE
  text = text.replace(/ILIKE\b/gi, 'LIKE');
  // ON CONFLICT … DO NOTHING → INSERT IGNORE
  if (/ON\s+CONFLICT\s*(\([^)]*\))?(\s+WHERE\s+[^)]*)?\s*DO\s+NOTHING/i.test(text)) {
    text = text.replace(/ON\s+CONFLICT\s*(\([^)]*\))?(\s+WHERE\s+[^)]*)?\s*DO\s+NOTHING/gi, '');
    text = text.replace(/INSERT\s+INTO/i, 'INSERT IGNORE INTO');
  }
  // ON CONFLICT … DO UPDATE SET … EXCLUDED.x → ON DUPLICATE KEY UPDATE … VALUES(x)
  const odku = text.match(/ON\s+CONFLICT\s*\(([^)]*)\)\s+DO\s+UPDATE\s+SET\s+([\s\S]+)$/i);
  if (odku) {
    let sets = odku[2];
    sets = sets.replace(/EXCLUDED\.([a-zA-Z_][a-zA-Z0-9_]*)/gi, 'VALUES($1)');
    text = text.replace(/ON\s+CONFLICT\s*\(([^)]*)\)\s+DO\s+UPDATE\s+SET\s+[\s\S]+$/i, 'ON DUPLICATE KEY UPDATE ' + sets);
  }
  return text;
}

/* واژه‌های رزرو MySQL که در پروژه به‌عنوان نام ستون استفاده شده‌اند — فقط برای DML
   (key/value در متن SQL فقط identifier هستند؛ مقادیر از پارامتر می‌آیند) */
function quoteReservedWords(text: string): string {
  // عبارت کلیدی ON DUPLICATE KEY UPDATE نباید تغییر کند
  const GUARD = '\u0001ODKU\u0001';
  let t = text.replace(/ON\s+DUPLICATE\s+KEY\s+UPDATE/gi, GUARD);
  t = t.replace(/\bkey\b/g, '`key`').replace(/\bvalue\b/g, '`value`');
  return t.replace(GUARD, 'ON DUPLICATE KEY UPDATE');
}

interface Translated {
  text: string;
  postQuery?: { text: string; paramsFromEnd: number };
}

function translateQuery(input: string): Translated {
  let text = translateDialect(input);
  // $n → ? (پارامترها در کل پروژه همیشه به‌ترتیب هستند)
  text = text.replace(/\$(\d+)\b/g, '?');
  // فقط کوئری‌های DML (نه DDL) نیاز به کوتیشن رزروها دارند
  if (/^\s*(INSERT|UPDATE|SELECT|DELETE)\b/i.test(text)) {
    text = quoteReservedWords(text);
  }

  // RETURNING برای INSERT
  const retIdx = text.search(/\bRETURNING\b/i);
  if (retIdx === -1) return { text };
  const returning = text.slice(retIdx + 'RETURNING'.length).trim().replace(/;$/, '');
  const body = text.slice(0, retIdx).trim().replace(/;$/, '');

  const isInsert = /^INSERT\s/i.test(body);
  const isUpdate = /^UPDATE\s/i.test(body);

  if (isInsert) {
    const table = (body.match(/INSERT\s+(?:IGNORE\s+)?INTO\s+([`a-zA-Z0-9_.]+)/i) || [])[1];
    if (!table) return { text: body };
    const postText = /^\*\s*$/i.test(returning)
      ? `SELECT * FROM ${table} WHERE id = LAST_INSERT_ID()`
      : `SELECT ${returning} FROM ${table} WHERE id = LAST_INSERT_ID()`;
    return { text: body, postQuery: { text: postText, paramsFromEnd: 0 } };
  }

  if (isUpdate) {
    const table = (body.match(/UPDATE\s+([`a-zA-Z0-9_.]+)/i) || [])[1];
    const where = (body.match(/\bWHERE\s+([\s\S]+)$/i) || [])[1] || 'id = ?';
    if (!table) return { text: body };
    // تعداد ? داخل WHERE ← همان پارامترهای انتهایی کوئری اصلی
    const whereMarks = (where.match(/\?/g) || []).length;
    const postText = `SELECT ${returning} FROM ${table} WHERE ${where}`;
    return { text: body, postQuery: { text: postText, paramsFromEnd: whereMarks } };
  }

  return { text: body };
}

/* ---------- درایور ---------- */
export async function createMysqlDriver(): Promise<{
  kind: 'mysql';
  sql(text: string, params?: unknown[]): Promise<Row2[]>;
  exec(text: string): Promise<void>;
  migrate(migrations: string[]): Promise<void>;
}> {
  const { createPool } = await import('mysql2/promise');
  const url = process.env.DATABASE_URL || '';
  const u = new URL(url);
  const pool = createPool({
    host: u.hostname || 'localhost',
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username || 'root'),
    password: decodeURIComponent(u.password || ''),
    database: decodeURIComponent(u.pathname.replace(/^\//, '')) || undefined,
    waitForConnections: true,
    connectionLimit: 8,
    queueLimit: 0,
    charset: 'utf8mb4_unicode_ci',
    timezone: 'Z',
    supportBigNumbers: true,
    namedPlaceholders: false,
  });

  // اتصال اولیه را هرچه زودتر تست می‌کنیم تا خطای پیکربندی واضح گزارش شود
  try {
    await pool.query('SELECT 1');
  } catch (e) {
    const msg = String((e as Error)?.message || e);
    throw new Error('اتصال به MySQL/MariaDB ناموفق بود: ' + msg);
  }

  async function rawQuery(text: string, params: unknown[]): Promise<{ rows: Row2[]; header?: Record<string, unknown> }> {
    const [rows] = await pool.query(text, params);
    if (Array.isArray(rows)) return { rows: rows as Row2[] };
    // نتیجهٔ INSERT/UPDATE/DELETE بدون RETURNING → استخراج affectedRows/insertId
    return { rows: [], header: rows as unknown as Record<string, unknown> };
  }

  return {
    kind: 'mysql',

    async sql(text, params = []) {
      const { text: t, postQuery } = translateQuery(text);
      const serialized = params.map(serializeParam);
      const out = await rawQuery(t, serialized);
      if (postQuery) {
        const tail = postQuery.paramsFromEnd > 0
          ? serialized.slice(postQuery.paramsFromEnd * -1)
          : [];
        const post = await rawQuery(postQuery.text, tail);
        return post.rows;
      }
      // هم‌سازی رفتار با درایور pg: دستور نوشتنی → ردیف affectedRows برمی‌گردد
      if (out.header) {
        return [{ affectedRows: Number(out.header.affectedRows ?? 0), insertId: Number(out.header.insertId ?? 0) }];
      }
      return out.rows;
    },

    async exec(text) {
      for (const stmt of splitStatements(text)) {
        await rawQuery(translateDialect(stmt), []);
      }
    },

    async migrate(_migrations) {
      // مایگریشن‌های MySQL مستقل هستند (schema-mysql.ts) و فهرست PostgreSQL نادیده گرفته می‌شود
      const conn = await pool.getConnection();
      try {
        await conn.query("CREATE TABLE IF NOT EXISTS _migrations (name VARCHAR(100) PRIMARY KEY, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        // قفل اتمیک بین نمونه‌ها
        const [lockRows] = await conn.query("SELECT GET_LOCK('cdanesh_schema_migrate', 30) AS got");
        const got = Number((lockRows as Row2[])[0]?.got) === 1;
        if (!got) throw new Error('قفل مایگریشن دیتابیس گرفته نشد');
        try {
          const [appliedRows] = await conn.query('SELECT name FROM _migrations');
          const applied = new Set((appliedRows as Row2[]).map((r) => String(r.name)));
          for (const m of MYSQL_MIGRATIONS) {
            if (applied.has(m.name)) continue;
            for (const stmt of splitStatements(m.sql)) {
              await conn.query(stmt);
            }
            await conn.query('INSERT IGNORE INTO _migrations (name) VALUES (?)', [m.name]);
          }
        } finally {
          await conn.query("SELECT RELEASE_LOCK('cdanesh_schema_migrate')");
        }
      } finally {
        conn.release();
      }
    },
  };
}

/* حذف خط‌های کامنت از یک دستور (کامنت‌های کاملِ خط) */
function stripCommentLines(stmt: string): string {
  const lines = stmt.split('\n').filter((l) => !/^\s*--/.test(l));
  return lines.join('\n').trim();
}

/* تقسیم اسکریپت SQL به دستورها (بدون شکستن ; داخل رشته‌ها) */
export function splitStatements(script: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inStr: string | null = null;
  for (let i = 0; i < script.length; i++) {
    const ch = script[i];
    if (inStr) {
      cur += ch;
      if (ch === inStr && script[i - 1] !== '\\') inStr = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      inStr = ch;
      cur += ch;
      continue;
    }
    if (ch === ';') {
      const s = stripCommentLines(cur);
      if (s) out.push(s);
      cur = '';
      continue;
    }
    cur += ch;
  }
  const s = stripCommentLines(cur);
  if (s) out.push(s);
  return out;
}
