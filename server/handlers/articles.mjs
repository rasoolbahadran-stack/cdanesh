/* ═══ کافه‌دانش CMS — مقالات (دیتابیس Postgres / سازگاری Blob) ═══
   GET    /api/articles              → کل فهرست (با نشست مدیر) یا فقط عمومی
   GET    /api/articles?scope=public → فهرست عمومی برای سایت (بدون پیش‌نویس)
   GET    /api/articles?revisions=KEY→ تاریخچهٔ ۱۰ نسخهٔ آخر یک مقاله (مدیر)
   PUT    /api/articles {articles:[…]}     → ذخیرهٔ کامل فهرست (مدیر — سازگاری قدیم)
   POST   /api/articles {article, origId?, origSlug?} → ذخیرهٔ یک مقاله (اتمیک + تاریخچه)
   DELETE /api/articles?key=ID|SLUG       → حذف یک مقاله (اتمیک + تاریخچه)
   داده در لایهٔ store.mjs نگهداری می‌شود: با DATABASE_URL در Postgres،
   وگرنه دقیقاً مثل قبل در Vercel Blob (کلید articles.json). */
import { readDoc, writeDoc, modifyDoc, addRevision, listRevisions, dbEnabled, revisionsSupported, DB_MS } from '../lib/store.mjs';
import { isAuthedAsync, validateArticles, validateSingleArticle, publicOnly, sorted, json, readJsonBody } from '../lib/admin-auth.mjs';

const DOC_KEY = 'articles.json';

const newId = () => 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const todaySort = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };

/* خطای typed برای لغو تراکنش اتمیک با پیام مشخص */
function abortError(code, message) {
  const e = new Error(message || code);
  e.code = code;
  return e;
}

/* کلید تاریخچهٔ هر مقاله — اولویت با شناسهٔ پایدار؛ بدون شناسه، اسلاگ */
const revKeyOf = (a) => 'article:' + (a && a.id ? a.id : (a && a.slug) || 'unknown');

