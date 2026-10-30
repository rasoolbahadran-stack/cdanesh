/* ═══ کافه‌دانش — پنل مدیریت (نسخه آزمایشی سمت مرورگر) ═══
   در نسخه نهایی Next.js این پنل با احراز هویت سمت سرور، دیتابیس
   و APIهای واقعی پیاده‌سازی می‌شود؛ ساختار ماژول‌ها همین حفظ می‌گردد. */
(function () {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const fa = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ─── محافظت ساده مسیر: بدون نشست → صفحه ورود ─── */
  if (!window.CDStore || !CDStore.session()) {
    location.replace('admin-login.html');
    return;
  }

  const viewEl = $('#adm-view');
  let view = viewEl;
  function swapView() {
    const fresh = viewEl.cloneNode(false); // پاک‌سازی شنونده‌های رویداد نمای قبلی
    viewEl.parentNode.replaceChild(fresh, viewEl);
    view = fresh;
  }
  const toast = msg => {
    let t = $('#adm-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'adm-toast';
      t.style.cssText = 'position:fixed; bottom:24px; inset-inline-start:50%; transform:translateX(50%); background:#0a0a0e; border:1px solid rgba(227,185,83,.5); color:var(--gold-2); padding:11px 22px; border-radius:999px; font-size:13.5px; z-index:300; box-shadow:0 20px 50px -20px rgba(0,0,0,.9)';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._h);
    t._h = setTimeout(() => { t.style.opacity = '0'; }, 2600);
  };

  /* تاریخ شمسی ساده برای نمایش پیام‌ها */
  function faDate(iso) {
    try {
      const d = new Date(iso);
      return fa(d.getFullYear()) + '/' + fa(String(d.getMonth() + 1).padStart(2, '0')) + '/' + fa(String(d.getDate()).padStart(2, '0'))
        + ' — ' + fa(String(d.getHours()).padStart(2, '0')) + ':' + fa(String(d.getMinutes()).padStart(2, '0'));
    } catch (e) { return ''; }
  }

  /* ─── مبدل متن ساده → بلوک‌های مقاله ───
     ## تیتر سطح ۲ | ### تیتر ۳ | - فهرست | 1. فهرست شماره‌دار | > نقل‌قول
     [img] آدرس | متن جایگزین | کپشن | پاراگراف معمولی */
  function textToBlocks(text) {
    const out = [];
    let ul = null, ol = null;
    const flush = () => { if (ul) { out.push({ ul }); ul = null; } if (ol) { out.push({ ol }); ol = null; } };
    String(text || '').split(/\n/).forEach(raw => {
      const line = raw.trim();
      if (!line) { flush(); return; }
      if (line.startsWith('### ')) { flush(); out.push({ h3: line.slice(4) }); return; }
      if (line.startsWith('## ')) { flush(); out.push({ h2: line.slice(3), id: 's' + (out.filter(b => b.h2).length + 1) }); return; }
      if (line.startsWith('> ')) { flush(); out.push({ quote: line.slice(2) }); return; }
      if (line.startsWith('[img] ')) {
        flush();
        const parts = line.slice(6).split('|').map(s => s.trim());
        out.push({ img: { src: parts[0] || '', alt: parts[1] || '', cap: parts[2] || '' } });
        return;
      }
      if (/^-\s/.test(line)) { if (ol) { out.push({ ol }); ol = null; } (ul = ul || []).push(line.replace(/^-\s/, '')); return; }
      if (/^\d+\.\s/.test(line)) { if (ul) { out.push({ ul }); ul = null; } (ol = ol || []).push(line.replace(/^\d+\.\s/, '')); return; }
      flush(); out.push({ p: line });
    });
    flush();
    return out;
  }
  function blocksToText(blocks) {
    return (blocks || []).map(b => {
      if (b.p) return b.p;
      if (b.h2) return '## ' + b.h2;
      if (b.h3) return '### ' + b.h3;
      if (b.quote) return '> ' + b.quote;
      if (b.ul) return b.ul.map(x => '- ' + x).join('\n');
      if (b.ol) return b.ol.map((x, i) => (i + 1) + '. ' + x).join('\n');
      if (b.img) return '[img] ' + b.img.src + ' | ' + (b.img.alt || '') + ' | ' + (b.img.cap || '');
      if (b.cta) return b.cta.pre + ' ← ' + b.cta.link + ' ← ' + b.cta.label;
      if (b.table) return '[table] ' + b.table.head.join(' | ');
      return '';
    }).join('\n\n');
  }

  /* ─── مقاله: ادغام داده پایه و پنل ─── */
  function allArticles() { return CDArticles.all(); }
  function findArticle(key) {
    return allArticles().find(a => (a.id === key || a.slug === key)) || null;
  }
  const COVER_OPTIONS = ['assets/img/cover-blog.webp', 'assets/img/cover-ai.webp', 'assets/img/cover-cwv.webp', 'assets/img/cover-responsive.webp', 'assets/img/cover-corporate.webp', 'assets/img/service-web.webp', 'assets/img/service-seo.webp', 'assets/img/service-content.webp', 'assets/img/ai-tools.webp'];

  function statusPill(a) {
    if (a.status === 'draft') return '<span class="status-pill st-draft">پیش‌نویس</span>';
    if (a.status === 'scheduled') return '<span class="status-pill st-new">زمان‌بندی‌شده</span>';
    return '<span class="status-pill st-pub">منتشرشده</span>';
  }

  /* ═════════════ نمای مقالات: فهرست ═════════════ */
  function renderArticles() {
    const list = allArticles();
    view.innerHTML =
      '<div class="adm-topbar"><div><h1>مدیریت مقالات</h1><p class="lead">تولید، ویرایش، پیش‌نمایش و انتشار مقالات مجله</p></div>'
      + '<div class="adm-actions"><button type="button" class="btn btn-gold" id="new-article">+ مقاله جدید</button></div></div>'
      + '<div class="adm-panel"><div class="adm-toolbar">'
      + '<input class="control" id="art-search" type="search" placeholder="جست‌وجو در عنوان‌ها…">'
      + '<select class="control" id="art-status" style="max-width:180px"><option value="all">همه وضعیت‌ها</option><option value="published">منتشرشده</option><option value="draft">پیش‌نویس</option><option value="scheduled">زمان‌بندی‌شده</option></select>'
      + '</div><div class="adm-table-wrap"><table class="adm-table"><thead><tr><th>عنوان</th><th>دسته</th><th>وضعیت</th><th>تاریخ</th><th>اقدام‌ها</th></tr></thead><tbody id="art-rows"></tbody></table></div></div>';

    const rows = $('#art-rows');
    const draw = () => {
      const q = ($('#art-search').value || '').trim().toLowerCase();
      const st = $('#art-status').value;
      const items = list.filter(a => (!q || a.title.toLowerCase().includes(q)) && (st === 'all' || (a.status || 'published') === st));
      rows.innerHTML = items.map(a => {
        const key = a.id || a.slug;
        const isNew = !!a.id;
        const isPub = (a.status || 'published') === 'published';
        return '<tr><td><b style="font-size:13.5px">' + esc(a.title) + '</b><br><span style="font-size:11px;color:var(--faint)" dir="ltr">' + esc(a.slug) + '</span></td>'
          + '<td>' + esc(a.catLabel) + '</td><td>' + statusPill(a) + '</td><td style="white-space:nowrap">' + a.date + '</td>'
          + '<td><div class="row-actions">'
          + '<button class="adm-btn" data-act="edit" data-key="' + esc(key) + '">ویرایش</button>'
          + '<a class="adm-btn" href="article.html?slug=' + encodeURIComponent(a.slug) + '&preview=1" target="_blank">پیش‌نمایش</a>'
          + '<button class="adm-btn" data-act="toggle" data-key="' + esc(key) + '">' + (isPub ? 'لغو انتشار' : 'انتشار') + '</button>'
          + (isNew ? '<button class="adm-btn danger" data-act="delete" data-key="' + esc(key) + '">حذف</button>' : '')
          + '</div></td></tr>';
      }).join('') || '<tr><td colspan="5"><div class="adm-empty">مقاله‌ای با این مشخصات پیدا نشد.</div></td></tr>';
    };
    $('#art-search').addEventListener('input', draw);
    $('#art-status').addEventListener('change', draw);
    $('#new-article').addEventListener('click', () => { location.hash = '#/articles/new'; });
    rows.addEventListener('click', e => {
      const b = e.target.closest('button[data-act]');
      if (!b) return;
      const key = b.dataset.key, a = findArticle(key);
      if (!a) return;
      if (b.dataset.act === 'edit') location.hash = '#/articles/edit/' + encodeURIComponent(key);
      if (b.dataset.act === 'toggle') {
        const next = (a.status || 'published') === 'published' ? 'draft' : 'published';
        if (a.id) CDStore.updateNewArticle(a.id, { status: next });
        else CDStore.saveArticleOverride(a.slug, { status: next });
        toast(next === 'published' ? 'مقاله منتشر شد' : 'انتشار لغو شد');
        renderArticles();
      }
      if (b.dataset.act === 'delete') {
        if (confirm('این مقاله جدید کاملاً حذف شود؟')) { CDStore.deleteNewArticle(a.id); toast('مقاله حذف شد'); renderArticles(); }
      }
    });
    draw();
  }

  /* ═════════════ نمای ویرایش/تولید مقاله ═════════════ */
  function renderArticleEditor(key) {
    const isNew = !key;
    const a = isNew ? {
      title: '', slug: '', excerpt: '', cat: 'seo', catLabel: 'سئو', tags: [], author: 'تیم محتوای کافه‌دانش',
      date: '—', read: 5, cover: COVER_OPTIONS[0], coverAlt: '', seoTitle: '', seoDesc: '',
      status: 'draft', publishAt: '', blocks: [],
    } : findArticle(key);

    if (!isNew && !a) { location.hash = '#/articles'; return; }

    const catLabels = { design: 'طراحی و تجربه کاربری', seo: 'سئو', content: 'تولید محتوا', performance: 'عملکرد و سرعت', ai: 'هوش مصنوعی' };

    view.innerHTML =
      '<div class="adm-topbar"><div><h1>' + (isNew ? 'مقاله جدید' : 'ویرایش مقاله') + '</h1><p class="lead">' + (isNew ? 'پیش‌نویس را بسازید، بازبینی کنید و سپس منتشر کنید.' : esc(a.title)) + '</p></div>'
      + '<div class="adm-actions"><button type="button" class="btn btn-ghost" id="art-back">بازگشت</button>'
      + '<button type="button" class="btn btn-gold" id="art-save">ذخیره</button></div></div>'
      + '<div class="adm-panel">'
      + '<div class="adm-form-grid">'
      + '<div><label class="adm-label" for="f-title">عنوان مقاله *</label><input class="control" id="f-title" value="' + esc(a.title) + '"><button type="button" class="adm-btn" id="f-makeslug" style="margin-top:6px">تولید اسلاگ از عنوان</button></div>'
      + '<div><label class="adm-label" for="f-slug">اسلاگ (انگلیسی، یکتا) *</label><input class="control" id="f-slug" dir="ltr" style="text-align:left" value="' + esc(a.slug) + '"><p class="adm-hint">آدرس مقاله: article.html?slug=… — پس از انتشار تغییر ندهید.</p></div>'
      + '<div class="field-full"><label class="adm-label" for="f-excerpt">خلاصه / توضیحات متا *</label><textarea class="control" id="f-excerpt" style="min-height:70px">' + esc(a.excerpt) + '</textarea></div>'
      + '<div><label class="adm-label" for="f-cat">دسته‌بندی</label><select class="control" id="f-cat">' + Object.entries(catLabels).map(([k, v]) => '<option value="' + k + '"' + (a.cat === k ? ' selected' : '') + '>' + v + '</option>').join('') + '</select></div>'
      + '<div><label class="adm-label" for="f-tags">برچسب‌ها (با ویرگول)</label><input class="control" id="f-tags" value="' + esc((a.tags || []).join('، ')) + '"></div>'
      + '<div><label class="adm-label" for="f-author">نویسنده</label><input class="control" id="f-author" value="' + esc(a.author) + '"></div>'
      + '<div><label class="adm-label" for="f-read">زمان مطالعه (دقیقه)</label><input class="control" id="f-read" type="number" min="1" max="60" value="' + (a.read || 5) + '"></div>'
      + '<div><label class="adm-label" for="f-status">وضعیت انتشار</label><select class="control" id="f-status">'
      + '<option value="draft"' + (a.status === 'draft' ? ' selected' : '') + '>پیش‌نویس</option>'
      + '<option value="published"' + ((a.status || 'published') === 'published' ? ' selected' : '') + '>منتشرشده</option>'
      + '<option value="scheduled"' + (a.status === 'scheduled' ? ' selected' : '') + '>زمان‌بندی‌شده</option>'
      + '</select></div>'
      + '<div><label class="adm-label" for="f-publishat">زمان انتشار (برای حالت زمان‌بندی)</label><input class="control" id="f-publishat" type="datetime-local" dir="ltr" value="' + esc(a.publishAt || '') + '"><p class="adm-hint">مقاله زمان‌بندی‌شده پیش از این زمان به‌صورت عمومی نمایش داده نمی‌شود.</p></div>'
      + '<div class="field-full"><label class="adm-label" for="f-cover">تصویر شاخص</label><select class="control" id="f-cover">' + COVER_OPTIONS.map(c => '<option value="' + c + '"' + (a.cover === c ? ' selected' : '') + ' dir="ltr">' + c + '</option>').join('') + '</select></div>'
      + '<div class="field-full"><label class="adm-label" for="f-coveralt">متن جایگزین تصویر شاخص (Alt) *</label><input class="control" id="f-coveralt" value="' + esc(a.coverAlt || '') + '"></div>'
      + '<div><label class="adm-label" for="f-seotitle">عنوان سئو</label><input class="control" id="f-seotitle" value="' + esc(a.seoTitle || '') + '"></div>'
      + '<div><label class="adm-label" for="f-seodesc">توضیحات متا</label><input class="control" id="f-seodesc" value="' + esc(a.seoDesc || '') + '"></div>'
      + '</div>'
      + '<div style="margin-top:22px"><label class="adm-label" for="f-content">محتوای مقاله *</label>'
      + '<p class="adm-hint" style="margin-bottom:10px">ساختار: «## تیتر اصلی»، «### زیرتیتر»، «- فهرست»، «1. فهرست شماره‌دار»، «> نقل‌قول»، «[img] آدرس | Alt | کپشن» — خط خالی یعنی پاراگراف جدید. لینک خدمت مرتبط را در انتهای مقاله بنویسید.</p>'
      + '<div class="adm-editor">'
      + '<textarea class="control" id="f-content" placeholder="متن مقاله…">' + esc(blocksToText(a.blocks)) + '</textarea>'
      + '<div class="adm-preview prose" id="f-preview"><p style="color:var(--faint)">پیش‌نمایش زنده در همین‌جا رندر می‌شود…</p></div>'
      + '</div></div>'
      + '<div style="margin-top:22px; display:flex; gap:10px; flex-wrap:wrap">'
      + '<button type="button" class="btn btn-gold" id="art-save2">ذخیره</button>'
      + '<button type="button" class="btn btn-ghost" id="art-save-draft">ذخیره به‌عنوان پیش‌نویس</button>'
      + '</div></div>';

    const preview = $('#f-preview');
    const updatePreview = () => {
      const blocks = textToBlocks($('#f-content').value);
      preview.innerHTML = CDArticles.renderBlocks(blocks) || '<p style="color:var(--faint)">چیزی برای نمایش نیست…</p>';
    };
    $('#f-content').addEventListener('input', updatePreview);
    updatePreview();

    $('#f-makeslug').addEventListener('click', () => {
      const s = $('#f-title').value.trim()
        .replace(/[؟?!,،.:؛«»()\[\]{}"'@#$%^&*+=|\\/~`]/g, '')
        .replace(/\s+/g, '-').slice(0, 60);
      $('#f-slug').value = s;
    });
    $('#art-back').addEventListener('click', () => { location.hash = '#/articles'; });

    const save = (forcedStatus) => {
      const title = $('#f-title').value.trim();
      const slug = $('#f-slug').value.trim();
      const excerpt = $('#f-excerpt').value.trim();
      const content = $('#f-content').value.trim();
      if (!title || !slug || !excerpt || !content) { alert('عنوان، اسلاگ، خلاصه و محتوا الزامی است.'); return; }
      if (!/^[a-zA-Z0-9\u0600-\u06FF-]+$/.test(slug)) { alert('اسلاگ فقط شامل حروف، عدد و خط تیره باشد.'); return; }
      const dup = allArticles().find(x => x.slug === slug && (x.id || x.slug) !== (a.id || a.slug));
      if (dup) { alert('این اسلاگ برای مقاله دیگری استفاده شده است.'); return; }

      const cat = $('#f-cat').value;
      const status = forcedStatus || $('#f-status').value;
      const publishAt = status === 'scheduled' ? $('#f-publishat').value : '';
      const data = {
        title, slug, excerpt,
        cat, catLabel: catLabels[cat],
        tags: $('#f-tags').value.split(/[،,]/).map(t => t.trim()).filter(Boolean),
        author: $('#f-author').value.trim() || 'تیم محتوای کافه‌دانش',
        read: Math.max(1, parseInt($('#f-read').value, 10) || 5),
        cover: $('#f-cover').value,
        coverAlt: $('#f-coveralt').value.trim() || title,
        seoTitle: $('#f-seotitle').value.trim() || (title + ' | کافه‌دانش'),
        seoDesc: $('#f-seodesc').value.trim() || excerpt,
        status, publishAt,
        blocks: textToBlocks(content),
        updated: '۱۴۰۵/۰۸/۱۴',
      };

      if (isNew) {
        const rec = Object.assign({
          id: 'n' + Date.now(), date: '۱۴۰۵/۰۸/۱۴', sort: 20251114,
        }, data);
        CDStore.addNewArticle(rec);
      } else if (a.id) {
        CDStore.updateNewArticle(a.id, data);
      } else {
        CDStore.saveArticleOverride(a.slug, data);
      }
      toast('مقاله ذخیره شد');
      location.hash = '#/articles';
    };
    $('#art-save').addEventListener('click', () => save());
    $('#art-save2').addEventListener('click', () => save());
    $('#art-save-draft').addEventListener('click', () => save('draft'));
  }

  /* ═════════════ صفحات: عنوان و توضیحات متا ═════════════ */
  const PAGE_LIST = [
    { path: 'index.html', name: 'صفحه اصلی' },
    { path: 'services.html', name: 'همه خدمات' },
    { path: 'web-design.html', name: 'طراحی سایت' },
    { path: 'e-commerce.html', name: 'فروشگاه اینترنتی' },
    { path: 'uiux.html', name: 'طراحی UI/UX' },
    { path: 'seo.html', name: 'سئو' },
    { path: 'content-production.html', name: 'تولید محتوا' },
    { path: 'speed-optimization.html', name: 'بهینه‌سازی سرعت' },
    { path: 'ai-solutions.html', name: 'هوش مصنوعی' },
    { path: 'support.html', name: 'پشتیبانی' },
    { path: 'portfolio.html', name: 'نمونه‌کارها' },
    { path: 'blog.html', name: 'مجله' },
    { path: 'faq.html', name: 'سؤالات متداول' },
    { path: 'about.html', name: 'درباره ما' },
    { path: 'contact.html', name: 'تماس' },
    { path: 'request.html', name: 'ثبت درخواست' },
    { path: 'privacy.html', name: 'حریم خصوصی' },
    { path: 'terms.html', name: 'شرایط استفاده' },
  ];

  function renderPages() {
    swapView();
    const ov = CDStore.seoOverrides();
    view.innerHTML =
      '<div class="adm-topbar"><div><h1>مدیریت صفحات</h1><p class="lead">عنوان و توضیحات متای هر صفحه — پس از ذخیره، در بارگذاری بعدی همان صفحه اعمال می‌شود.</p></div></div>'
      + '<div class="adm-panel"><div class="adm-table-wrap"><table class="adm-table"><thead><tr><th>صفحه</th><th style="min-width:220px">عنوان سئو</th><th style="min-width:260px">توضیحات متا</th><th></th></tr></thead><tbody>'
      + PAGE_LIST.map(p => {
        const o = ov[p.path] || {};
        return '<tr data-page="' + p.path + '"><td><b style="font-size:13px">' + p.name + '</b><br><span dir="ltr" style="font-size:11px;color:var(--faint)">' + p.path + '</span></td>'
          + '<td><input class="control pg-title" value="' + esc(o.title || '') + '" placeholder="پیش‌فرض فعلی صفحه"></td>'
          + '<td><input class="control pg-desc" value="' + esc(o.description || '') + '" placeholder="پیش‌فرض فعلی صفحه"></td>'
          + '<td><button class="adm-btn" data-save="' + p.path + '">ذخیره</button></td></tr>';
      }).join('')
      + '</tbody></table></div></div>';

    view.addEventListener('click', function onSave(e) {
      const b = e.target.closest('button[data-save]');
      if (!b) return;
      const tr = b.closest('tr');
      const path = b.dataset.save;
      const title = $('.pg-title', tr).value.trim();
      const description = $('.pg-desc', tr).value.trim();
      CDStore.saveSeo(path, { title, description });
      toast('سئوی «' + path + '» ذخیره شد');
    });
  }

  /* ═════════════ نمونه‌کارها ═════════════ */
  function renderPortfolio() {
    swapView();
    const st = CDStore.portfolioState();
    const order = st.order || CD_PORTFOLIO.map(p => p.slug);
    const bySlug = s => CD_PORTFOLIO.find(p => p.slug === s);
    const items = order.map(bySlug).filter(Boolean).concat(CD_PORTFOLIO.filter(p => !order.includes(p.slug)));

    view.innerHTML =
      '<div class="adm-topbar"><div><h1>مدیریت نمونه‌کارها</h1><p class="lead">ترتیب نمایش، نمایش در صفحه اصلی و نمایش در صفحه نمونه‌کارها</p></div></div>'
      + '<div class="adm-panel"><div class="adm-table-wrap"><table class="adm-table"><thead><tr><th>پروژه</th><th>دسته</th><th>صفحه اصلی</th><th>صفحه نمونه‌کارها</th><th>ترتیب</th></tr></thead><tbody>'
      + items.map((p, i) => {
        const hidden = (st.hidden || []).includes(p.slug);
        const homeHidden = (st.homeHidden || []).includes(p.slug);
        return '<tr><td><b style="font-size:13.5px">' + esc(p.title) + '</b><br><span dir="ltr" style="font-size:11px;color:var(--faint)">' + p.link + '</span></td>'
          + '<td>' + esc(p.catLabel) + '</td>'
          + '<td><button class="adm-btn' + (homeHidden ? '' : ' primary') + '" data-home="' + p.slug + '">' + (homeHidden ? 'نمایش داده نمی‌شود' : 'نمایش') + '</button></td>'
          + '<td><button class="adm-btn' + (hidden ? ' danger' : ' primary') + '" data-hide="' + p.slug + '">' + (hidden ? 'مخفی' : 'نمایش') + '</button></td>'
          + '<td><div class="row-actions"><button class="adm-btn" data-up="' + p.slug + '"' + (i === 0 ? ' disabled' : '') + '>▲</button><button class="adm-btn" data-down="' + p.slug + '"' + (i === items.length - 1 ? ' disabled' : '') + '>▼</button></div></td></tr>';
      }).join('')
      + '</tbody></table></div>'
      + '<p class="adm-hint" style="margin-top:14px">نمونه‌کارهای مفهومی با برچسب «نمونه مفهومی» منتشر می‌شوند؛ در نسخه اصلی، پروژه‌های واقعی با اجازه صاحبان‌شان جای آن‌ها را می‌گیرند.</p></div>';

    const persist = (newSt) => { CDStore.savePortfolioState(newSt); renderPortfolio(); };
    view.addEventListener('click', function h(e) {
      const b = e.target.closest('button');
      if (!b) return;
      const cur = CDStore.portfolioState();
      const orderNow = cur.order || CD_PORTFOLIO.map(p => p.slug);
      if (b.dataset.home) {
        const hh = (cur.homeHidden || []);
        hh.includes(b.dataset.home) ? hh.splice(hh.indexOf(b.dataset.home), 1) : hh.push(b.dataset.home);
        persist(Object.assign({}, cur, { homeHidden: hh }));
      } else if (b.dataset.hide) {
        const hd = (cur.hidden || []);
        hd.includes(b.dataset.hide) ? hd.splice(hd.indexOf(b.dataset.hide), 1) : hd.push(b.dataset.hide);
        persist(Object.assign({}, cur, { hidden: hd }));
      } else if (b.dataset.up || b.dataset.down) {
        const slug = b.dataset.up || b.dataset.down;
        const i = orderNow.indexOf(slug);
        const j = b.dataset.up ? i - 1 : i + 1;
        if (i > -1 && j > -1 && j < orderNow.length) {
          [orderNow[i], orderNow[j]] = [orderNow[j], orderNow[i]];
          persist(Object.assign({}, cur, { order: orderNow }));
        }
      }
    });
  }

  /* ═════════════ سؤالات متداول ═════════════ */
  function renderFaq() {
    const keys = Object.keys(window.CD_FAQ_PAGES || {});
    const labels = { 'web-design': 'طراحی سایت', 'e-commerce': 'فروشگاه اینترنتی', 'seo': 'سئو', 'content-production': 'تولید محتوا', 'ai-solutions': 'هوش مصنوعی', 'uiux': 'UI/UX', 'support': 'پشتیبانی', 'speed': 'سرعت', 'services': 'همه خدمات' };
    let current = keys[0];

    view.innerHTML =
      '<div class="adm-topbar"><div><h1>مدیریت سؤالات متداول</h1><p class="lead">سؤال‌های صفحات خدمات: ویرایش، ترتیب و فعال/غیرفعال‌کردن — پس از ذخیره روی همان صفحه اعمال می‌شود.</p></div>'
      + '<div class="adm-actions"><button type="button" class="btn btn-gold" id="faq-add">+ سؤال جدید</button>'
      + '<button type="button" class="btn btn-ghost" id="faq-save">ذخیره تغییرات</button></div></div>'
      + '<div class="adm-panel"><div class="adm-tabs" id="faq-tabs">'
      + keys.map(k => '<button type="button" data-key="' + k + '"' + (k === current ? ' class="active"' : '') + '>' + (labels[k] || k) + '</button>').join('')
      + '</div><div id="faq-editor"></div></div>';

    const editor = $('#faq-editor');
    const itemsOf = key => {
      const ov = CDStore.faqOverrides()[key];
      return (ov && ov.length ? ov : CD_FAQ_PAGES[key]).map(x => Object.assign({}, x));
    };
    let working = itemsOf(current);

    const draw = () => {
      editor.innerHTML = working.map((it, i) =>
        '<div class="adm-check" style="flex-wrap:wrap; gap:10px">'
        + '<input type="checkbox" data-idx="' + i + '" data-field="on"' + (it.on !== false ? ' checked' : '') + '>'
        + '<div style="flex:1; display:grid; gap:8px">'
        + '<input class="control" data-idx="' + i + '" data-field="q" value="' + esc(it.q) + '" placeholder="سؤال">'
        + '<textarea class="control" data-idx="' + i + '" data-field="a" style="min-height:60px" placeholder="پاسخ">' + esc(it.a) + '</textarea>'
        + '</div>'
        + '<div style="display:grid; gap:6px"><button class="adm-btn" data-up="' + i + '"' + (i === 0 ? ' disabled' : '') + '>▲</button><button class="adm-btn" data-down="' + i + '"' + (i === working.length - 1 ? ' disabled' : '') + '>▼</button><button class="adm-btn danger" data-del="' + i + '">حذف</button></div>'
        + '</div>').join('');
    };
    draw();

    $('#faq-tabs').addEventListener('click', e => {
      const b = e.target.closest('button[data-key]');
      if (!b) return;
      $$('#faq-tabs button').forEach(x => x.classList.toggle('active', x === b));
      current = b.dataset.key;
      working = itemsOf(current);
      draw();
    });
    editor.addEventListener('input', e => {
      const el = e.target;
      if (!el.dataset.idx) return;
      const i = +el.dataset.idx, f = el.dataset.field;
      if (f === 'on') working[i].on = el.checked;
      else working[i][f] = el.value;
    });
    editor.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.del !== undefined) working.splice(+b.dataset.del, 1);
      if (b.dataset.up !== undefined) { const i = +b.dataset.up; [working[i - 1], working[i]] = [working[i], working[i - 1]]; }
      if (b.dataset.down !== undefined) { const i = +b.dataset.down; [working[i + 1], working[i]] = [working[i], working[i + 1]]; }
      draw();
    });
    $('#faq-add').addEventListener('click', () => { working.push({ q: 'سؤال جدید', a: 'پاسخ…', on: true }); draw(); });
    $('#faq-save').addEventListener('click', () => { CDStore.saveFaqPage(current, working); toast('سؤالات «' + (labels[current] || current) + '» ذخیره شد'); });
  }

  /* ═════════════ پیام‌ها ═════════════ */
  function renderMessages() {
    const list = CDStore.messages();
    const unread = list.filter(m => m.status === 'new').length;
    const badge = $('#nav-msg-count');
    if (badge) { badge.textContent = fa(unread); badge.hidden = unread === 0; }

    view.innerHTML =
      '<div class="adm-topbar"><div><h1>پیام‌ها و درخواست‌ها</h1><p class="lead">پیام‌های ثبت‌شده از فرم‌های تماس و درخواست خدمات</p></div>'
      + '<div class="adm-actions"><button type="button" class="btn btn-ghost" id="msg-export">خروجی JSON</button></div></div>'
      + '<div class="adm-panel"><div class="adm-tabs" id="msg-tabs">'
      + '<button type="button" data-f="all" class="active">همه (' + fa(list.length) + ')</button>'
      + '<button type="button" data-f="new">جدید (' + fa(list.filter(m => m.status === 'new').length) + ')</button>'
      + '<button type="button" data-f="read">خوانده‌شده</button>'
      + '<button type="button" data-f="replied">پاسخ‌داده‌شده</button>'
      + '</div><div id="msg-list"></div></div>';

    const listBox = $('#msg-list');
    const draw = f => {
      const items = list.filter(m => f === 'all' || (m.status || 'new') === f);
      listBox.innerHTML = items.map(m =>
        '<div class="adm-check" data-id="' + esc(m.id) + '" style="flex-wrap:wrap">'
        + '<span class="status-pill ' + (m.status === 'new' ? 'st-new' : m.status === 'replied' ? 'st-pub' : 'st-draft') + '">' + (m.status === 'new' ? 'جدید' : m.status === 'replied' ? 'پاسخ داده شد' : 'خوانده‌شده') + '</span>'
        + '<div style="flex:1; min-width:240px"><b style="font-size:13.5px">' + esc(m.name || '—') + '</b> <span dir="ltr" style="font-size:11.5px; color:var(--faint)">' + esc(m.phone || '') + (m.email ? ' · ' + esc(m.email) : '') + '</span>'
        + '<br><span style="font-size:12px; color:var(--mut)">' + (m.kind === 'request' ? 'درخواست خدمات' : 'پیام تماس') + (m.package ? ' — پکیج: ' + esc(m.package) : '') + ' — کد ' + esc(m.ref) + ' — ' + faDate(m.date) + '</span>'
        + '<div class="adm-msg-body" style="margin-top:8px; border-top:1px solid var(--line); padding-top:8px">' + esc((m.subject ? 'موضوع: ' + m.subject + '\n' : '') + (m.message || '')) + '</div>'
        + '</div>'
        + '<div style="display:grid; gap:6px">'
        + '<button class="adm-btn" data-read="' + esc(m.id) + '">علامت‌گذاری خوانده‌شده</button>'
        + '<button class="adm-btn primary" data-reply="' + esc(m.id) + '">پاسخ داده شد</button>'
        + '<button class="adm-btn danger" data-del="' + esc(m.id) + '">حذف</button>'
        + '</div></div>').join('')
        || '<div class="adm-empty">پیامی در این وضعیت وجود ندارد. فرم‌های سایت، پیام‌ها را همین‌جا ثبت می‌کنند.</div>';
    };
    draw('all');

    $('#msg-tabs').addEventListener('click', e => {
      const b = e.target.closest('button[data-f]');
      if (!b) return;
      $$('#msg-tabs button').forEach(x => x.classList.toggle('active', x === b));
      draw(b.dataset.f);
    });
    listBox.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      const id = b.dataset.read || b.dataset.reply || b.dataset.del;
      if (b.dataset.read) { CDStore.updateMessage(id, { status: 'read' }); toast('خوانده‌شده شد'); }
      if (b.dataset.reply) { CDStore.updateMessage(id, { status: 'replied' }); toast('وضعیت: پاسخ داده شد'); }
      if (b.dataset.del && confirm('این پیام حذف شود؟')) { CDStore.deleteMessage(id); toast('حذف شد'); }
      if (b.dataset.read || b.dataset.reply || b.dataset.del) renderMessages();
    });
    $('#msg-export').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(CDStore.messages(), null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'cdanesh-messages.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  /* ═════════════ سئو ═════════════ */
  function renderSeo() {
    const robots = 'User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /admin-login.html\nDisallow: /request.html?*\n\nSitemap: https://cdanesh.ir/sitemap.xml';
    const pages = PAGE_LIST.map(p => 'https://cdanesh.ir/' + p.path.replace('.html', ''));
    view.innerHTML =
      '<div class="adm-topbar"><div><h1>سئو</h1><p class="lead">ابزارهای سئوی فنی سایت — از نقشه سایت تا داده‌های ساختاریافته</p></div></div>'
      + '<div class="adm-grid2">'
      + '<div class="adm-panel"><div class="adm-panel-head"><b>Robots.txt</b><span class="chip">فعال</span></div><pre style="direction:ltr; text-align:left; background:rgba(255,255,255,.04); border:1px solid var(--line); border-radius:12px; padding:16px; font-size:12px; overflow:auto; white-space:pre-wrap">' + esc(robots) + '</pre></div>'
      + '<div class="adm-panel"><div class="adm-panel-head"><b>نقشه سایت (Sitemap)</b><span class="chip">' + fa(pages.length + 4) + ' آدرس</span></div><div style="max-height:300px; overflow:auto"><ul style="display:grid; gap:6px; font-size:12px" dir="ltr">'
      + pages.concat(['https://cdanesh.ir/blog (دسته‌بندی‌ها با ?cat=)', 'https://cdanesh.ir/article (هر مقاله با ?slug=)', 'https://cdanesh.ir/portfolio', 'https://cdanesh.ir/404']).map(u => '<li dir="ltr" style="direction:ltr; text-align:left">' + esc(u) + '</li>').join('')
      + '</ul></div></div>'
      + '</div>'
      + '<div class="adm-panel" style="margin-top:18px"><div class="adm-panel-head"><b>وضعیت داده‌های ساختاریافته</b><span class="chip chip-gold">مطابق محتوای واقعی</span></div>'
      + '<div class="adm-check"><span class="adm-audit-ok">●</span><div><b>Organization + WebSite</b><span>در تمام صفحات</span></div></div>'
      + '<div class="adm-check"><span class="adm-audit-ok">●</span><div><b>FAQPage</b><span>صفحات خدمات و سؤالات متداول — مطابق همان سؤال‌های نمایش‌داده‌شده</span></div></div>'
      + '<div class="adm-check"><span class="adm-audit-ok">●</span><div><b>Article</b><span>صفحه مقاله — به‌صورت پویا</span></div></div>'
      + '<div class="adm-check"><span class="adm-audit-ok">●</span><div><b>BreadcrumbList</b><span>مسیر صفحات داخلی</span></div></div>'
      + '<p class="adm-hint">نمایش FAQ یا امتیازهای ویژه در نتایج گوگل تضمینی نیست؛ این داده‌ها فقط ساختار واقعی محتوا را برای موتور جست‌وجو روشن می‌کنند.</p></div>';
  }

  /* ═════════════ عملکرد و امنیت ═════════════ */
  const PERF_RESULTS = [
    ['تست ریسپانسیو ۱۵+ صفحه در عرض ۳۹۰ و ۷۶۸ پیکسل', 'بدون هیچ سرریز افقی', 'ok'],
    ['فرمت تصاویر', 'همه تصاویر رستری WebP؛ آیکون‌ها SVG', 'ok'],
    ['بارگذاری تصاویر', 'Lazy Loading برای تصاویر خارج از دید؛ تصویر اصلی با اولویت بالا', 'ok'],
    ['حجم تصاویر نمونه‌کار', 'میانگین زیر ۷۰ کیلوبایت برای هر اسکرین‌شات کامل صفحه', 'ok'],
    ['فونت', 'Vazirmatn محلی با font-display: swap و پنج وزن', 'ok'],
    ['اسکریپت‌ها', 'بدون کتابخانه سنگین؛ فقط JavaScript خالص', 'ok'],
  ];
  const SEC_CHECKS = [
    ['ssl', 'گواهی SSL و انتقال اجباری HTTPS', 'در نسخه اصلی روی هاست/پلتفرم استقرار فعال می‌شود.'],
    ['headers', 'هدرهای امنیتی (CSP، X-Frame-Options، …)', 'در نسخه اصلی در لایه سرور تنظیم می‌شود.'],
    ['login-rate', 'محدودیت تلاش ناموفق ورود', 'نسخه آزمایشی: قفل ساده سمت مرورگر؛ نسخه اصلی: سمت سرور.'],
    ['backup', 'پشتیبان‌گیری دوره‌ای داده‌ها', 'نسخه اصلی: پشتیبان‌گیری خودکار دیتابیس.'],
    ['sessions', 'انقضای نشست و مدیریت دسترسی‌ها', 'نسخه اصلی: نشست امن سرور + سطوح نقش.'],
    ['spam', 'محافظت ضد اسپم فرم‌ها', 'این نسخه: تله اسپم + محدودیت نرخ؛ نسخه اصلی: بررسی سمت سرور.'],
  ];

  function renderPerformance() {
    swapView();
    const flags = CDStore.flags();
    view.innerHTML =
      '<div class="adm-topbar"><div><h1>عملکرد و امنیت</h1><p class="lead">نتایج واقعی بررسی‌های انجام‌شده روی نسخه فعلی + چک‌لیست امنیتی</p></div></div>'
      + '<div class="adm-grid2">'
      + '<div class="adm-panel"><div class="adm-panel-head"><b>نتایج بررسی عملکرد (انجام‌شده با ابزار خودکار)</b></div>'
      + PERF_RESULTS.map(r => '<div class="adm-check"><span class="adm-audit-ok">●</span><div><b>' + r[0] + '</b><span>' + r[1] + '</span></div></div>').join('')
      + '<button type="button" class="btn btn-ghost btn-sm" id="run-audit" style="margin-top:16px">بررسی همین صفحه پنل</button><div id="audit-out" style="margin-top:12px; font-size:12.5px; color:var(--mut)"></div></div>'
      + '<div class="adm-panel"><div class="adm-panel-head"><b>چک‌لیست امنیت</b><span class="chip">وضعیت ذخیره می‌شود</span></div>'
      + SEC_CHECKS.map(c => '<div class="adm-check"><input type="checkbox" data-flag="' + c[0] + '"' + (flags[c[0]] ? ' checked' : '') + '><div><b>' + c[1] + '</b><span>' + c[2] + '</span></div></div>').join('')
      + '</div></div>';

    $('#run-audit').addEventListener('click', () => {
      const imgs = $$('img');
      const noAlt = imgs.filter(i => !i.getAttribute('alt'));
      const out = $('#audit-out');
      out.innerHTML = 'تصاویر این صفحه: ' + fa(imgs.length)
        + ' — بدون Alt: ' + (noAlt.length ? '<span class="adm-audit-bad">' + fa(noAlt.length) + '</span>' : '<span class="adm-audit-ok">۰</span>')
        + ' — تیتر H1: ' + fa($$('h1').length)
        + ' — لینک‌ها: ' + fa($$('a').length)
        + '<br>زمان بارگذاری پنل (DOM): ' + fa(Math.round(performance.now())) + ' میلی‌ثانیه';
    });
    view.addEventListener('change', e => {
      const c = e.target.closest('input[data-flag]');
      if (c) { CDStore.saveFlag(c.dataset.flag, c.checked); toast('چک‌لیست به‌روزرسانی شد'); }
    });
  }

  /* ═════════════ تنظیمات ═════════════ */
  function renderSettings() {
    const s = CDStore.settings();
    view.innerHTML =
      '<div class="adm-topbar"><div><h1>تنظیمات</h1><p class="lead">اطلاعات عمومی، امنیت حساب و مدیریت داده‌های نسخه آزمایشی</p></div></div>'
      + '<div class="adm-grid2">'
      + '<div class="adm-panel"><div class="adm-panel-head"><b>اطلاعات سایت</b></div><div class="adm-form-grid">'
      + '<div><label class="adm-label">ایمیل عمومی</label><input class="control" id="s-email" dir="ltr" value="' + esc(s.email || 'info@cdanesh.ir') + '"></div>'
      + '<div><label class="adm-label">تلفن نمایشی</label><input class="control" id="s-phone" dir="ltr" value="' + esc(s.phone || '') + '" placeholder="02100000000"></div>'
      + '</div><button type="button" class="btn btn-gold btn-sm" id="s-save" style="margin-top:16px">ذخیره</button></div>'
      + '<div class="adm-panel"><div class="adm-panel-head"><b>تغییر رمز مدیر</b></div>'
      + '<div class="adm-form-grid"><div><label class="adm-label">رمز فعلی</label><input class="control" id="p-old" type="password" dir="ltr"></div>'
      + '<div><label class="adm-label">رمز جدید (حداقل ۸ کاراکتر)</label><input class="control" id="p-new" type="password" dir="ltr"></div></div>'
      + '<button type="button" class="btn btn-ghost btn-sm" id="p-save" style="margin-top:16px">تغییر رمز</button></div>'
      + '</div>'
      + '<div class="adm-panel" style="margin-top:18px"><div class="adm-panel-head"><b>داده‌های نسخه آزمایشی</b><span class="chip chip-gold">در همین مرورگر</span></div>'
      + '<p class="adm-hint" style="margin-bottom:14px">مقالات ساخته‌شده در پنل، ویرایش‌ها، پیام‌ها و تنظیمات در حافظه مرورگر (localStorage) ذخیره می‌شوند. برای انتقال به دستگاه دیگر از خروجی استفاده کنید.</p>'
      + '<div class="adm-actions"><button type="button" class="btn btn-ghost btn-sm" id="d-export">خروجی همه داده‌ها</button>'
      + '<button type="button" class="btn btn-ghost btn-sm" id="d-import">ورود داده‌ها</button>'
      + '<button type="button" class="btn btn-ghost btn-sm" id="d-reset" style="border-color:rgba(229,118,106,.4); color:var(--err)">بازنشانی به حالت اولیه</button>'
      + '<input type="file" id="d-file" accept="application/json" hidden></div></div>';

    $('#s-save').addEventListener('click', () => {
      CDStore.saveSettings({ email: $('#s-email').value.trim(), phone: $('#s-phone').value.trim() });
      toast('تنظیمات ذخیره شد');
    });
    $('#p-save').addEventListener('click', () => {
      const old = $('#p-old').value, nw = $('#p-new').value;
      if (old !== (CDStore.settings().adminPass || 'cdanesh1404')) { alert('رمز فعلی درست نیست.'); return; }
      if (nw.length < 8) { alert('رمز جدید حداقل ۸ کاراکتر باشد.'); return; }
      CDStore.saveSettings({ adminPass: nw });
      $('#p-old').value = $('#p-new').value = '';
      toast('رمز مدیر تغییر کرد');
    });
    $('#d-export').addEventListener('click', () => {
      const data = {};
      ['articles', 'articles_new', 'faq', 'portfolio', 'messages', 'seo', 'settings', 'flags'].forEach(k => data[k] = CDStore.read(k, null));
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'cdanesh-panel-backup.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });
    $('#d-import').addEventListener('click', () => $('#d-file').click());
    $('#d-file').addEventListener('change', e => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const data = JSON.parse(r.result);
          Object.entries(data).forEach(([k, v]) => { if (v != null) CDStore.write(k, v); });
          toast('داده‌ها وارد شد');
        } catch (err) { alert('فایل معتبر نیست.'); }
      };
      r.readAsText(f);
    });
    $('#d-reset').addEventListener('click', () => {
      if (confirm('همه داده‌های آزمایشی (مقالات جدید، پیام‌ها، ویرایش‌ها) پاک و حالت اولیه بازگردانده شود؟')) {
        CDStore.resetAll();
        toast('بازنشانی انجام شد');
        location.hash = '#/dashboard';
        renderDashboard();
      }
    });
  }

  /* ═════════════ داشبورد ═════════════ */
  function renderDashboard() {
    const arts = allArticles();
    const pub = arts.filter(a => (a.status || 'published') === 'published').length;
    const drafts = arts.filter(a => a.status === 'draft').length;
    const sched = arts.filter(a => a.status === 'scheduled').length;
    const msgs = CDStore.messages();
    const newMsgs = msgs.filter(m => m.status === 'new').length;
    const kpi = (ico, lbl, val) =>
      '<div class="admin-card adm-kpi"><span class="ico">' + ico + '</span><div><small>' + lbl + '</small><b>' + fa(val) + '</b></div></div>';
    const icoDoc = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>';
    const icoMsg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20l1-4.9a8.4 8.4 0 1 1 17-3.6Z"/></svg>';
    const icoPf = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="3"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

    view.innerHTML =
      '<div class="adm-topbar"><div><h1>سلام مدیر کافه‌دانش</h1><p class="lead">خلاصه وضعیت محتوا، پیام‌ها و سایت</p></div>'
      + '<div class="adm-actions"><a class="btn btn-gold" href="#/articles/new">+ مقاله جدید</a><a class="btn btn-ghost" href="index.html" target="_blank">مشاهده سایت</a></div></div>'
      + '<div class="admin-stat">'
      + kpi(icoDoc, 'مقالات منتشرشده', pub)
      + kpi(icoDoc, 'پیش‌نویس و زمان‌بندی', drafts + sched)
      + kpi(icoMsg, 'پیام‌های جدید', newMsgs)
      + kpi(icoPf, 'نمونه‌کارهای فعال', CD_PORTFOLIO.length)
      + '</div>'
      + '<div class="adm-grid2">'
      + '<div class="admin-card" style="padding:0; overflow:hidden"><div style="padding:18px 20px; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; align-items:center"><b style="font-size:14.5px">آخرین پیام‌ها</b><a href="#/messages" class="link-more" style="font-size:12.5px">همه پیام‌ها</a></div>'
      + (msgs.length
        ? '<table class="admin-table"><thead><tr><th>نام</th><th>نوع</th><th>تاریخ</th><th>وضعیت</th></tr></thead><tbody>'
          + msgs.slice(0, 5).map(m => '<tr><td>' + esc(m.name || '—') + '</td><td>' + (m.kind === 'request' ? 'درخواست' : 'تماس') + '</td><td style="direction:ltr; text-align:right; font-size:12px">' + faDate(m.date) + '</td><td><span class="status-pill ' + (m.status === 'new' ? 'st-new' : 'st-draft') + '">' + (m.status === 'new' ? 'جدید' : 'پیگیری‌شده') + '</span></td></tr>').join('')
          + '</tbody></table>'
        : '<div class="adm-empty">هنوز پیامی ثبت نشده است. یک تست از فرم تماس بفرستید تا اینجا ببینید.</div>')
      + '</div>'
      + '<div class="admin-card" style="padding:0; overflow:hidden"><div style="padding:18px 20px; border-bottom:1px solid var(--line)"><b style="font-size:14.5px">وضعیت مقالات</b></div><div style="padding:20px">'
      + [['منتشرشده', pub, 'var(--ok)'], ['پیش‌نویس', drafts, 'var(--gold)'], ['زمان‌بندی‌شده', sched, '#7f7fe0']].map(([l, n, c]) =>
        '<div style="margin-bottom:16px"><div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:7px"><span class="muted">' + l + '</span><b>' + fa(n) + '</b></div><div class="adm-meter"><i style="width:' + (arts.length ? Math.round(n / arts.length * 100) : 0) + '%; background:' + c + '"></i></div></div>').join('')
      + '<a class="btn btn-ghost btn-sm btn-block" href="#/articles" style="margin-top:6px">مدیریت مقالات</a></div></div>'
      + '</div>'
      + '<div class="adm-panel" style="margin-top:18px"><div class="adm-panel-head"><b>راهنمای سریع پنل</b></div>'
      + '<p class="adm-hint">این پنل، همان ساختاری است که در نسخه اصلی Next.js با دیتابیس و احراز هویت سمت سرور پیاده‌سازی می‌شود: تولید و انتشار مقاله، مدیریت صفحات، نمونه‌کارها، سؤالات متداول، پیام‌ها، سئو و امنیت. تغییرات این نسخه در همین مرورگر ذخیره و بلافاصله روی سایت اعمال می‌شود.</p></div>';
  }

  /* ═════════════ مسیریابی ═════════════ */
  function route() {
    const h = (location.hash || '#/dashboard').replace(/^#\//, '');
    const [mod, ...rest] = h.split('/');
    $$('.admin-side nav a').forEach(a => a.classList.toggle('active', a.dataset.nav === (mod || 'dashboard')));

    if (mod === 'articles' && rest[0] === 'new') return renderArticleEditor(null);
    if (mod === 'articles' && rest[0] === 'edit') return renderArticleEditor(decodeURIComponent(rest[1] || ''));
    switch (mod) {
      case 'articles': return renderArticles();
      case 'pages': return renderPages();
      case 'portfolio': return renderPortfolio();
      case 'faq': return renderFaq();
      case 'messages': return renderMessages();
      case 'seo': return renderSeo();
      case 'performance': return renderPerformance();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  }

  $('#adm-logout').addEventListener('click', () => {
    CDStore.logout();
    location.replace('admin-login.html');
  });

  window.addEventListener('hashchange', () => { route(); window.scrollTo({ top: 0 }); });
  route();
})();
