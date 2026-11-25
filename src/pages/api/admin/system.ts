export const prerender = false;
import type { APIRoute } from 'astro';
import { q, q1, getTableColumns, syncSequence } from '../../../lib/db';
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
/* جدول سطل زباله: نسخهٔ سازگار با هر سه درایور از lib/trash (در MySQL
   از مایگریشن پایه ساخته می‌شود و اجرای DDL PostgreSQL در اینجا خطا می‌داد) */
const ensureTrashTable = () => import('../../../lib/trash').then((m) => m.ensureTrashTable());

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
      const createdAtRaw = snapshot.created_at ? new Date(String(snapshot.created_at)) : null;
      const createdAt = createdAtRaw && !isNaN(createdAtRaw.getTime()) ? createdAtRaw.toISOString().slice(0, 19).replace('T', ' ') : null;
      await q(
        'INSERT INTO media (id, filename, url, mime, size, alt, created_at) VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7, now()))',
        [id, String(snapshot.filename || ''), String(snapshot.url || ''), String(snapshot.mime || 'application/octet-stream'), Number(snapshot.size) || 0, String(snapshot.alt || ''), createdAt],
      );
      await syncSequence('media');
    } else {
      const table = TABLES[item.entity];
      if (!table) return json({ ok: false, message: 'نوع این مورد قابل بازیابی نیست' }, 400);
      const exists = await q1(`SELECT id FROM ${table} WHERE id = $1`, [id]);
      if (exists) return json({ ok: false, message: 'رکوردی با این شناسه در حال حاضر وجود دارد' }, 409);
      /* بازیابی سازگار با همهٔ درایورها: درج ستون‌به‌ستون بر اساس ستون‌های واقعی جدول */
      const tableCols = await getTableColumns(table);
      const usable = Object.keys(snapshot).filter((k) => /^[a-z_][a-z0-9_]*$/i.test(k) && tableCols.includes(k));
      if (!usable.includes('id')) usable.unshift('id');
      const ph = usable.map((_, i) => `$${i + 1}`).join(', ');
      /* تاریخ‌های ISO ذخیره‌شده در snapshot به فرمت DATETIME MySQL تبدیل می‌شوند */
      const isoToDate = (v: unknown): unknown =>
        (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v))
          ? new Date(v).toISOString().slice(0, 19).replace('T', ' ')
          : v;
      await q(
        `INSERT INTO ${table} (${usable.join(', ')}) VALUES (${ph})`,
        usable.map((c) => (c === 'id' ? id : isoToDate(snapshot[c]))),
      );
      await syncSequence(table);
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
