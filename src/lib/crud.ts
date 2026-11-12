/* ==========================================================================
   کافه‌دانش — فکتوری CRUD عمومی API
   قواعد: هر نوشتن/حذف فقط با نشست ادمین (چک در میان‌افزار + دوبار در خودِ عملیات)
   خروجی یکنواخت {ok, message, data} و پیام خطای فارسی.
   ========================================================================== */
import { q, q1 } from './db';
import { ok, fail, unauthorized, serverError, readJson, str, num, bool, slugify, sanitizeHtml, stripTags } from './http';
import { sessionFromCookies } from './auth';
import { logActivity } from './seed';

export type Normalizer = (v: unknown, body: Record<string, unknown>) => unknown;

export const N = {
  text: (max = 500) => ((v: unknown) => str(v, max)) as Normalizer,
  html: ((v: unknown) => sanitizeHtml(String(v ?? ''))) as Normalizer,
  plain: ((v: unknown) => stripTags(String(v ?? ''), 400)) as Normalizer,
  slug: ((v: unknown, body: Record<string, unknown>, from?: string) => slugify(str(v) || str(body[from || 'title']) || 'item')) as unknown as Normalizer,
  int: ((v: unknown) => num(v, 0)) as Normalizer,
  boolean: ((v: unknown) => bool(v)) as Normalizer,
  json: ((v: unknown) => (Array.isArray(v) || (v && typeof v === 'object') ? v : [])) as Normalizer,
  date: ((v: unknown) => (v ? new Date(String(v)).toISOString() : null)) as Normalizer,
  enum: (allowed: string[], fallback: string) => ((v: unknown) => (allowed.includes(String(v)) ? String(v) : fallback)) as Normalizer,
};

export interface EntityConfig {
  table: string;
  label: string;
  fields: Record<string, Normalizer>;
  required: { key: string; label: string; min?: number }[];
  slugFrom?: { slugField: string; sourceField: string };
  searchFields?: string[];
  noTimestamp?: boolean;
}

function admin(request: Request): boolean {
  return !!sessionFromCookies(request.headers.get('cookie') || '');
}

/* ---------- GET: فهرست ---------- */
export function makeList(cfg: EntityConfig) {
  return async (request: Request): Promise<Response> => {
    if (!admin(request)) return unauthorized();
    try {
      const url = new URL(request.url);
      const status = url.searchParams.get('status');
      const search = url.searchParams.get('q');
      const sort = url.searchParams.get('sort') || 'newest';
      const limit = Math.min(200, Math.max(1, num(url.searchParams.get('limit'), 100)));
      const params: unknown[] = [];
      let where = '';
      if (status && ['draft', 'published', 'scheduled', 'new', 'read', 'replied', 'archived'].includes(status)) {
        params.push(status);
        where += ` WHERE status = $${params.length}`;
      }
      if (search && cfg.searchFields?.length) {
        params.push(`%${search}%`);
        const ors = cfg.searchFields.map((f) => `${f} ILIKE $${params.length}`).join(' OR ');
        where += where ? ` AND (${ors})` : ` WHERE (${ors})`;
      }
      const orderBy = sort === 'oldest' ? 'id ASC' : sort === 'title' && cfg.searchFields?.includes('title') ? 'title ASC' : 'id DESC';
      const rows = await q(`SELECT * FROM ${cfg.table}${where} ORDER BY ${orderBy} LIMIT ${limit}`, params);
      return ok(rows);
    } catch (e) {
      return serverError(e);
    }
  };
}

/* ---------- POST: ایجاد ---------- */
export function makeCreate(cfg: EntityConfig) {
  return async (request: Request): Promise<Response> => {
    if (!admin(request)) return unauthorized();
    try {
      const body = await readJson(request);
      const missing = cfg.required.find((r) => str(body[r.key]).length < (r.min || 1));
      if (missing) return fail(`«${missing.label}» الزامی است${missing.min ? ` (حداقل ${missing.min} کاراکتر)` : ''}`, 'VALIDATION');

      /* اسلاگ یکتا */
      if (cfg.slugFrom) {
        const slugVal = slugify(str(body[cfg.slugFrom.slugField]) || str(body[cfg.slugFrom.sourceField]) || 'item');
        let candidate = slugVal;
        let i = 2;
        while (await q1(`SELECT id FROM ${cfg.table} WHERE slug = $1`, [candidate])) {
          candidate = `${slugVal}-${i++}`;
        }
        body[cfg.slugFrom.slugField] = candidate;
      }

      const keys = Object.keys(cfg.fields).filter((k) => body[k] !== undefined);
      const values = keys.map((k) => cfg.fields[k](body[k], body));
      const cols = keys.join(', ');
      const ph = keys.map((_, i) => `$${i + 1}`).join(', ');
      const row = await q1(`INSERT INTO ${cfg.table} (${cols}) VALUES (${ph}) RETURNING *`, values);
      if (!row) return fail('ایجاد رکورد ناموفق بود', 'INSERT_FAIL', 500);
      await logActivity('create', cfg.table, Number(row.id), `${cfg.label} ایجاد شد`);
      return ok(row, `${cfg.label} با موفقیت ایجاد شد`);
    } catch (e) {
      return serverError(e);
    }
  };
}

