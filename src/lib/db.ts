/* ==========================================================================
   کافه‌دانش — لایهٔ دیتابیس (قاعدهٔ حیاتی پروژه)
   ---------------------------------------------------------------------------
   دو درایور با یک رابط یکسان:
   • اگر DATABASE_URL تنظیم شده باشد → Postgres واقعی (Neon / Vercel Postgres)
     — همان قراردادی که پروژهٔ فعلی روی Vercel دارد.
   • در غیر این صورت → PGlite (پستگرس امبدد) فقط برای پیش‌نمایش محلی.
   مایگریشن‌ها idempotent هستند و در اولین اجرا خودکار اعمال می‌شوند.
   هرگز داده‌های موجود بازنویسی یا حذف نمی‌شوند.
   ========================================================================== */
import { env, hasEnv } from './env';

type Row = Record<string, unknown>;

interface DbDriver {
  kind: 'postgres' | 'pglite';
  sql(text: string, params?: unknown[]): Promise<Row[]>;
  exec(text: string): Promise<void>;
}

const g = globalThis as unknown as {
  __cd_db?: DbDriver;
  __cd_db_ready?: Promise<DbDriver>;
};

async function createDriver(): Promise<DbDriver> {
  /* ─── حالت تولید: Postgres واقعی با DATABASE_URL ───
     فقط URL معتبرِ postgresql:// یا postgres:// پذیرفته می‌شود؛
     مقادیر ناسازگار محیط (مثل file:) به حالت پیش‌نمایش محلی می‌روند. */
  const dbUrl = env('DATABASE_URL') || '';
  const isPgUrl = /^postgres(ql)?:\/\//i.test(dbUrl);
  if (dbUrl && isPgUrl) {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: env('DATABASE_URL'),
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
    return {
      kind: 'postgres',
      async sql(text, params = []) {
        const r = await pool.query(text, params as never[]);
        return r.rows as Row[];
      },
      async exec(text) {
        await pool.query(text);
      },
    };
  }

  /* ─── حالت پیش‌نمایش: PGlite امبدد ─── */
  const { PGlite } = await import('@electric-sql/pglite');
  const lite = new PGlite('./.pgdata');
  return {
    kind: 'pglite',
    async sql(text, params = []) {
      const r = await lite.query(text, params as never[]);
      return r.rows as Row[];
    },
    async exec(text) {
      await lite.exec(text);
    },
  };
}

export function db(): Promise<DbDriver> {
  if (!g.__cd_db_ready) {
    g.__cd_db_ready = createDriver().then((d) => {
      g.__cd_db = d;
      return d;
    });
  }
  return g.__cd_db_ready;
}

/* ---------- کوئری‌های کمکی ---------- */
export async function q<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  const d = await db();
  return (await d.sql(text, params)) as T[];
}

export async function q1<T = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows[0] ?? null;
}

/* ---------- مایگریشن (idempotent) ---------- */
const MIGRATIONS: string[] = [];

export async function migrate(): Promise<void> {
  const d = await db();
  await d.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const applied = new Set(
    (await q<{ name: string }>('SELECT name FROM _migrations')).map((r) => r.name),
  );
  for (let i = 0; i < MIGRATIONS.length; i++) {
    const name = `m${String(i + 1).padStart(3, '_')}`;
    if (applied.has(name)) continue;
    await d.exec(MIGRATIONS[i]);
    await d.sql('INSERT INTO _migrations (name) VALUES ($1)', [name]);
  }
}

export function registerMigration(sqlText: string): void {
  MIGRATIONS.push(sqlText);
}
