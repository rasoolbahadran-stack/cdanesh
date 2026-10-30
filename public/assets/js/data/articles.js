/* ═══ کافه‌دانش — API مقالات (ادغام داده پایه + پنل مدیریت) ═══ */
(function () {
  'use strict';

  const base = [].concat(window.CD_ARTICLES_A || [], window.CD_ARTICLES_B || []);

  // ادغام ویرایش‌ها و مقالات جدید پنل مدیریت
  function all() {
    const S = window.CDStore;
    const overrides = S ? S.articleOverrides() : {};
    const fresh = S ? S.newArticles() : [];
    const merged = base
      .filter(a => !(overrides[a.slug] || {}).deleted)
      .map(a => Object.assign({}, a, overrides[a.slug] || {}))
      .concat(fresh.filter(a => !(overrides[a.slug] || {}).deleted)
        .map(a => Object.assign({}, a, overrides[a.slug] || {})));
    return merged.sort((x, y) => (y.sort || 0) - (x.sort || 0));
  }

  function published(now) {
    const t = now || Date.now();
    return all().filter(a => {
      if (a.status === 'draft') return false;
      if (a.status === 'scheduled' && a.publishAt) return new Date(a.publishAt).getTime() <= t;
      return true;
    });
  }

  const bySlug = slug => all().find(a => a.slug === slug) || null;
  const byCat = cat => published().filter(a => a.cat === cat);
  const related = (a, n) => {
    const pool = published().filter(x => x.slug !== a.slug);
    const sameCat = pool.filter(x => x.cat === a.cat);
    const rest = pool.filter(x => x.cat !== a.cat);
    return sameCat.concat(rest).slice(0, n || 3);
  };
  const latest = n => published().slice(0, n || 3);

  const CATS = [
    { key: 'all', label: 'همه' },
    { key: 'design', label: 'طراحی و تجربه کاربری' },
    { key: 'seo', label: 'سئو' },
    { key: 'content', label: 'تولید محتوا' },
    { key: 'performance', label: 'عملکرد و سرعت' },
    { key: 'ai', label: 'هوش مصنوعی' },
  ];

  // رندر بلوک‌های مقاله به HTML امن (متن‌ها escape می‌شوند؛ تگ‌های مجاز فقط در لیست‌ها)
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  // متن درون‌خطی مجاز: <strong> و <b> (پس از escape، تگ‌های امن بازسازی می‌شوند)
  function rich(s) {
    return esc(s)
      .replace(/&lt;strong&gt;/g, '<strong>').replace(/&lt;\/strong&gt;/g, '</strong>')
      .replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>');
  }
  function renderBlocks(blocks) {
    let h = '', openList = null;
    const closeList = () => { if (openList) { h += openList === 'ul' ? '</ul>' : '</ol>'; openList = null; } };
    (blocks || []).forEach(b => {
      if (b.p) { closeList(); h += '<p>' + rich(b.p) + '</p>'; return; }
      if (b.h2) { closeList(); h += '<h2 id="' + esc(b.id || '') + '">' + esc(b.h2) + '</h2>'; return; }
      if (b.h3) { closeList(); h += '<h3>' + esc(b.h3) + '</h3>'; return; }
      if (b.ul) { closeList(); openList = 'ul'; h += '<ul>' + b.ul.map(li => '<li>' + rich(li) + '</li>').join('') ; return; }
      if (b.ol) { closeList(); openList = 'ol'; h += '<ol>' + b.ol.map(li => '<li>' + rich(li) + '</li>').join('') ; return; }
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

  window.CDArticles = { all, published, bySlug, byCat, related, latest, CATS, renderBlocks, esc, rich };
})();
