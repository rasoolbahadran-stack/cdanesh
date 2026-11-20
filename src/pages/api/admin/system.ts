export const prerender = false;
import type { APIRoute } from 'astro';
import { q, q1 } from '../../../lib/db';
import { sessionFromCookies } from '../../../lib/auth';
import { logActivity } from '../../../lib/seed';
import { deleteImage } from '../../../lib/storage';

const TABLES: Record<string, string> = {
  posts: 'posts',
  pages: 'pages',
  categories: 'categories',
  projects: 'projects',
  services: 'services',
  plans: 'plans',
  faqs: 'faqs',
  testimonials: 'testimonials',
  messages: 'messages',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const allowed = (request: Request) => !!sessionFromCookies(request.headers.get('cookie') || '');
const asObject = (value: unknown): Record<string, any> => {
  if (value && typeof value === 'object') return value as Record<string, any>;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as Record<string, any>; } catch { return {}; }
  }
  return {};
};
async function ensureTrashTable() {
  await q(`CREATE TABLE IF NOT EXISTS cdanesh_admin_trash (
    id bigserial PRIMARY KEY,
    entity text NOT NULL,
    entity_id bigint NOT NULL,
    snapshot jsonb NOT NULL,
    deleted_at timestamptz NOT NULL DEFAULT now(),
    restored_at timestamptz
  )`);
}

export const GET: APIRoute = async ({ request }) => {
  if (!allowed(request)) return json({ ok: false, message: 'ابتدا وارد پنل شوید' }, 401);
  try {
    const url = new URL(request.url);
    const view = url.searchParams.get('view') || 'activity';
    const limit = Math.min(300, Math.max(1, Number(url.searchParams.get('limit')) || 100));
    if (view === 'trash') {
      await ensureTrashTable();
      const rows = await q(
        'SELECT id, entity, entity_id, snapshot, deleted_at FROM cdanesh_admin_trash WHERE restored_at IS NULL ORDER BY deleted_at DESC, id DESC LIMIT ' + limit,
      );
      return json({ ok: true, rows });
    }
    const entity = String(url.searchParams.get('entity') || '');
    const params: unknown[] = [];
    let where = '';
    if (entity) {
      params.push(entity);
      where = 'WHERE entity = $1';
    }
    const rows = await q(
      `SELECT id, type, entity, entity_id, title, created_at FROM activity ${where} ORDER BY created_at DESC, id DESC LIMIT ${limit}`,
      params,
    );
    return json({ ok: true, rows });
  } catch (error) {
    console.error('[admin/system GET]', error);
    return json({ ok: false, message: 'دریافت اطلاعات ممکن نشد' }, 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!allowed(request)) return json({ ok: false, message: 'ابتدا وارد پنل شوید' }, 401);
  try {
    await ensureTrashTable();
    const body = await request.json().catch(() => ({}));
    const trashId = Number(body.id);
    if (!Number.isInteger(trashId) || trashId < 1) return json({ ok: false, message: 'شناسه موردنظر معتبر نیست' }, 400);
    const item = await q1<{ id: number; entity: string; entity_id: number; snapshot: unknown }>(
      'SELECT id, entity, entity_id, snapshot FROM cdanesh_admin_trash WHERE id = $1 AND restored_at IS NULL',
      [trashId],
    );
    if (!item) return json({ ok: false, message: 'موردی برای بازیابی پیدا نشد' }, 404);
    const snapshot = asObject(item.snapshot);
    const id = Number(item.entity_id);
    if (item.entity === 'media') {
      const exists = await q1('SELECT id FROM media WHERE id = $1', [id]);
      if (exists) return json({ ok: false, message: 'این رسانه هم‌اکنون در کتابخانه وجود دارد' }, 409);
      await q(
        'INSERT INTO media (id, filename, url, mime, size, alt, created_at) VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7::timestamptz, now()))',
        [id, String(snapshot.filename || ''), String(snapshot.url || ''), String(snapshot.mime || 'application/octet-stream'), Number(snapshot.size) || 0, String(snapshot.alt || ''), snapshot.created_at || null],
      );
      await q("SELECT setval(pg_get_serial_sequence('media', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM media), 1), true)");
    } else {
      const table = TABLES[item.entity];
      if (!table) return json({ ok: false, message: 'نوع این مورد قابل بازیابی نیست' }, 400);
      const exists = await q1(`SELECT id FROM ${table} WHERE id = $1`, [id]);
      if (exists) return json({ ok: false, message: 'رکوردی با این شناسه در حال حاضر وجود دارد' }, 409);
      await q(
        `INSERT INTO ${table} SELECT * FROM jsonb_populate_record(NULL::${table}, $1::jsonb)`,
        [JSON.stringify(snapshot)],
      );
      await q(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM ${table}), 1), true)`);
    }
    await q('UPDATE cdanesh_admin_trash SET restored_at = now() WHERE id = $1', [trashId]);
    await logActivity('restore', item.entity, id, 'مورد از سطل زباله بازیابی شد');
    return json({ ok: true, message: 'مورد با موفقیت بازیابی شد' });
  } catch (error) {
    console.error('[admin/system restore]', error);
    return json({ ok: false, message: 'بازیابی ناموفق بود؛ ممکن است رکوردی با همین شناسه وجود داشته باشد' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  if (!allowed(request)) return json({ ok: false, message: 'ابتدا وارد پنل شوید' }, 401);
  try {
    await ensureTrashTable();
    const id = Number(new URL(request.url).searchParams.get('id'));
    if (!Number.isInteger(id) || id < 1) return json({ ok: false, message: 'شناسه موردنظر معتبر نیست' }, 400);
    const item = await q1<{ id: number; entity: string; entity_id: number; snapshot: unknown }>(
      'SELECT id, entity, entity_id, snapshot FROM cdanesh_admin_trash WHERE id = $1 AND restored_at IS NULL',
      [id],
    );
    if (!item) return json({ ok: false, message: 'موردی برای حذف پیدا نشد' }, 404);
    if (item.entity === 'media') {
      const snapshot = asObject(item.snapshot);
      const removed = await deleteImage(String(snapshot.url || ''));
      if (!removed) return json({ ok: false, message: 'حذف فایل از فضای ذخیره‌سازی ناموفق بود؛ مورد در سطل زباله باقی ماند' }, 500);
    }
    await q('DELETE FROM cdanesh_admin_trash WHERE id = $1', [id]);
    await logActivity('purge', item.entity, Number(item.entity_id), 'مورد برای همیشه از سطل زباله حذف شد');
    return json({ ok: true, message: 'مورد برای همیشه حذف شد' });
  } catch (error) {
    console.error('[admin/system purge]', error);
    return json({ ok: false, message: 'حذف قطعی ناموفق بود' }, 500);
  }
};
