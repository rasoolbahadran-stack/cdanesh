/* ==========================================================================
   کافه‌دانش — لایهٔ دیتابیس (قاعدهٔ حیاتی پروژه)
   ---------------------------------------------------------------------------
   دو درایور با یک رابط یکسان:
   • اگر DATABASE_URL تنظیم شده باشد → Postgres واقعی (Neon / Vercel Postgres)
   • در غیر این صورت → PGlite فقط برای پیش‌نمایش محلی
   مایگریشن‌ها به‌صورت تراکنشی و با قفل دیتابیس اجرا می‌شوند تا دو نمونهٔ
   هم‌زمان Vercel نتوانند یک مایگریشن را دوبار ثبت کنند.
   ========================================================================== */
import { env } from './env';

type Row = Record<string, unknown>;

interface DbDriver {
  kind: 'postgres' | 'pglite';
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
  /* ─── حالت تولید: Postgres واقعی با DATABASE_URL ─── */
  const dbUrl = env('DATABASE_URL') || '';
  const isPgUrl = /^postgres(ql)?:\/\//i.test(dbUrl);

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
        return result.rows as Row[];
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
      return result.rows as Row[];
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
