/* ═══ کافه‌دانش — دادهٔ مقالات برای رندر سمت سرور (SSR) ═══
   دقیقاً همان منطق public/assets/js/data/articles.js روی سرور:
   ۱) فهرست ابری (Vercel Blob) — مقالات منتشرشدهٔ پنل مدیریت
   ۲) دادهٔ همراه پروژه (src/data/articles.json) — همیشه در دسترس
   خروجی: فهرست عمومی مرتب‌شده برای /blog ، /blog/[slug] و sitemap */
import bundled from '../data/articles.json';
import { head } from '@vercel/blob';

const BLOB_KEY = 'articles.json';

/* خواندن فهرست کامل ابری؛ هر خطا → null (صفحه با دادهٔ همراه پروژه رندر می‌شود) */
export async function readCloudArticles() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const meta = await head(BLOB_KEY);
    const r = await fetch(meta.url, { cache: 'no-store' });
    if (!r.ok) return null;
    const list = await r.json();
    return Array.isArray(list) ? list : null;
  } catch (e) {
    return null; // نبود فایل یا خطا → fallback به دادهٔ همراه پروژه
  }
}

/* فقط مقالات قابل نمایش برای عموم — منطق یکسان با نسخهٔ کلاینت */
export function isPublished(a, now) {
  const t = now || Date.now();
  if (!a) return false;
  if (a.status === 'draft') return false;
  if (a.status === 'scheduled' && a.publishAt) return new Date(a.publishAt).getTime() <= t;
  return true;
}

const sorted = (list) => list.slice().sort((x, y) => (y.sort || 0) - (x.sort || 0));

/* فهرست عمومی: دادهٔ ابری بر دادهٔ همراه پروژه می‌نشیند (طبق slug) */
export async function getPublicArticles(now) {
  const t = now || Date.now();
  let cloud = null;
  try { cloud = await readCloudArticles(); } catch { cloud = null; }
  const bySlug = new Map();
  for (const a of bundled) bySlug.set(a.slug, a);
  if (cloud) for (const a of cloud) if (a && a.slug) bySlug.set(a.slug, a);
  return sorted([...bySlug.values()].filter(a => isPublished(a, t)));
}

export function bySlugFrom(list, slug) {
  return list.find(a => a.slug === slug) || null;
}

export function relatedFrom(list, a, n = 3) {
  const pool = list.filter(x => x.slug !== a.slug);
  return pool.filter(x => x.cat === a.cat).concat(pool.filter(x => x.cat !== a.cat)).slice(0, n);
}

/* ─── ابزارهای رندر (قرینهٔ نسخهٔ کلاینت) ─── */
export const fa = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function rich(s) {
  return esc(s)
    .replace(/&lt;strong&gt;/g, '<strong>').replace(/&lt;\/strong&gt;/g, '</strong>')
    .replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>');
}

