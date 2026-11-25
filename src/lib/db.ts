/* ==========================================================================
   کافه‌دانش — لایهٔ دیتابیس (قاعدهٔ حیاتی پروژه)
   ---------------------------------------------------------------------------
   سه درایور با یک رابط یکسان:
   • اگر DATABASE_URL با mysql:// شروع شود → MySQL/MariaDB (استقرار cPanel/ایران‌هاست)
   • اگر DATABASE_URL یک Postgres واقعی باشد → Postgres (Neon / Vercel Postgres)
   • در غیر این صورت → PGlite فقط برای پیش‌نمایش محلی
   مایگریشن‌ها اتمیک و با قفل دیتابیس اجرا می‌شوند تا دو نمونهٔ هم‌زمان
   نتوانند یک مایگریشن را دوبار ثبت کنند.
   ========================================================================== */
import { env } from './env';
import { createMysqlDriver } from './db-mysql';

type Row = Record<string, unknown>;

interface DbDriver {
  kind: 'postgres' | 'pglite' | 'mysql';
  sql(text: string, params?: unknown[]): Promise<Row[]>;
  exec(text: string): Promise<void>;
  migrate(migrations: string[]): Promise<void>;
}

const MIGRATIONS_TABLE = `CREATE TABLE IF NOT EXISTS _migrations (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
)`;

/* نام‌های m__1 و m__2 از نسخهٔ قبلی حفظ می‌شوند تا مایگریشن‌های ثبت‌شده
   در Neon دوباره اجرا نشوند. */
function migrationName(index: number): string {
  return `m${String(index + 1).padStart(3, '_')}`;
}

const g = globalThis as unknown as {
  __cd_db?: DbDriver;
  __cd_db_ready?: Promise<DbDriver>;
};

async function createDriver(): Promise<DbDriver> {
  /* ─── حالت استقرار cPanel: MySQL / MariaDB با DATABASE_URL=mysql://… ─── */
  const dbUrl = env('DATABASE_URL') || '';
  const isMysqlUrl = /^mysql:\/\//i.test(dbUrl);
  const isPgUrl = /^postgres(ql)?:\/\//i.test(dbUrl);

  if (dbUrl && isMysqlUrl) {
    return (await createMysqlDriver()) as DbDriver;
  }

  /* ─── حالت تولید: Postgres واقعی با DATABASE_URL ─── */
  if (dbUrl && isPgUrl) {
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });

    return {
      kind: 'postgres',

      async sql(text, params = []) {
        const result = await pool.query(text, params as never[]);
        const rows = result.rows as Row[];
        /* هم‌سازی با درایور MySQL: دستور نوشتنی بدون RETURNING → affectedRows */
        if (!rows.length && /^\s*(INSERT|UPDATE|DELETE)\b/i.test(text)) {
          return [{ affectedRows: Number(result.rowCount ?? 0) }];
        }
        return rows;
      },

      async exec(text) {
        await pool.query(text);
      },

      async migrate(migrations) {
        /* advisory transaction lock: فقط یک نمونهٔ سرور در هر لحظه
           مایگریشن را اجرا می‌کند؛ قفل با COMMIT/ROLLBACK آزاد می‌شود. */
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(
            "SELECT pg_advisory_xact_lock(hashtext('cdanesh:schema-migrations'), 1)"
          );
          await client.query(MIGRATIONS_TABLE);

          const appliedRows = await client.query('SELECT name FROM _migrations');
          const applied = new Set(
            (appliedRows.rows as { name: string }[]).map((row) => row.name),
          );

          for (let i = 0; i < migrations.length; i++) {
            const name = migrationName(i);
            if (applied.has(name)) continue;

            await client.query(migrations[i]);
            await client.query(
              'INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
              [name],
            );
          }

          await client.query('COMMIT');
        } catch (error) {
          try {
            await client.query('ROLLBACK');
          } catch {
            /* خطای اصلی حفظ شود */
          }
          throw error;
        } finally {
          client.release();
        }
      },
    };
  }

  /* ─── حالت پیش‌نمایش: PGlite امبدد ─── */
  const { PGlite } = await import('@electric-sql/pglite');
  const lite = new PGlite('./.pgdata');

  return {
    kind: 'pglite',

    async sql(text, params = []) {
      const result = await lite.query(text, params as never[]);
      const rows = result.rows as Row[];
      if (!rows.length && /^\s*(INSERT|UPDATE|DELETE)\b/i.test(text)) {
        return [{ affectedRows: Number((result as unknown as { affectedRows?: number }).affectedRows ?? 0) }];
      }
      return rows;
    },

    async exec(text) {
      await lite.exec(text);
    },

    async migrate(migrations) {
      await lite.exec('BEGIN');
      try {
        await lite.exec(MIGRATIONS_TABLE);

        const appliedRows = await lite.query('SELECT name FROM _migrations');
        const applied = new Set(
          (appliedRows.rows as { name: string }[]).map((row) => row.name),
        );

        for (let i = 0; i < migrations.length; i++) {
          const name = migrationName(i);
          if (applied.has(name)) continue;

          await lite.exec(migrations[i]);
          await lite.query(
            'INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
            [name],
          );
        }

        await lite.exec('COMMIT');
      } catch (error) {
        try {
          await lite.exec('ROLLBACK');
        } catch {
          /* خطای اصلی حفظ شود */
        }
        throw error;
      }
    },
  };
}

export function db(): Promise<DbDriver> {
  if (!g.__cd_db_ready) {
    g.__cd_db_ready = createDriver().then((driver) => {
      g.__cd_db = driver;
      return driver;
    });
  }
  return g.__cd_db_ready;
}

/* ---------- کوئری‌های کمکی ---------- */
export async function q<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  const driver = await db();
  return (await driver.sql(text, params)) as T[];
}

export async function q1<T = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows[0] ?? null;
}

/* ---------- مایگریشن اتمیک و مقاوم به اجرای هم‌زمان ---------- */
const MIGRATIONS: string[] = [];

export async function migrate(): Promise<void> {
  const driver = await db();
  await driver.migrate(MIGRATIONS);
}

export function registerMigration(sqlText: string): void {
  MIGRATIONS.push(sqlText);
}

/* ---------- کمکی‌های سازگاری درایورها ---------- */

/** فهرست ستون‌های واقعی یک جدول (برای بازیابی از سطل زباله و انتقال داده) */
export async function getTableColumns(table: string): Promise<string[]> {
  const d = await db();
  if (d.kind === 'mysql') {
    const rows = await d.sql(`SHOW COLUMNS FROM \`${table}\``);
    return rows.map((r) => String((r as Record<string, unknown>).Field || '')).filter(Boolean);
  }
  const rows = await d.sql(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
    [table],
  );
  return rows.map((r) => String((r as Record<string, unknown>).column_name || '')).filter(Boolean);
}

/** هم‌ترازکردن شمارندهٔ شناسهٔ خودکار پس از درج با شناسهٔ صریح (Postgres فقط) */
export async function syncSequence(table: string): Promise<void> {
  const d = await db();
  if (d.kind === 'mysql') return; // MySQL با درج شناسهٔ صریح خودکار تنظیم می‌شود
  await d.sql(
    `SELECT setval(pg_get_serial_sequence('${table}', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM ${table}), 1), true)`,
  );
}