/* ---------- PUT: ویرایش ---------- */
export function makeUpdate(cfg: EntityConfig) {
  return async (request: Request): Promise<Response> => {
    if (!admin(request)) return unauthorized();
    try {
      const id = num(new URL(request.url).pathname.split('/').pop(), 0);
      const body = await readJson(request);
      const existing = await q1(`SELECT * FROM ${cfg.table} WHERE id = $1`, [id]);
      if (!existing) return fail('رکورد موردنظر پیدا نشد', 'NOT_FOUND', 404);

      const keys = Object.keys(cfg.fields).filter((k) => body[k] !== undefined);
      if (!keys.length) return fail('هیچ فیلدی برای ویرایش ارسال نشده', 'EMPTY');

      /* اسلاگ: چک یکتایی وقتی صریحاً تغییر کرده */
      if (cfg.slugFrom && body[cfg.slugFrom.slugField] !== undefined) {
        const slugVal = slugify(str(body[cfg.slugFrom.slugField]));
        const dupe = await q1(`SELECT id FROM ${cfg.table} WHERE slug = $1 AND id != $2`, [slugVal, id]);
        if (dupe) return fail('این اسلاگ قبلاً استفاده شده؛ یک مقدار دیگر وارد کنید', 'SLUG_DUPE');
        body[cfg.slugFrom.slugField] = slugVal;
      }

      if ((cfg.table === 'posts' || cfg.table === 'pages') && existing) {
        try {
          await q('INSERT INTO content_revisions(entity, entity_id, snapshot) VALUES($1,$2,$3::jsonb)', [cfg.table, id, JSON.stringify(existing)]);
        } catch { /* نگهداری نسخه نباید مانع ذخیره محتوا شود */ }
        if (cfg.slugFrom && body[cfg.slugFrom.slugField] && String(existing.slug || '') !== String(body[cfg.slugFrom.slugField])) {
          await q('INSERT INTO slug_redirects(entity,old_slug,new_slug) VALUES($1,$2,$3) ON CONFLICT(entity,old_slug) DO UPDATE SET new_slug=EXCLUDED.new_slug', [cfg.table, String(existing.slug), String(body[cfg.slugFrom.slugField])]);
        }
      }
            const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      const values = keys.map((k) => cfg.fields[k](body[k], body));
      const hasUpdated = cfg.noTimestamp ? '' : ', updated_at = now()';
      const row = await q1(`UPDATE ${cfg.table} SET ${sets}${hasUpdated} WHERE id = $${keys.length + 1} RETURNING *`, [...values, id]);
      await logActivity('update', cfg.table, id, `${cfg.label} ویرایش شد`);
      return ok(row, `${cfg.label} با موفقیت ذخیره شد`);
    } catch (e) {
      return serverError(e);
    }
  };
}

/* ---------- DELETE ---------- */
export function makeDelete(cfg: EntityConfig) {
  return async (request: Request): Promise<Response> => {
    if (!admin(request)) return unauthorized();
    try {
      const id = num(new URL(request.url).pathname.split('/').pop(), 0);
      if (!id) return fail('شناسه رکورد معتبر نیست', 'BAD_ID', 400);
      await q(`CREATE TABLE IF NOT EXISTS cdanesh_admin_trash (
        id bigserial PRIMARY KEY, entity text NOT NULL, entity_id bigint NOT NULL,
        snapshot jsonb NOT NULL, deleted_at timestamptz NOT NULL DEFAULT now(), restored_at timestamptz
      )`);
      const moved = await q(
        `WITH deleted AS (DELETE FROM ${cfg.table} WHERE id = $1 RETURNING *)
         INSERT INTO cdanesh_admin_trash(entity, entity_id, snapshot)
         SELECT $2, $1, to_jsonb(deleted) FROM deleted RETURNING id`,
        [id, cfg.table],
      );
      if (!moved.length) return fail('رکورد پیدا نشد یا قابل حذف نیست', 'NOT_FOUND', 404);
      await logActivity('delete', cfg.table, id, `${cfg.label} به سطل زباله منتقل شد`);
      return ok({ id }, `${cfg.label} به سطل زباله منتقل شد و قابل بازیابی است`);
    } catch (e) { return serverError(e); }
  };
}

/* ---------- GET: تک رکورد ---------- */
export function makeOne(cfg: EntityConfig) {
  return async (request: Request): Promise<Response> => {
    if (!admin(request)) return unauthorized();
    try {
      const id = num(new URL(request.url).pathname.split('/').pop(), 0);
      const row = await q1(`SELECT * FROM ${cfg.table} WHERE id = $1`, [id]);
      if (!row) return fail('رکورد موردنظر پیدا نشد', 'NOT_FOUND', 404);
      return ok(row);
    } catch (e) {
      return serverError(e);
    }
  };
}

/* ---------- انتشار خودکار مقالات زمان‌بندی‌شده‌ای که زمانشان رسیده ---------- */
export async function publishDueScheduled(): Promise<number> {
  try {
    const due = await q<{ id: number; title: string }>(
      `SELECT id, title FROM posts WHERE status = 'scheduled' AND published_at IS NOT NULL AND published_at <= now()`,
    );
    for (const p of due) {
      await q(`UPDATE posts SET status = 'published', updated_at = now() WHERE id = $1`, [p.id]);
      await logActivity('publish', 'posts', p.id, `مقالهٔ زمان‌بندی‌شده «${p.title}» به‌صورت خودکار منتشر شد`);
    }
    return due.length;
  } catch {
    return 0;
  }
}
