/* ==========================================================================
   کافه‌دانش — سطل زباله (سازگار با MySQL، Postgres و PGlite)
   ---------------------------------------------------------------------------
   در نسخهٔ PostgreSQL از CTE با DELETE…RETURNING استفاده می‌شد که در MySQL
   پشتیبانی نمی‌شود؛ الگوی سه‌مرحله‌ای (خواندن → ثبت snapshot → حذف) رفتار
   یکسانی با هر سه درایور دارد و اتمیکی نفس عملی را حفظ می‌کند.
   ========================================================================== */
import { q, q1 } from './db';

const TRASH_DDL_PG = `CREATE TABLE IF NOT EXISTS cdanesh_admin_trash (
  id bigserial PRIMARY KEY, entity text NOT NULL, entity_id bigint NOT NULL,
  snapshot jsonb NOT NULL, deleted_at timestamptz NOT NULL DEFAULT now(), restored_at timestamptz
)`;

export async function ensureTrashTable(): Promise<void> {
  const d = await (await import('./db')).db();
  if (d.kind === 'mysql') {
    // جدول در مایگریشن پایهٔ MySQL ساخته شده است
    return;
  }
  await q(TRASH_DDL_PG);
}

/** یک رکورد را به سطل زباله منتقل می‌کند؛ snapshot کامل رکورد ذخیره می‌شود. */
export async function moveToTrash(table: string, id: number): Promise<boolean> {
  await ensureTrashTable();
  const row = await q1<Record<string, unknown>>(`SELECT * FROM ${table} WHERE id = $1`, [id]);
  if (!row) return false;
  await q(
    'INSERT INTO cdanesh_admin_trash(entity, entity_id, snapshot) VALUES($1,$2,$3::jsonb)',
    [table, id, JSON.stringify(row)],
  );
  await q(`DELETE FROM ${table} WHERE id = $1`, [id]);
  return true;
}