export default async function handler(req, res) {
  const method = (req.method || 'GET').toUpperCase();
  const url = new URL(req.url, 'http://local');

  const noStorage = () => {
    /* خطای «فضای ذخیره‌سازی نیست» فقط وقتی که نه دیتابیس و نه Blob در دسترس است */
    if (dbEnabled() || process.env.BLOB_READ_WRITE_TOKEN) return null;
    return json(res, 503, { ok: false, error: 'NO_BLOB', message: 'فضای ذخیره‌سازی (دیتابیس یا Blob) هنوز به پروژه وصل نشده است.' });
  };

  /* ─── فهرست ─── */
  if (method === 'GET') {
    const ns = noStorage();
    if (ns) return ns;

    /* تاریخچهٔ نسخه‌های یک مقاله */
    const revQ = url.searchParams.get('revisions');
    if (revQ) {
      if (!(await isAuthedAsync(req))) return json(res, 401, { ok: false, error: 'UNAUTH', message: 'نشست منقضی شده؛ دوباره وارد شو.' });
      if (!revisionsSupported()) return json(res, 200, { ok: true, supported: false, revisions: [] });
      try {
        const revisions = await listRevisions('article:' + revQ, 10);
        return json(res, 200, { ok: true, supported: true, revisions });
      } catch (e) {
        return json(res, 500, { ok: false, error: 'DB_ERROR', message: String((e && e.message) || e) });
      }
    }

    let list;
    try { list = await readDoc(DOC_KEY, { ms: DB_MS }); }
    catch (e) {
      return json(res, 500, { ok: false, error: dbEnabled() ? 'DB_ERROR' : 'BLOB_ERROR', message: String((e && e.message) || e) });
    }
    if (!Array.isArray(list)) return json(res, 404, { ok: false, error: 'EMPTY' });
    const scope = url.searchParams.get('scope');
    // امنیت: بدون نشست مدیر، فقط مقالات عمومی (بدون پیش‌نویس/زمان‌بندی‌شده) برمی‌گردد
    const out = (scope === 'public' || !(await isAuthedAsync(req))) ? publicOnly(list) : list;
    return json(res, 200, { ok: true, mode: 'cloud', db: dbEnabled(), count: out.length, articles: sorted(out) });
  }

  /* ─── ذخیرهٔ کامل فهرست (سازگاری قدیم) یا یک مقاله (مسیر جدید) ─── */
  if (method === 'PUT' || method === 'POST') {
    const ns = noStorage();
    if (ns) return ns;
    if (!(await isAuthedAsync(req))) return json(res, 401, { ok: false, error: 'UNAUTH', message: 'نشست منقضی شده؛ دوباره وارد شو.' });

    let body;
    try { body = await readJsonBody(req); }
    catch (e) {
      const err = String((e && e.message) || e);
      return json(res, err === 'BODY_TOO_LARGE' ? 413 : 400, { ok: false, error: err });
    }

    /* ── مسیر جدید: ذخیرهٔ فقط همین یک مقاله (سریع و اتمیک + تاریخچه) ── */
    if (method === 'POST' && body.article && typeof body.article === 'object' && !Array.isArray(body.article)) {
      const article = body.article;
      const invalid = validateSingleArticle(article);
      if (invalid) return json(res, 400, { ok: false, error: 'INVALID', message: invalid });

      const origId = typeof body.origId === 'string' ? body.origId : '';
      const origSlug = typeof body.origSlug === 'string' ? body.origSlug : '';

      /* fn باید «مقدار جدید سند» را برگرداند؛ اطلاعات جانبی (مقالهٔ جایگزین‌شده
         و نسخهٔ ادغام‌شده) در متغیر بیرونی نگه داشته می‌شود. */
      let meta = { replaced: null, merged: null };
      let nextList;
      try {
        nextList = await modifyDoc(DOC_KEY, (cur) => {
          const list = Array.isArray(cur) ? cur.slice() : [];
          // یافتن مبنای ویرایش: تطبیق شناسه اگر وجود دارد، وگرنه اسلاگ قدیمی
          const idx = list.findIndex(x => (origId && x.id === origId) || (origSlug && x.slug === origSlug));
          if (idx > -1) {
            const merged = Object.assign({}, list[idx], article);
            /* مقاله‌های قدیمیِ بدون شناسه (دادهٔ قبل از CMS) با اولین ویرایش
               شناسهٔ پایدار می‌گیرند تا تاریخچهٔ نسخه‌ها همیشه یکتا بماند */
            if (!merged.id) merged.id = newId();
            // اسلاگ جدید نباید با مقالهٔ دیگری تداخل کند
            const dup = list.some((x, j) => j !== idx && x.slug === merged.slug);
            if (dup) throw abortError('DUP_SLUG', 'اسلاگ «' + merged.slug + '» برای مقالهٔ دیگری استفاده شده است.');
            const next = list.slice();
            next[idx] = merged;
            meta = { replaced: list[idx], merged };
            return next;
          }
          // مقالهٔ جدید
          if (list.some(x => x.slug === article.slug)) {
            throw abortError('DUP_SLUG', 'اسلاگ «' + article.slug + '» قبلاً استفاده شده است.');
          }
          const rec = Object.assign({ id: newId(), date: '', sort: todaySort() }, article);
          if (!rec.date) rec.date = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'numeric', day: 'numeric' }).format(new Date());
          meta = { replaced: null, merged: rec };
          return [rec].concat(list);
        }, { ms: DB_MS });
      } catch (e) {
        if (e && (e.code === 'DUP_SLUG')) return json(res, 400, { ok: false, error: 'INVALID', message: e.message });
        return json(res, 500, { ok: false, error: dbEnabled() ? 'DB_ERROR' : 'BLOB_ERROR', message: String((e && e.message) || e) });
      }

      /* تاریخچه: نسخهٔ قبلی فقط وقتی واقعاً تغییر کرده ذخیره می‌شود (۱۰ نسخهٔ آخر) */
      try {
        const changed = meta.replaced && JSON.stringify(meta.replaced) !== JSON.stringify(meta.merged);
        if (changed) {
          const oldKey = revKeyOf(meta.replaced);
          await addRevision(oldKey, meta.replaced, { ms: DB_MS });
          const newKey = revKeyOf(meta.merged);
          if (newKey !== oldKey) await addRevision(newKey, meta.replaced, { ms: DB_MS });
        }
      } catch (e) { /* تاریخچه حیاتی نیست؛ انتشار نباید به‌خاطر آن شکست بخورد */ }

      return json(res, 200, {
        ok: true,
        count: nextList.length,
        article: { id: meta.merged.id, slug: meta.merged.slug, status: meta.merged.status || 'published' },
        updatedAt: new Date().toISOString(),
      });
    }

    /* ── مسیر قدیم: جایگزینی کامل فهرست (حالت سازگاری — مهاجرت دمو، اصلاح گروهی) ── */
    const invalid = validateArticles(body.articles);
    if (invalid) return json(res, 400, { ok: false, error: 'INVALID', message: invalid });

    const clean = sorted(body.articles);
    try {
      const { prev } = await modifyDoc(DOC_KEY, () => clean, { ms: DB_MS });
      /* تاریخچهٔ گروهی: نسخهٔ قبلی فهرست کامل برای مقاله‌هایی که عوض شده‌اند */
      if (Array.isArray(prev)) {
        const before = new Map(prev.map(a => [a.slug, a]));
        await Promise.all(clean.map(a => {
          const b = before.get(a.slug);
          if (b && JSON.stringify(b) !== JSON.stringify(a)) {
            return addRevision(revKeyOf(a), b, { ms: DB_MS }).catch(() => {});
          }
          return null;
        }).filter(Boolean));
      }
      return json(res, 200, { ok: true, count: clean.length, updatedAt: new Date().toISOString() });
    } catch (e) {
      return json(res, 500, { ok: false, error: dbEnabled() ? 'DB_ERROR' : 'BLOB_ERROR', message: String((e && e.message) || e) });
    }
  }

  /* ─── حذف یک مقاله (اتمیک + تاریخچه) ─── */
  if (method === 'DELETE') {
    const ns = noStorage();
    if (ns) return ns;
    if (!(await isAuthedAsync(req))) return json(res, 401, { ok: false, error: 'UNAUTH', message: 'نشست منقضی شده؛ دوباره وارد شو.' });
    const key = url.searchParams.get('key') || '';
    if (!key) return json(res, 400, { ok: false, error: 'NO_KEY', message: 'شناسهٔ مقاله مشخص نشده است.' });

    let removed = null, nextList = [];
    try {
      nextList = await modifyDoc(DOC_KEY, (cur) => {
        const list = Array.isArray(cur) ? cur.slice() : [];
        const i = list.findIndex(x => x.id === key || x.slug === key);
        if (i < 0) throw abortError('NOT_FOUND', 'مقاله‌ای با این شناسه پیدا نشد.');
        removed = list.splice(i, 1)[0];
        return list;
      }, { ms: DB_MS });
    } catch (e) {
      if (e && e.code === 'NOT_FOUND') return json(res, 404, { ok: false, error: 'EMPTY', message: e.message });
      return json(res, 500, { ok: false, error: dbEnabled() ? 'DB_ERROR' : 'BLOB_ERROR', message: String((e && e.message) || e) });
    }
    try { await addRevision(revKeyOf(removed), removed, { ms: DB_MS }); } catch (e) { /* noop */ }
    return json(res, 200, { ok: true, count: nextList.length });
  }

  return json(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
}