export function renderBlocks(blocks) {
  let h = '', openList = null;
  const closeList = () => { if (openList) { h += openList === 'ul' ? '</ul>' : '</ol>'; openList = null; } };
  (blocks || []).forEach(b => {
    if (b.p) { closeList(); h += '<p>' + rich(b.p) + '</p>'; return; }
    if (b.h2) { closeList(); h += '<h2 id="' + esc(b.id || '') + '">' + esc(b.h2) + '</h2>'; return; }
    if (b.h3) { closeList(); h += '<h3>' + esc(b.h3) + '</h3>'; return; }
    if (b.ul) { closeList(); openList = 'ul'; h += '<ul>' + b.ul.map(li => '<li>' + rich(li) + '</li>').join(''); return; }
    if (b.ol) { closeList(); openList = 'ol'; h += '<ol>' + b.ol.map(li => '<li>' + rich(li) + '</li>').join(''); return; }
    if (b.quote) { closeList(); h += '<blockquote>' + rich(b.quote) + '</blockquote>'; return; }
    if (b.img) {
      closeList();
      const i = b.img;
      h += '<figure class="prose-fig"><img src="' + esc(i.src) + '" alt="' + esc(i.alt || '') + '" loading="lazy" width="1200" height="900">'
        + (i.cap ? '<figcaption>' + esc(i.cap) + '</figcaption>' : '') + '</figure>';
      return;
    }
    if (b.table) {
      closeList();
      const t = b.table;
      h += '<div class="table-wrap"><table><thead><tr>' + t.head.map(th => '<th>' + esc(th) + '</th>').join('') + '</tr></thead><tbody>'
        + t.rows.map(r => '<tr>' + r.map(td => '<td>' + rich(td) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
      return;
    }
    if (b.cta) {
      closeList();
      const c = b.cta;
      h += '<div class="prose-cta"><p>' + esc(c.pre) + ' <a href="' + esc(c.link) + '">' + esc(c.label) + '</a>' + esc(c.post || '') + '</p></div>';
      return;
    }
  });
  closeList();
  return h;
}

/* کارت مقاله — ساختار هماهنگ با CSS و نسخهٔ کلاینت؛ لینک به /blog/<slug> */
export function postCardHtml(a, delay) {
  return '<article class="post-card reveal"' + (delay ? ' data-delay="' + delay + '"' : '') + ' data-cat="' + esc(a.cat) + '">'
    + '<div class="post-thumb"><img src="' + esc(a.cover) + '" alt="' + esc(a.coverAlt || a.title) + '" loading="lazy" width="640" height="380">'
    + '<span class="chip chip-gold">' + esc(a.catLabel) + '</span></div>'
    + '<div class="post-body">'
    + '<h3><a href="/blog/' + encodeURIComponent(a.slug) + '">' + esc(a.title) + '</a></h3>'
    + '<p>' + esc(a.excerpt) + '</p>'
    + '<div class="post-meta"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4m8-4v4M3 10h18"/></svg> ' + esc(a.date) + '</span>'
    + '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg> ' + fa(a.read) + ' دقیقه مطالعه</span></div>'
    + '</div></article>';
}

export const CATS = [
  { key: 'all', label: 'همه' },
  { key: 'design', label: 'طراحی و تجربه کاربری' },
  { key: 'seo', label: 'سئو' },
  { key: 'content', label: 'تولید محتوا' },
  { key: 'performance', label: 'عملکرد و سرعت' },
  { key: 'ai', label: 'هوش مصنوعی' },
];

/* نقشهٔ مقالات مرتبط صفحات خدمات (قرینهٔ site.js) — برای رندر استاتیک */
export const SERVICE_ARTICLES = {
  'web-design': ['corporate-vs-eshop', 'responsive-real', 'corporate-trust'],
  'e-commerce': ['corporate-vs-eshop', 'choosing-design-method', 'image-optimization'],
  'seo': ['technical-seo-basics', 'keyword-research-intent', 'internal-linking'],
  'content-production': ['content-calendar', 'keyword-research-intent', 'ai-content-assistant'],
  'ai-solutions': ['responsible-ai', 'ai-content-assistant', 'core-web-vitals'],
  'uiux': ['responsive-real', 'common-web-mistakes', 'corporate-trust'],
  'support': ['common-web-mistakes', 'core-web-vitals', 'content-calendar'],
  'speed': ['image-optimization', 'core-web-vitals', 'technical-seo-basics'],
  'services': null,
};

/* مقالات مرتبط یک صفحهٔ خدمت — برای استفاده در frontmatter صفحات استاتیک */
export function serviceRelated(key, n = 3) {
  const slugs = SERVICE_ARTICLES[key];
  const list = [...bundled].sort((x, y) => (y.sort || 0) - (x.sort || 0));
  const items = slugs
    ? slugs.map(s => list.find(a => a.slug === s)).filter(Boolean)
    : list;
  return items.slice(0, n);
}
