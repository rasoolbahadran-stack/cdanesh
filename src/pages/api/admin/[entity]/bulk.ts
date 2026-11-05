/* API عملیات گروهی: /api/admin/[entity]/bulk
   body: { action: 'delete' | 'status' | 'star', ids: number[], value?: string | boolean } */
import type { APIRoute } from 'astro';
import { ENTITIES } from '../../../../lib/entities';
import { q } from '../../../../lib/db';
import { ok, fail, unauthorized, serverError, readJson, str, num } from '../../../../lib/http';
import { sessionFromCookies } from '../../../../lib/auth';
import { logActivity } from '../../../../lib/seed';

export const prerender = false;

const admin = (request: Request) => !!sessionFromCookies(request.headers.get('cookie') || '');

export const POST: APIRoute = async (ctx) => {
  if (!admin(ctx.request)) return unauthorized();
  try {
    const cfg = ENTITIES[String(ctx.params.entity)];
    if (!cfg) return fail('موجودیت ناشناخته', 'NOT_FOUND', 404);

    const body = (await readJson(ctx.request)) as { action?: string; ids?: unknown; value?: unknown };
    const action = str(body.action, 20);
    const ids = Array.isArray(body.ids)
      ? body.ids.map((v) => num(v, 0)).filter((v) => v > 0).slice(0, 200)
      : [];
    if (!ids.length) return fail('هیچ موردی انتخاب نشده است', 'NO_IDS');

    if (action === 'delete') {
      let deleted = 0;
      for (const id of ids) {
        try {
          await q(`DELETE FROM ${cfg.table} WHERE id = $1`, [id]);
          deleted++;
        } catch { /* رکورد مرتبط؛ رد می‌شود */ }
      }
      await logActivity('delete', cfg.table, null, `${deleted} ${cfg.label} به‌صورت گروهی حذف شد`);
      return ok({ deleted }, `${deleted} مورد حذف شد`);
    }

    if (action === 'status') {
      const value = str(body.value, 20);
      const allowed =
        cfg.table === 'messages'
          ? ['new', 'read', 'replied', 'archived']
          : ['draft', 'published', 'scheduled'];
      if (!allowed.includes(value)) return fail('وضعیت نامعتبر است', 'BAD_STATUS');
      let updated = 0;
      for (const id of ids) {
        try {
          await q(`UPDATE ${cfg.table} SET status = $1${cfg.noTimestamp ? '' : ', updated_at = now()'} WHERE id = $2`, [value, id]);
          updated++;
        } catch { /* جدول بدون ستون وضعیت؛ رد می‌شود */ }
      }
      await logActivity('update', cfg.table, null, `وضعیت ${updated} ${cfg.label} به‌صورت گروهی تغییر کرد`);
      return ok({ updated }, `وضعیت ${updated} مورد تغییر کرد`);
    }

    if (action === 'star') {
      const value = !!body.value;
      let updated = 0;
      for (const id of ids) {
        try {
          await q(`UPDATE messages SET starred = $1 WHERE id = $2`, [value, id]);
          updated++;
        } catch { /* رد می‌شود */ }
      }
      return ok({ updated }, value ? `${updated} پیام مهم علامت‌گذاری شد` : `علامت ${updated} پیام برداشته شد`);
    }

    return fail('عملیات نامعتبر است', 'BAD_ACTION');
  } catch (e) {
    return serverError(e);
  }
};
