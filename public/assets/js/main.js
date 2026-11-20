/* ═══ کافه‌دانش استاتیک — تعاملات (نسخه پیش‌نمایش) ═══ */
(function () {
  'use strict';

  // فعال‌سازی حالت JS برای انیمیشن‌ها (بدون JS محتوا همیشه دیده می‌شود)
  document.documentElement.classList.add('js');

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ─── اعداد فارسی ─── */
  const fa = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

  /* ─── حالت اسکرول هدر + مخفی‌شدن هنگام اسکرول پایین و بازگشت هنگام اسکرول بالا ─── */
  const pill = $('.nav-pill');
  const siteHeader = $('.site-header');
  const toTop = $('.to-top');
  let lastY = 0;
  function onScroll() {
    const y = window.scrollY;
    if (pill) pill.classList.toggle('scrolled', y > 24);
    if (toTop) toTop.classList.toggle('show', y > 700);
    // هدر شناور: اسکرول پایین → محو؛ اسکرول بالا → نمایان
    if (siteHeader && !document.body.classList.contains('drawer-open')) {
      const megaOpen = !!document.querySelector('.has-mega.open');
      if (!megaOpen) {
        if (y > lastY + 6 && y > 160) siteHeader.classList.add('header-hidden');
        else if (y < lastY - 6 || y < 160) siteHeader.classList.remove('header-hidden');
      }
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ─── مگامنوی خدمات: هاور با تأخیر + کلیک + کیبورد ─── */
  const megaLi = $('.has-mega');
  if (megaLi) {
    let hideTimer;
    const open = () => { clearTimeout(hideTimer); megaLi.classList.add('open'); megaLi.querySelector('a').setAttribute('aria-expanded', 'true'); };
    const close = () => { megaLi.classList.remove('open'); megaLi.querySelector('a').setAttribute('aria-expanded', 'false'); };

    megaLi.addEventListener('mouseenter', open);
    megaLi.addEventListener('mouseleave', () => { hideTimer = setTimeout(close, 160); });
    megaLi.querySelector('.mega').addEventListener('mouseenter', open);
    megaLi.querySelector('.mega').addEventListener('mouseleave', () => { hideTimer = setTimeout(close, 160); });

    const trigger = megaLi.querySelector('a');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.addEventListener('click', e => {
      if (window.matchMedia('(max-width: 1080px)').matches) return; // در موبایل فقط لینک
      e.preventDefault();
      megaLi.classList.contains('open') ? close() : open();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { close(); document.activeElement && document.activeElement.blur(); }
      if (e.key === 'Tab' && megaLi.classList.contains('open') && !megaLi.contains(document.activeElement)) close();
    });
    document.addEventListener('click', e => { if (!megaLi.contains(e.target)) close(); });
  }

  /* ─── منوی موبایل ─── */
  const burger = $('.menu-toggle');
  if (burger) {
    burger.addEventListener('click', () => {
      const openNow = document.body.classList.toggle('drawer-open');
      burger.setAttribute('aria-expanded', String(openNow));
    });
    const closeDrawer = () => { document.body.classList.remove('drawer-open'); burger.setAttribute('aria-expanded', 'false'); };
    $$('.drawer a, .drawer-veil, .drawer-close').forEach(el => el.addEventListener('click', closeDrawer));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  }

  /* ─── آکاردئون سؤالات متداول ─── */
  $$('.faq-item').forEach(item => {
    const q = $('.faq-q', item), a = $('.faq-a', item);
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // در هر لحظه یکی باز (اختیاری): بستن بقیه
      $$('.faq-item.open').forEach(o => { if (o !== item) { o.classList.remove('open'); $('.faq-a', o).style.maxHeight = '0px'; } });
      item.classList.toggle('open', !isOpen);
      a.style.maxHeight = isOpen ? '0px' : a.scrollHeight + 'px';
      q.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* ─── ظاهرشدن با اسکرول ─── */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .12 });
  $$('.reveal').forEach(el => io.observe(el));
  window.io = io; // برای رندرهای مجدد (مجله/نمونه‌کار) در دسترس باشد

  /* ─── شمارنده آمار ─── */
  const counterIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, target = +el.dataset.count, suffix = el.dataset.suffix || '';
      let cur = 0; const t0 = performance.now(), dur = 1400;
      (function tick(t) {
        const p = Math.min((t - t0) / dur, 1);
        cur = Math.round(target * (1 - Math.pow(1 - p, 3)));
        el.textContent = fa(cur) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
      counterIO.unobserve(el);
    });
  }, { threshold: .5 });
  $$('[data-count]').forEach(el => counterIO.observe(el));

  /* ─── قاب اسکرول‌شوی نمونه‌کار: درگ با ماوس ─── */
  $$('.pf-window').forEach(win => {
    let down = false, startY = 0, startTop = 0, moved = false;
    win.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      down = true; moved = false; startY = e.pageY; startTop = win.scrollTop;
      win.classList.add('dragging');
    });
    window.addEventListener('mousemove', e => {
      if (!down) return;
      const dy = e.pageY - startY;
      if (Math.abs(dy) > 3) moved = true;
      win.scrollTop = startTop - dy;
    });
    window.addEventListener('mouseup', () => { down = false; win.classList.remove('dragging'); });
    win.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
  });

  /* ─── بزرگ‌نمایی نمونه‌کار (لایت‌باکس) ─── */
  $$('.pf-zoom').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.pf-card');
      const lb = $('#pf-lightbox');
      if (!lb || !card) return;
      const img = $('.pf-window img', card);
      $('img', lb).src = img.src.replace('/640/', '/1280/').replace('w=640', 'w=1280');
      $('img', lb).alt = img.alt;
      $('.pf-lightbox-head b', lb).textContent = $('.pf-meta h3', card).textContent;
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });
  const lb = $('#pf-lightbox');
  if (lb) {
    const closeLb = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };
    lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.pf-lightbox-close')) closeLb(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
  }

  /* ─── وبلاگ: رندر و فیلترها به‌صورت داده‌محور در site.js انجام می‌شود ─── */

  /* ─── فرم‌ها: اعتبارسنجی و ثبت در assets/js/forms.js ─── */

  /* ─── فهرست مطالب مقاله: هایلایت ─── */
  const tocLinks = $$('.toc a[href^="#"]');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const headings = tocLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
    const tio = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          tocLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    headings.forEach(h => tio.observe(h));
  }

  /* ─── سال جاری در فوتر ─── */
  $$('.js-year').forEach(el => { el.textContent = fa(1405); });

  /* ─── هایلایت آیتم فعال منو بر اساس صفحه جاری (آدرس تمیز یا .html) ─── */
  const seg = (location.pathname || '/').replace(/\/+$/, '') || '/';
  const path = (seg === '/' ? 'index' : seg.slice(seg.lastIndexOf('/') + 1)).replace(/\.html$/, '');
  $$('.main-nav a, .drawer a').forEach(a => {
    const rawHref = a.getAttribute('href') || '';
    if (rawHref.includes('#')) return; /* لینک‌های لنگری (تعرفه‌ها/فرایند) فقط در صفحهٔ خودشان معنا دارند */
    let href = rawHref.split('?')[0].replace(/\/+$/, '');
    href = (href === '' || href === '/') ? 'index' : href.slice(href.lastIndexOf('/') + 1).replace(/\.html$/, '');
    if (href && href === path) {
      a.classList.add('active');
      /* فقط لینک‌های خدمت (mega-item) والد «خدمات» را روشن می‌کنند؛ لینک‌های ریل و لنگری نه */
      if (a.closest('.has-mega') && a.classList.contains('mega-item')) a.closest('.has-mega').querySelector('a').classList.add('active');
    }
  });

  /* ═══════════════════════════════════════════════════════════
     کارت نمونه‌کار تعاملی: اسکرول خودکار تصویر در Hover
     • مسیر حرکت = اختلاف ارتفاع تصویر و قاب (پویا برای هر تصویر)
     • مدت متناسب با فاصله (کلمپ ۳٫۵ تا ۹ ثانیه) — نه خیلی تند، نه خسته‌کننده
     • رسیدن به انتها = توقف؛ خروج ماوس = بازگشت نرم به ابتدا
     • بدون پرش در خروج سریع (انیمیشن از موقعیت فعلی ادامه می‌یابد)
     • دستگاه لمسی / کاهش حرکت / تصویر ناآماده = بدون انیمیشن خودکار
     ═══════════════════════════════════════════════════════════ */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  $$('.pf-frame').forEach(frame => {
    const scroller = $('.pf-scroll', frame);
    const img = scroller ? $('img', scroller) : null;
    if (!scroller || !img || !finePointer.matches || reduceMotion.matches) return;

    let raf = null, from = 0, to = 0, t0 = 0, dur = 1;

    const distance = () => Math.max(0, img.offsetHeight - frame.clientHeight);
    const current = () => {
      const tr = getComputedStyle(scroller).transform;
      if (!tr || tr === 'none') return 0;
      const m = new DOMMatrixReadOnly(tr);
      return Math.abs(m.m42);
    };
    const apply = y => { scroller.style.transform = 'translateY(' + (-y) + 'px)'; };

    const step = ts => {
      const p = Math.min((ts - t0) / dur, 1);
      apply(from + (to - from) * easeInOut(p));
      if (p < 1) { raf = requestAnimationFrame(step); } else { raf = null; } // توقف در انتهای مسیر
    };

    const animate = (target, d) => {
      if (raf) cancelAnimationFrame(raf); // جلوگیری از انیمیشن‌های انباشته
      from = current(); to = target;
      if (Math.abs(to - from) < 2) { apply(to); raf = null; return; }
      dur = d; t0 = performance.now();
      raf = requestAnimationFrame(step);
    };

    frame.addEventListener('mouseenter', () => {
      if (!img.complete || !img.naturalHeight) return; // تصویر هنوز آماده نیست
      const dist = distance();
      if (dist < 40) return;
      animate(dist, Math.min(9000, Math.max(3500, 2800 + dist * .85)));
    });

    frame.addEventListener('mouseleave', () => {
      if (!img.complete) { apply(0); return; }
      const back = current();
      if (back < 2) { apply(0); return; }
      animate(0, Math.min(1600, Math.max(450, back * .5))); // بازگشت متناسب با فاصله باقی‌مانده
    });

    // بازمحاسبه در تغییر اندازه؛ برش موقعیت به محدوده معتبر
    window.addEventListener('resize', () => {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      apply(Math.min(current(), distance()));
    });
  });

  /* ─── فیلتر دسته‌بندی نمونه‌کارها (واقعی) ─── */
  const pfFilterBtns = $$('.pf-filters button');
  const pfCards = $$('.pf-card2[data-cat]');
  const pfCount = $('.pf-count');
  if (pfFilterBtns.length && pfCards.length) {
    pfFilterBtns.forEach(btn => {
      btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
      btn.addEventListener('click', () => {
        pfFilterBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
        const cat = btn.dataset.filter;
        let visible = 0;
        pfCards.forEach(card => {
          const show = cat === 'all' || card.dataset.cat === cat;
          card.classList.toggle('is-hidden', !show);
          if (show) visible++;
        });
        if (pfCount) pfCount.textContent = fa(visible) + ' نمونه در این دسته‌بندی';
      });
    });
  }

  /* ─── تب پکیج‌های قیمت (دسته‌بندی‌های سه‌گانه) ─── */
  const priceTabs = $$('.pricing-tabs button');
  const pkgPanes = $$('.pkg-pane');
  priceTabs.forEach(btn => {
    btn.setAttribute('aria-selected', btn.classList.contains('active') ? 'true' : 'false');
    btn.addEventListener('click', () => {
      priceTabs.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active'); btn.setAttribute('aria-selected', 'true');
      const t = btn.dataset.tab;
      pkgPanes.forEach(p => p.classList.toggle('active', p.id === 'pane-' + t));
      if (history.replaceState) history.replaceState(null, '', '#pricing-' + t);
    });
  });
  (function () { // فعال‌سازی تب از هش (مثلاً #pricing-seo)
    const m = location.hash.match(/^#pricing-(\w+)$/);
    if (m) { const b = $('.pricing-tabs button[data-tab="' + m[1] + '"]'); if (b) b.click(); }
  })();

  /* ─── فرم درخواست: پیش‌فرض‌سازی پکیج انتخاب‌شده از ?pkg= ─── */
  (function () {
    const pkgKey = new URLSearchParams(location.search).get('pkg');
    if (!pkgKey) return;
    const map = {
      'starter':       ['web', 'پکیج استارتر طراحی سایت'],
      'pro':           ['web', 'پکیج حرفه‌ای طراحی سایت'],
      'shop':          ['shop', 'پکیج فروشگاهی طراحی سایت'],
      'custom':        ['web', 'پکیج اختصاصی طراحی سایت'],
      'design-basic':  ['web', 'پکیج استارتر طراحی سایت'],
      'design-pro':    ['web', 'پکیج حرفه‌ای طراحی سایت'],
      'design-custom': ['web', 'پکیج اختصاصی طراحی سایت'],
    };
    const item = map[pkgKey];
    if (!item) return;
    const svc = $('#rsvc');
    if (svc && $('option[value="' + item[0] + '"]', svc)) svc.value = item[0];
    /* پکیج به‌صورت نامرئی همراه فرم ثبت می‌شود؛ خدمت مرتبط هم خودکار انتخاب می‌شود */
    const pkgInput = $('#rpackage');
    if (pkgInput) pkgInput.value = item[1];
  })();
})();
