/* ═══════════════════════════════════════════════════════════
   کافه دانش — تعاملات سایت (بدون وابستگی خارجی)
   پری‌لودر، هدر چسبان، بازگشت به بالا، منوی موبایل، نمایان‌سازی،
   شمارنده، آکاردئون، اسلایدر، فیلتر نمونه‌کار و فرم‌ها
   ═══════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toFa = (s: string) => s.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

  /* ---------- پری‌لودر ---------- */
  const preloader = document.getElementById('preloader');
  if (preloader) {
    const hide = () => preloader.classList.add('is-done');
    window.addEventListener('load', () => setTimeout(hide, 250));
    setTimeout(hide, 2200); // محدودیت اطمینان
  }

  /* ---------- هدر چسبان ---------- */
  const header = document.querySelector('[data-sticky]');
  let lastSticky = false;
  const onScrollHeader = () => {
    const sticky = window.scrollY > 60;
    if (sticky !== lastSticky && header) {
      header.classList.toggle('is-sticky', sticky);
      lastSticky = sticky;
    }
  };

  /* ---------- دکمه بازگشت به بالا (با حلقه پیشرفت) ---------- */
  const backTop = document.getElementById('backTop');
  const progressRing = backTop?.querySelector('[data-progress]') as SVGCircleElement | null;
  const RING = 151;
  const onScrollTop = () => {
    if (!backTop) return;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? y / max : 0;
    backTop.classList.toggle('is-visible', y > 420);
    if (progressRing) {
      progressRing.style.strokeDashoffset = String(RING * (1 - p));
    }
  };

  if (backTop) {
    backTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  }

  let scrollTicking = false;
  const onScroll = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      onScrollHeader();
      onScrollTop();
      scrollTicking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- اسکرول نرم برای لینک‌های لنگر ---------- */
  function smoothScrollTo(hash: string) {
    const target = document.querySelector(hash);
    if (!target) return;
    const headerH = header?.classList.contains('is-sticky') ? 78 : 110;
    const top = target.getBoundingClientRect().top + window.scrollY - headerH;
    window.scrollTo({ top: Math.max(top, 0), behavior: prefersReduced ? 'auto' : 'smooth' });
  }

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const hash = a.getAttribute('href');
      if (hash && hash.length > 1 && document.querySelector(hash)) {
        e.preventDefault();
        smoothScrollTo(hash);
      }
    });
  });

  /* ---------- منوی موبایل ---------- */
  const sidebar = document.getElementById('mobileMenu');
  const openBtns = document.querySelectorAll('[data-menu-open]');
  const closeEls = sidebar?.querySelectorAll('[data-menu-close]') ?? [];

  const setMenu = (open: boolean) => {
    if (!sidebar) return;
    if (open) (sidebar as HTMLElement).hidden = false;
    requestAnimationFrame(() => {
      sidebar.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    openBtns.forEach((b) => b.setAttribute('aria-expanded', String(open)));
    if (!open) {
      window.setTimeout(() => {
        if (!sidebar.classList.contains('is-open')) (sidebar as HTMLElement).hidden = true;
      }, 420);
    }
  };

  openBtns.forEach((btn) => btn.addEventListener('click', () => setMenu(true)));
  closeEls.forEach((el) => el.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
  });

  // زیرمنوهای سایدبار
  sidebar?.querySelectorAll('[data-sub-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const sub = btn.nextElementSibling as HTMLElement | null;
      btn.setAttribute('aria-expanded', String(!expanded));
      if (sub) sub.style.maxHeight = !expanded ? `${sub.scrollHeight}px` : '0px';
    });
  });

  // بستن منو پس از کلیک روی لینک‌ها
  sidebar?.querySelectorAll('[data-menu-nav]').forEach((a) => {
    a.addEventListener('click', () => setMenu(false));
  });

  /* ---------- نمایان‌سازی هنگام اسکرول ---------- */
  const revealEls = document.querySelectorAll<HTMLElement>('[data-reveal], .reveal');
  if ('IntersectionObserver' in window && !prefersReduced) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const delay = el.getAttribute('data-delay');
          if (delay) el.style.transitionDelay = `${delay}ms`;
          el.classList.add('is-revealed', 'revealed', 'in-view');
          io.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-revealed', 'revealed', 'in-view'));
  }

  /* ---------- شمارنده آمار ---------- */
  const counters = document.querySelectorAll<HTMLElement>('[data-counter], [data-count]');

  const animateCounter = (el: HTMLElement) => {
    const attr = el.getAttribute('data-counter') ?? el.getAttribute('data-count') ?? '0';
    const target = parseFloat(attr);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1600;
    const start = performance.now();
    const fmt = (v: number) => toFa(Math.round(v).toLocaleString('en-US')) + suffix;
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(target * eased);
      if (t < 1) requestAnimationFrame(step);
    };
    if (prefersReduced) {
      el.textContent = fmt(target);
    } else {
      requestAnimationFrame(step);
    }
  };

  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target as HTMLElement);
          cio.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach(animateCounter);
  }

  /* ---------- آکاردئون سوالات متداول ---------- */
  document.querySelectorAll<HTMLElement>('[data-accordion-item]').forEach((item) => {
    const btn = item.querySelector<HTMLButtonElement>('[data-accordion-btn]');
    const panel = item.querySelector<HTMLElement>('[data-accordion-panel]');
    if (!btn || !panel) return;

    const setOpen = (open: boolean) => {
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      panel.setAttribute('aria-hidden', String(!open));
      panel.style.maxHeight = open ? `${panel.scrollHeight}px` : '0px';
    };

    setOpen(item.classList.contains('is-open'));

    btn.addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      // فقط یک پنل باز بماند
      item.parentElement?.querySelectorAll('[data-accordion-item]').forEach((other) => {
        if (other !== item && other.classList.contains('is-open')) {
          const ob = other.querySelector('[data-accordion-btn]');
          const op = other.querySelector('[data-accordion-panel]') as HTMLElement | null;
          other.classList.remove('is-open');
          ob?.setAttribute('aria-expanded', 'false');
          op?.setAttribute('aria-hidden', 'true');
          if (op) op.style.maxHeight = '0px';
        }
      });
      setOpen(willOpen);
    });
  });

  // بازمحاسبه ارتفاع پنل باز پس از بارگذاری فونت‌ها
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      document
        .querySelectorAll<HTMLElement>('[data-accordion-item].is-open [data-accordion-panel]')
        .forEach((panel) => {
          panel.style.maxHeight = `${panel.scrollHeight}px`;
        });
    });
  }

  /* ---------- اسلایدر عمومی (نمونه‌کار / نظرات) — راست‌به‌چپ ---------- */
  document.querySelectorAll<HTMLElement>('[data-slider-viewport]').forEach((viewport) => {
    const track = viewport.querySelector<HTMLElement>('[data-slider-track]');
    const slides = track ? (Array.from(track.children) as HTMLElement[]) : [];
    const scope = viewport.closest<HTMLElement>('[data-slider]') || viewport.parentElement || document;
    const dotsWrap = scope.querySelector<HTMLElement>('[data-slider-dots]');
    const prevBtn = scope.querySelector<HTMLButtonElement>('[data-slider-prev]');
    const nextBtn = scope.querySelector<HTMLButtonElement>('[data-slider-next]');
    if (!track || slides.length === 0) return;

    let index = 0;
    let perView = 1;
    let autoTimer: number | null = null;

    const getPerView = () => {
      const w = window.innerWidth;
      if (w <= 640) return 1;
      if (w <= 1023) return 2;
      return 3;
    };

    const maxIndex = () => Math.max(0, slides.length - perView);

    const buildDots = () => {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      for (let i = 0; i <= maxIndex(); i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `نمایش اسلاید ${toFa(String(i + 1))}`);
        dot.addEventListener('click', () => {
          index = i;
          update();
          restartAuto();
        });
        dotsWrap.appendChild(dot);
      }
    };

    const update = () => {
      perView = getPerView();
      index = Math.min(index, maxIndex());
      const gap = parseFloat(getComputedStyle(track).gap || '0') || 0;
      const slideW = slides[0].getBoundingClientRect().width + gap;
      const offset = index * slideW; // چیدمان راست‌به‌چپ → جابه‌جایی مثبت
      track.style.transform = `translate3d(${offset}px, 0, 0)`;
      if (dotsWrap) {
        dotsWrap.querySelectorAll('button').forEach((d, i) => {
          d.classList.toggle('is-active', i === index);
        });
      }
    };

    const go = (dir: number) => {
      index = dir > 0 ? (index >= maxIndex() ? 0 : index + 1) : index <= 0 ? maxIndex() : index - 1;
      update();
    };

    prevBtn?.addEventListener('click', () => {
      go(-1);
      restartAuto();
    });
    nextBtn?.addEventListener('click', () => {
      go(1);
      restartAuto();
    });

    let isInView = false;
    const startAuto = () => {
      if (prefersReduced || !isInView) return;
      autoTimer = window.setInterval(() => go(1), 5200);
    };
    const stopAuto = () => {
      if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
      }
    };
    const restartAuto = () => {
      stopAuto();
      startAuto();
    };

    // پخش خودکار فقط وقتی اسلایدر در دید است
    if ('IntersectionObserver' in window) {
      const vio = new IntersectionObserver(
        (entries) => {
          isInView = entries[0].isIntersecting;
          stopAuto();
          startAuto();
        },
        { threshold: 0.25 }
      );
      vio.observe(viewport);
    } else {
      isInView = true;
      startAuto();
    }

    // توقف روی هاور/فوکوس
    viewport.addEventListener('mouseenter', stopAuto);
    viewport.addEventListener('mouseleave', () => {
      stopAuto();
      startAuto();
    });
    viewport.addEventListener('focusin', stopAuto);
    viewport.addEventListener('focusout', startAuto);

    // سوایپ لمسی
    let startX = 0;
    let isDown = false;
    viewport.addEventListener(
      'touchstart',
      (e) => {
        startX = e.touches[0].clientX;
        isDown = true;
        stopAuto();
      },
      { passive: true }
    );
    viewport.addEventListener(
      'touchend',
      (e) => {
        if (!isDown) return;
        isDown = false;
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 44) go(dx > 0 ? -1 : 1); // در RTL کشیدن به چپ = بعدی
        restartAuto();
      },
      { passive: true }
    );

    window.addEventListener('resize', () => {
      buildDots();
      update();
    });

    buildDots();
    update();
    startAuto();
  });

  /* ---------- فیلتر نمونه‌کارها ---------- */
  const filterBtns = document.querySelectorAll<HTMLButtonElement>('.pf-filter button');
  const pfCards = document.querySelectorAll<HTMLElement>('[data-pf-item]');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active', 'is-active'));
      btn.classList.add('active', 'is-active');
      const f = btn.dataset.filter || 'all';
      pfCards.forEach((card) => {
        const show = f === 'all' || card.dataset.cat === f;
        card.style.display = show ? '' : 'none';
      });
    });
  });

  /* ---------- توست عمومی ---------- */
  const cdToast = (msg: string, kind: string = 'ok') => {
    let wrap = document.querySelector('.toast-wrap') as HTMLElement | null;
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    const t = document.createElement('div');
    t.className = `toast ${kind}`;
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transition = 'opacity .4s';
      setTimeout(() => t.remove(), 420);
    }, 4600);
  };

  /* پیام صادقانه برای نسخهٔ استاتیک — ثبت واقعی فقط در نسخهٔ سرور فعال است */
  const STATIC_MSG =
    'این نسخه، پیش‌نمایش استاتیک سایت است و ثبت درخواست در آن فعال نیست. برای ثبت درخواست واقعی به نسخهٔ اصلی در cdanesh.ir مراجعه کنید.';

  const showStatus = (box: HTMLElement | null, kind: 'ok' | 'err' | 'info', html: string) => {
    if (!box) return;
    box.className = `form-status form-status--${kind} is-visible`;
    box.innerHTML = html;
  };

  const statusIcon = {
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/></svg>',
    err: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5m0 3v.1"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.1"/></svg>',
  } as Record<string, string>;

  /* ---------- فرم‌های عمومی (تماس / مشاوره) ---------- */
  document.querySelectorAll<HTMLFormElement>('form[data-public-form]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      const msgBox = form.querySelector<HTMLElement>('[data-form-status]');
      const data = new FormData(form);
      const payload: Record<string, string> = {};
      data.forEach((v, k) => {
        payload[k] = String(v).trim();
      });

      /* اعتبارسنجی سمت کلاینت */
      const errs: string[] = [];
      if (!payload.name || payload.name.length < 2) errs.push('نام را کامل بنویسید');
      if (!payload.phone || !/^0\d{9,10}$/.test(payload.phone.replace(/[\s-]/g, '').replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))))
        errs.push('شماره موبایل معتبر وارد کنید (مثل ۰۹۱۲۳۴۵۶۷۸۹)');
      if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email)) errs.push('ایمیل معتبر نیست');
      if (!payload.message || payload.message.length < 10) errs.push('متن پیام حداقل ۱۰ کاراکتر باشد');

      if (errs.length) {
        showStatus(msgBox, 'err', `${statusIcon.err}<span><b>ارسال انجام نشد</b>${errs.join(' — ')}</span>`);
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.dataset.orig = btn.textContent || '';
        btn.textContent = 'در حال ارسال…';
      }
      try {
        const res = await fetch(form.dataset.action || '/api/contact', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const ctype = res.headers.get('content-type') || '';
        if (!ctype.includes('application/json')) {
          /* پاسخ غیر JSON = مسیر API در این محیط وجود ندارد (نسخه استاتیک) */
          showStatus(msgBox, 'info', `${statusIcon.info}<span>${STATIC_MSG}</span>`);
          return;
        }
        const j = (await res.json()) as { ok: boolean; message?: string };
        if (j.ok) {
          showStatus(msgBox, 'ok', `${statusIcon.ok}<span><b>ثبت شد</b>${j.message || 'پیام شما با موفقیت ثبت شد؛ به‌زودی تماس می‌گیریم.'}</span>`);
          form.reset();
          cdToast(j.message || 'پیام شما ثبت شد؛ به‌زودی تماس می‌گیریم.');
        } else {
          showStatus(msgBox, 'err', `${statusIcon.err}<span>${j.message || 'ارسال ناموفق بود؛ دوباره تلاش کنید.'}</span>`);
          cdToast(j.message || 'ارسال ناموفق بود', 'err');
        }
      } catch {
        showStatus(msgBox, 'info', `${statusIcon.info}<span>${STATIC_MSG}</span>`);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = btn.dataset.orig || 'ارسال';
        }
      }
    });
  });

  /* ---------- فرم کوتاه مشاوره ---------- */
  document.querySelectorAll<HTMLFormElement>('form[data-nl-form]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      const msgBox = form.querySelector<HTMLElement>('[data-form-status]');
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const phone = String(data.get('phone') || '')
        .trim()
        .replace(/[\s-]/g, '')
        .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
      const errs: string[] = [];
      if (name.length < 2) errs.push('نام را کامل بنویسید');
      if (!/^0\d{9,10}$/.test(phone)) errs.push('شماره موبایل معتبر وارد کنید (مثل ۰۹۱۲۳۴۵۶۷۸۹)');
      if (errs.length) {
        showStatus(msgBox, 'err', `${statusIcon.err}<span>${errs.join(' — ')}</span>`);
        return;
      }

      if (btn) {
        btn.disabled = true;
        btn.dataset.orig = btn.textContent || '';
        btn.textContent = 'در حال ارسال…';
      }
      try {
        const res = await fetch(form.dataset.action || '/api/consult', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name,
            phone,
            message: 'درخواست مشاورهٔ رایگان از فرم صفحهٔ اصلی سایت کافه دانش',
          }),
        });
        const ctype = res.headers.get('content-type') || '';
        if (!ctype.includes('application/json')) {
          showStatus(msgBox, 'info', `${statusIcon.info}<span>${STATIC_MSG}</span>`);
          return;
        }
        const j = (await res.json()) as { ok: boolean; message?: string };
        showStatus(
          msgBox,
          j.ok ? 'ok' : 'err',
          `${statusIcon[j.ok ? 'ok' : 'err']}<span>${j.message || (j.ok ? 'درخواست شما ثبت شد؛ به‌زودی تماس می‌گیریم.' : 'ارسال ناموفق بود؛ دوباره تلاش کنید.')}</span>`
        );
        cdToast(j.message || 'درخواست شما ثبت شد', j.ok ? 'ok' : 'err');
        if (j.ok) form.reset();
      } catch {
        showStatus(msgBox, 'info', `${statusIcon.info}<span>${STATIC_MSG}</span>`);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = btn.dataset.orig || 'بررسی کنید — مشاوره رایگان';
        }
      }
    });
  });
})();
