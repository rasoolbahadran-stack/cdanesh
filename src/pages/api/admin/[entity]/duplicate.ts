/* API کپی (تکثیر) رکورد: /api/admin/[entity]/duplicate
   body: { id: number } — یک نسخهٔ پیش‌نویس با اسلاگ یکتا می‌سازد */
import type { APIRoute } from 'astro';
import { ENTITIES } from '../../../../lib/entities';
import { q1 } from '../../../../lib/db';
import { ok, fail, unauthorized, serverError, readJson, str, num, slugify } from '../../../../lib/http';
import { sessionFromCookies } from '../../../../lib/auth';
import { logActivity } from '../../../../lib/seed';

export const prerender = false;

const admin = (request: Request) => !!sessionFromCookies(request.headers.get('cookie') || '');

/* ستون‌هایی که در کپی نباید منتقل شوند */
const SKIP = new Set(['id', 'created_at', 'updated_at']);

export const POST: APIRoute = async (ctx) => {
  if (!admin(ctx.request)) return unauthorized();
  try {
    const cfg = ENTITIES[String(ctx.params.entity)];
    if (!cfg) return fail('موجودیت ناشناخته', 'NOT_FOUND', 404);

    const body = (await readJson(ctx.request)) as { id?: unknown };
    const id = num(body.id, 0);
    if (!id) return fail('شناسهٔ رکورد نامعتبر است', 'BAD_ID');

    const row = await q1(`SELECT * FROM ${cfg.table} WHERE id = $1`, [id]);
    if (!row) return fail('رکورد موردنظر پیدا نشد', 'NOT_FOUND', 404);

    const cols: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(row)) {
      if (SKIP.has(k)) continue;
      cols.push(k);
      values.push(k === 'status' && v !== 'new' && v !== 'read' && v !== 'replied' && v !== 'archived' ? 'draft' : v);
    }

    /* اسلاگ یکتا برای نسخهٔ کپی */
    const slugIdx = cols.indexOf('slug');
    if (slugIdx > -1) {
      const base = slugify(str(row.slug) || 'copy').slice(0, 100) || 'copy';
      let candidate = `${base}-copy`;
      let i = 2;
      while (await q1(`SELECT id FROM ${cfg.table} WHERE slug = $1`, [candidate])) candidate = `${base}-copy-${i++}`;
      values[slugIdx] = candidate;
    }

    const titleIdx = cols.findIndex((c) => c === 'title' || c === 'name');
    if (titleIdx > -1) values[titleIdx] = `${String(values[titleIdx])} (کپی)`;

    const ph = values.map((_, i) => `$${i + 1}`).join(', ');
    const created = await q1(`INSERT INTO ${cfg.table} (${cols.join(', ')}) VALUES (${ph}) RETURNING *`, values);
    await logActivity('create', cfg.table, Number(created?.id), `${cfg.label} از روی نسخهٔ موجود کپی شد`);
    return ok(created, 'نسخهٔ کپی با وضعیت پیش‌نویس ساخته شد');
  } catch (e) {
    return serverError(e);
  }
};
