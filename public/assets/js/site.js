/* ═══ کافه‌دانش — رندر داده‌محور صفحات ═══
   ترتیب اسکریپت‌ها در صفحات: store → data → site → main → forms
   (رندر پیش از اتصال تعامل‌ها انجام می‌شود.) */
(function () {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const fa = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const S = window.CDStore;

  /* ─── اعمال ویرایش‌های سئوی پنل روی صفحه جاری ─── */
  (function applySeoOverrides() {
    if (!S) return;
    /* کلیدهای سازگار: /blog (جدید)، blog و blog.html (قدیمی) — و برای خانه: index، index.html، / */
    const seg = (location.pathname || '/').replace(/\/+$/, '') || '/';
    let path = seg === '/' ? 'index' : seg.slice(seg.lastIndexOf('/') + 1);
    path = path.split('?')[0].replace(/\.html$/, '') || 'index';
    const OV = S.seoOverrides();
    const keys = ['/' + path, path, path + '.html'];
    if (path === 'index') keys.push('/');
    const ov = keys.map(k => OV[k]).find(Boolean);
    if (!ov) return;
    if (ov.title) document.title = ov.title;
    if (ov.description) {
      let m = $('meta[name="description"]');
      if (m) m.setAttribute('content', ov.description);
    }
  })();

  /* ─── کارت مقاله ─── */
  function postCard(a, delay) {
    return '<article class="post-card reveal"' + (delay ? ' data-delay="' + delay + '"' : '') + ' data-cat="' + a.cat + '">'
      + '<div class="post-thumb"><img src="' + a.cover + '" alt="' + CDArticles.esc(a.coverAlt || a.title) + '" loading="lazy" width="640" height="380">'
      + '<span class="chip chip-gold">' + CDArticles.esc(a.catLabel) + '</span></div>'
      + '<div class="post-body">'
      + '<h3><a href="/article?slug=' + encodeURIComponent(a.slug) + '">' + CDArticles.esc(a.title) + '</a></h3>'
      + '<p>' + CDArticles.esc(a.excerpt) + '</p>'
      + '<div class="post-meta"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4m8-4v4M3 10h18"/></svg> ' + a.date + '</span>'
      + '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg> ' + fa(a.read) + ' دقیقه مطالعه</span></div>'
      + '</div></article>';
  }

  /* ─── کارت نمونه‌کار (ساختار هماهنگ با CSS و اسکرول هوور) ─── */
  function pfCard(p, delay) {
    return '<article class="pf-card2 reveal"' + (delay ? ' data-delay="' + delay + '"' : '') + ' data-cat="' + p.cat + '">'
      + '<a class="pf-frame" href="' + p.link + '" aria-label="نمونه ' + CDArticles.esc(p.title) + ' — مشاهده جزئیات پروژه">'
      + '<div class="pf-scroll"><img src="' + p.cover + '" alt="نمای کامل صفحه اصلی ' + CDArticles.esc(p.title) + ' — نمونه مفهومی" width="1280" height="' + p.imgH + '" loading="lazy"></div>'
      + '<span class="pf-hint" aria-hidden="true"><span class="hint-motion"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="8" y="3" width="8" height="18" rx="4"/><path d="M12 7v3"/></svg> برای مرور خودکار، موس را نگه دارید</span>'
      + '<span class="hint-touch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14m0-14-4 4m4-4 4 4"/></svg> برای دیدن کل صفحه، انگشت را بکشید</span></span>'
      + '<span class="badge-demo">نمونه مفهومی</span></a>'
      + '<div class="pf-meta"><div class="pf-tags"><span class="chip chip-gold">' + CDArticles.esc(p.catLabel) + '</span>'
      + p.chips.map(c => '<span class="chip">' + CDArticles.esc(c) + '</span>').join('')
      + '</div><h3>' + CDArticles.esc(p.title) + '</h3><p>' + CDArticles.esc(p.summary) + '</p>'
      + '<a class="link-more" href="' + p.link + '">جزئیات پروژه <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg></a>'
      + '</div></article>';
  }

  /* ─── صفحه اصلی: مقالات اخیر ─── */
  function renderHomePosts() {
    const homePosts = $('#home-posts');
    if (homePosts && window.CDArticles) {
      homePosts.innerHTML = CDArticles.latest(3).map((a, i) => postCard(a, i)).join('');
    }
  }
  renderHomePosts();

  /* ─── صفحه اصلی: نمونه‌کارهای منتخب (با احترام به ترتیب پنل) ─── */
  const homePf = $('#home-portfolio');
  if (homePf && window.CD_PORTFOLIO) {
    const st = S ? S.portfolioState() : { hidden: [], homeHidden: [] };
    let list = CD_PORTFOLIO.filter(p => p.home
      && !(st.hidden || []).includes(p.slug) && !(st.homeHidden || []).includes(p.slug));
    if (st.order) list = list.slice().sort((a, b) => (st.order.indexOf(a.slug) + 1 || 99) - (st.order.indexOf(b.slug) + 1 || 99));
    homePf.innerHTML = list.slice(0, 3).map((p, i) => pfCard(p, i)).join('');
  }

  /* ─── صفحه نمونه‌کارها: همه پروژه‌ها ─── */
  const pfGrid = $('#pf-grid2');
  if (pfGrid && window.CD_PORTFOLIO) {
    const st = S ? S.portfolioState() : { hidden: [] };
    let list = CD_PORTFOLIO.filter(p => !(st.hidden || []).includes(p.slug));
    if (st.order) list = list.slice().sort((a, b) => (st.order.indexOf(a.slug) + 1 || 99) - (st.order.indexOf(b.slug) + 1 || 99));
    pfGrid.innerHTML = list.map((p, i) => pfCard(p, i % 3)).join('');
    const count = $('.pf-count');
    if (count) count.textContent = fa(list.length) + ' نمونه مفهومی در همه دسته‌ها';
  }

  /* ─── FAQ اختصاصی صفحات خدمات (+ Schema) ─── */
  $$('[data-page-faq]').forEach(box => {
    const key = box.dataset.pageFaq;
    if (!window.CD_FAQ_PAGES || !CD_FAQ_PAGES[key]) return;
    const ov = S ? S.faqOverrides()[key] : null;
    const items = (ov && ov.length ? ov : CD_FAQ_PAGES[key]).filter(x => x.on !== false);
    if (!items.length) return;
    box.innerHTML = items.map(it =>
      '<div class="faq-item"><button class="faq-q" aria-expanded="false">' + CDArticles.esc(it.q)
      + '<span class="fx" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></span></button>'
      + '<div class="faq-a"><div>' + CDArticles.esc(it.a) + '</div></div></div>'
    ).join('');
    // داده ساختاریافته FAQ مطابق محتوای واقعی صفحه
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: items.map(it => ({
        '@type': 'Question', name: it.q,
        acceptedAnswer: { '@type': 'Answer', text: it.a },
      })),
    });
    document.head.appendChild(ld);
  });

  /* ─── مقالات مرتبط در صفحات خدمات ─── */
  const SERVICE_ARTICLES = {
    'web-design': ['corporate-vs-eshop', 'responsive-real', 'corporate-trust'],
    'e-commerce': ['corporate-vs-eshop', 'choosing-design-method', 'image-optimization'],
    'seo': ['technical-seo-basics', 'keyword-research-intent', 'internal-linking'],
    'content-production': ['content-calendar', 'keyword-research-intent', 'ai-content-assistant'],
    'ai-solutions': ['responsible-ai', 'ai-content-assistant', 'core-web-vitals'],
    'uiux': ['responsive-real', 'common-web-mistakes', 'corporate-trust'],
    'support': ['common-web-mistakes', 'core-web-vitals', 'content-calendar'],
    'speed': ['image-optimization', 'core-web-vitals', 'technical-seo-basics'],
    'services': null, // پیش‌فرض: آخرین مقالات
  };
  function renderServiceRelated() {
    $$('[data-related-articles]').forEach(box => {
      const key = box.dataset.relatedArticles;
      const slugs = SERVICE_ARTICLES[key] || null;
      let items;
      if (slugs) {
        items = slugs.map(s => CDArticles.bySlug(s)).filter(Boolean).slice(0, 3);
      } else {
        items = CDArticles.latest(3);
      }
      box.innerHTML = items.map((a, i) => postCard(a, i)).join('');
    });
  }
  renderServiceRelated();

  /* ═══════════ صفحه مجله: جست‌وجو، فیلتر و صفحه‌بندی واقعی ═══════════ */
  const grid = $('#posts-grid');
  if (grid && window.CDArticles) {
    const PER = 6;
    const params = new URLSearchParams(location.search);
    let cat = params.get('cat') || 'all';
    let page = Math.max(1, parseInt(params.get('page'), 10) || 1);
    let posts = CDArticles.published();

    // دکمه‌های دسته‌بندی
    const catsBox = $('.blog-cats');
    if (catsBox) {
      catsBox.innerHTML = CDArticles.CATS.map(c =>
        '<button type="button" data-cat="' + c.key + '"' + (c.key === cat ? ' class="active"' : '') + '>' + c.label + '</button>').join('');
      catsBox.addEventListener('click', e => {
        const b = e.target.closest('button[data-cat]');
        if (!b) return;
        cat = b.dataset.cat; page = 1;
        $$('button', catsBox).forEach(x => x.classList.toggle('active', x === b));
        draw();
      });
    }

    const search = $('#blog-search');
    const empty = $('#blog-empty');
    const pager = $('#blog-pagination');

    function filtered() {
      const q = (search && search.value || '').trim().toLowerCase();
      return posts.filter(a => (cat === 'all' || a.cat === cat)
        && (!q || (a.title + ' ' + a.excerpt + ' ' + (a.tags || []).join(' ')).toLowerCase().includes(q)));
    }

    function draw() {
      const list = filtered();
      const pages = Math.max(1, Math.ceil(list.length / PER));
      if (page > pages) page = pages;
      const slice = list.slice((page - 1) * PER, page * PER);
      grid.innerHTML = slice.map((a, i) => postCard(a, i)).join('');
      if (empty) empty.style.display = list.length ? 'none' : 'block';
      if (window.io) $$('.reveal', grid).forEach(el => io.observe(el));
      // صفحه‌بندی واقعی
      if (pager) {
        if (pages <= 1) { pager.innerHTML = ''; }
        else {
          let h = '';
          for (let i = 1; i <= pages; i++) {
            h += i === page
              ? '<span class="current" aria-current="page">' + fa(i) + '</span>'
              : '<a href="#" data-page="' + i + '" aria-label="صفحه ' + fa(i) + '">' + fa(i) + '</a>';
          }
          if (page < pages) h += '<a href="#" data-page="' + (page + 1) + '" aria-label="صفحه بعد">←</a>';
          if (page > 1) h = '<a href="#" data-page="' + (page - 1) + '" aria-label="صفحه قبل">→</a>' + h;
          pager.innerHTML = h;
        }
      }
      if (history.replaceState) {
        const q2 = [];
        if (cat !== 'all') q2.push('cat=' + cat);
        if (page > 1) q2.push('page=' + page);
        history.replaceState(null, '', q2.length ? ('/blog?' + q2.join('&')) : '/blog');
      }
    }

    if (pager) pager.addEventListener('click', e => {
      const a = e.target.closest('a[data-page]');
      if (!a) return;
      e.preventDefault();
      page = parseInt(a.dataset.page, 10);
      draw();
      window.scrollTo({ top: grid.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
    });
    if (search) search.addEventListener('input', () => { page = 1; draw(); });
    draw();
    // به‌روزرسانی ابری: فهرست تازه ← بازرسم
    if (window.CDArticles.subscribe) CDArticles.subscribe(() => { posts = CDArticles.published(); draw(); });
  }

  /* ═══════════ صفحه مقاله ═══════════ */
  const articleRoot = $('#article-root');
  let lastArticleSig = '';
  function renderArticlePage() {
    if (!articleRoot || !window.CDArticles) return;
    const params = new URLSearchParams(location.search);
    const slug = params.get('slug') || '';
    const isPreview = params.get('preview') === '1';
    let a = CDArticles.bySlug(slug);

    // مقاله پیش‌نویس/زمان‌بندی‌شده به‌صورت عمومی در دسترس نیست
    if (a && !isPreview) {
      if (a.status === 'draft') a = null;
      else if (a.status === 'scheduled' && a.publishAt && new Date(a.publishAt).getTime() > Date.now()) a = null;
    }

    if (!a) {
      articleRoot.innerHTML = '<div class="adm-empty" style="padding:120px 20px">'
        + '<h1 class="h2" style="margin-bottom:14px">مقاله‌ای با این مشخصات پیدا نشد</h1>'
        + '<p class="muted" style="margin-bottom:26px">ممکن است آدرس تغییر کرده یا مقاله هنوز منتشر نشده باشد.</p>'
        + '<a class="btn btn-gold" href="/blog">مشاهده همه مقالات</a></div>';
      document.title = 'مقاله پیدا نشد | کافه‌دانش';
    } else {
      // متادیتای صفحه
      document.title = (a.seoTitle || (a.title + ' | کافه‌دانش'));
      const md = $('meta[name="description"]');
      if (md) md.setAttribute('content', a.seoDesc || a.excerpt);
      let canon = $('link[rel="canonical"]');
      if (!canon) { canon = document.createElement('link'); canon.rel = 'canonical'; document.head.appendChild(canon); }
      canon.href = location.origin + location.pathname + '?slug=' + encodeURIComponent(a.slug);

      // بنر مقاله: جمع‌وجور، با تصویر شاخص و مسیر واقعی
      const h2s = (a.blocks || []).filter(b => b.h2).map(b => ({ id: b.id, t: b.h2 }));
      articleRoot.innerHTML =
        '<section class="article-hero"><div class="wrap"><div class="article-hero-grid">'
        + '<div class="article-head">'
        + '<nav class="breadcrumb" aria-label="مسیر صفحه"><a href="/">خانه</a>'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>'
        + '<a href="/blog">مجله</a>'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>'
        + '<span>' + CDArticles.esc(a.catLabel) + '</span></nav>'
        + '<div class="article-cats"><span class="chip chip-gold">' + CDArticles.esc(a.catLabel) + '</span></div>'
        + '<h1>' + CDArticles.esc(a.title) + '</h1>'
        + '<div class="article-meta">'
        + '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4m8-4v4M3 10h18"/></svg> ' + a.date + '</span>'
        + '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg> ' + fa(a.read) + ' دقیقه مطالعه</span>'
        + '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 7h-9m9 5h-9m9 5h-9M4 7l2 2-2 2m2 6 2 2-2 2"/></svg> ' + CDArticles.esc(a.author) + '</span>'
        + '</div></div>'
        + '<div class="article-hero-cover"><img src="' + a.cover + '" alt="' + CDArticles.esc(a.coverAlt || a.title) + '" width="640" height="400" fetchpriority="high"></div>'
        + '</div></div></section>'

        + '<section class="section-tight" style="padding-top:10px"><div class="wrap"><div class="split">'
        + '<article class="prose">' + CDArticles.renderBlocks(a.blocks)
        + '<div class="share-row"><b>اشتراک‌گذاری:</b>'
        + '<a id="share-tg" href="#" target="_blank" rel="noopener" aria-label="اشتراک‌گذاری در تلگرام"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></a>'
        + '<a id="share-li" href="#" target="_blank" rel="noopener" aria-label="اشتراک‌گذاری در لینکدین"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V8h4v1.5A6 6 0 0 1 16 8Z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>'
        + '<button type="button" id="share-copy" aria-label="کپی لینک مقاله"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg></button>'
        + '<span class="copy-ok" id="copy-ok" hidden>لینک کپی شد</span></div>'
        + '</article>'
        + '<aside>'
        + (h2s.length > 1
          ? '<div class="aside-card"><b>فهرست مطالب</b><nav class="toc" aria-label="فهرست مطالب مقاله">'
            + h2s.map(s => '<a href="#' + s.id + '">' + CDArticles.esc(s.t) + '</a>').join('') + '</nav></div>'
          : '')
        + '<div class="aside-card" style="background:linear-gradient(150deg,rgba(227,185,83,.14),rgba(227,185,83,.04)); border-color:rgba(227,185,83,.35)">'
        + '<b>پروژه مشابهی در ذهن دارید؟</b>'
        + '<p class="muted" style="font-size:14px; margin-bottom:14px">در جلسه کوتاه مشاوره، نیاز شما بررسی و مسیر پیشنهادی ارائه می‌شود.</p>'
        + '<a class="btn btn-gold btn-block" href="/request">درخواست مشاوره رایگان</a></div>'
        + '</aside></div>'

        + (a.faq && a.faq.length
          ? '<div style="margin-top:64px"><div class="section-head side" style="margin-bottom:26px"><h2 class="h3">پرسش‌های متداول این مقاله</h2></div>'
            + '<div class="faq-list" data-article-faq>' + a.faq.map(it =>
              '<div class="faq-item"><button class="faq-q" aria-expanded="false">' + CDArticles.esc(it.q)
              + '<span class="fx" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></span></button>'
              + '<div class="faq-a"><div>' + CDArticles.esc(it.a) + '</div></div></div>').join('') + '</div></div>'
          : '')

        + '<div style="margin-top:70px"><div class="section-head side" style="margin-bottom:30px"><h2 class="h3">مقالات مرتبط</h2></div>'
        + '<div class="posts-grid" id="article-related"></div></div>'
        + '</div></section>';

      // لینک‌های اشتراک واقعی
      const url = location.href, txt = a.title;
      const tg = $('#share-tg'), li = $('#share-li'), cp = $('#share-copy');
      if (tg) tg.href = 'https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(txt);
      if (li) li.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url);
      if (cp) cp.addEventListener('click', () => {
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject())
          .then(() => { const ok = $('#copy-ok'); if (ok) { ok.hidden = false; setTimeout(() => ok.hidden = true, 2200); } })
          .catch(() => {});
      });

      // مقالات مرتبط
      const rel = $('#article-related');
      if (rel) rel.innerHTML = CDArticles.related(a, 3).map((x, i) => postCard(x, i)).join('');

      // داده ساختاریافته مقاله + مسیر
      const ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: a.title, description: a.seoDesc || a.excerpt,
        image: a.cover, author: { '@type': 'Organization', name: a.author },
        publisher: { '@type': 'Organization', name: 'کافه‌دانش' },
        mainEntityOfPage: url,
      });
      document.head.appendChild(ld);
    }
    lastArticleSig = a ? JSON.stringify(a) : '';
  }
  renderArticlePage();
  // به‌روزرسانی ابری: اگر دادهٔ سرور تغییر کرد یا مقاله جدید بود، دوباره رندر شود
  if (window.CDArticles && CDArticles.subscribe) {
    CDArticles.subscribe(() => {
      const p2 = new URLSearchParams(location.search);
      const a2 = CDArticles.bySlug(p2.get('slug') || '');
      const nextSig = a2 ? JSON.stringify(a2) : '';
      if (nextSig !== lastArticleSig) renderArticlePage();
    });
  }

  /* ═════════════ دکمه‌های پرداخت آنلاین: اتصال به درگاه فعال پنل ═════════════
     درگاه از پنل مدیریت (بخش درگاه پرداخت) ثبت و در فضای ابری ذخیره می‌شود؛
     تا وقتی درگاهی فعال نشده باشد، دکمه‌ها مخفی می‌مانند. */
  (function initPayLinks() {
    const links = $$('[data-pay]');
    if (!links.length) return;
    fetch('api/payments', { headers: { Accept: 'application/json' } })
      .then(async r => {
        const ct = r.headers.get('content-type') || '';
        if (!r.ok || !ct.includes('application/json')) return null; // بدون سرور (دمو/لوکال)
        const d = await r.json().catch(() => ({}));
        if (!d || !d.ok || !Array.isArray(d.gateways)) return null;
        return d.gateways.find(g => g && g.url) || null;
      })
      .then(gw => {
        if (!gw) return;
        links.forEach(a => {
          a.href = gw.url;
          a.target = '_blank';
          a.rel = 'noopener';
          a.removeAttribute('hidden');
        });
      })
      .catch(() => { /* بی‌صدا — دکمه‌ها مخفی می‌مانند */ });
  })();
})();
