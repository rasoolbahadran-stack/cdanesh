/* ═══════════════════════════════════════════════
   کافه‌دانش — اسکریپت عمومی سایت
   انیمیشن اسکرول، هدر شیشه‌ای، مگامنو، دراور، شمارنده، FAQ، فرم‌ها
   ═══════════════════════════════════════════════ */
(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- هدر: پس‌زمینه هنگام اسکرول + جمع‌شدن ---------- */
  const header = document.querySelector('.site-header');
  const toTop = document.querySelector('.to-top');
  function onScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 10);
    if (header) header.classList.toggle('shrink', y > 120);
    if (toTop) toTop.classList.toggle('show', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

  /* ---------- دراور موبایل ---------- */
  const mnav = document.querySelector('.mobile-nav');
  const burger = document.querySelector('.burger');
  const scrim = mnav?.querySelector('.mn-scrim');
  const closeBtn = mnav?.querySelector('.mn-close');
  function closeMnav() { mnav?.classList.remove('open'); document.body.style.overflow = ''; }
  burger?.addEventListener('click', () => { mnav?.classList.add('open'); document.body.style.overflow = 'hidden'; });
  scrim?.addEventListener('click', closeMnav);
  closeBtn?.addEventListener('click', closeMnav);
  mnav?.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMnav));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMnav(); });

  /* ---------- انیمیشن ورود بخش‌ها هنگام اسکرول ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('revealed'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          (en.target as HTMLElement).classList.add('revealed');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- شمارنده‌های آمار ---------- */
  const counters = document.querySelectorAll<HTMLElement>('[data-count]');
  if (counters.length && !reduced && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target as HTMLElement;
        const target = parseInt(el.dataset.count || '0', 10);
        const dur = 1400;
        const t0 = performance.now();
        const fa = (n: number) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = fa(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach((el) => cio.observe(el));
  }

  /* ---------- فیلتر نمونه‌کارها ---------- */
  const filterBtns = document.querySelectorAll<HTMLButtonElement>('.pf-filter button');
  const pfCards = document.querySelectorAll<HTMLElement>('.pf-filterable');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter || 'all';
      pfCards.forEach((card) => {
        const show = f === 'all' || card.dataset.cat === f;
        (card as HTMLElement).style.display = show ? '' : 'none';
      });
    });
  });

  /* ---------- پارالاکس کنترل‌شدهٔ المان‌های شناور ---------- */
  const parallaxEls = document.querySelectorAll<HTMLElement>('[data-parallax]');
  if (parallaxEls.length && !reduced) {
    let raf = 0;
    window.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        parallaxEls.forEach((el) => {
          const speed = parseFloat(el.dataset.parallax || '0.12');
          el.style.transform = `translateY(${(y * speed).toFixed(1)}px)`;
        });
        raf = 0;
      });
    }, { passive: true });
  }

  /* ---------- توست عمومی ---------- */
  (window as unknown as { cdToast: (msg: string, kind?: string) => void }).cdToast = (msg: string, kind = 'ok') => {
    let wrap = document.querySelector('.toast-wrap') as HTMLElement | null;
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    const t = document.createElement('div');
    t.className = `toast ${kind}`;
    t.innerHTML = `<i>${kind === 'err' ? '⚠️' : '✅'}</i><span></span>`;
    (t.querySelector('span') as HTMLElement).textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; setTimeout(() => t.remove(), 420); }, 4200);
  };

  /* ---------- فرم‌های عمومی (تماس / مشاوره) ---------- */
  document.querySelectorAll<HTMLFormElement>('form[data-public-form]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      const msgBox = form.querySelector<HTMLElement>('.form-msg');
      const data = new FormData(form);
      const payload: Record<string, string> = {};
      data.forEach((v, k) => { payload[k] = String(v).trim(); });

      /* اعتبارسنجی سمت کلاینت */
      const errs: string[] = [];
      if (!payload.name || payload.name.length < 2) errs.push('نام را کامل بنویسید');
      if (!payload.phone || !/^0\d{9,10}$/.test(payload.phone.replace(/\s|-/g, ''))) errs.push('شماره موبایل معتبر وارد کنید (مثل ۰۹۱۲۳۴۵۶۷۸۹)');
      if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email)) errs.push('ایمیل معتبر نیست');
      if (!payload.message || payload.message.length < 10) errs.push('متن پیام حداقل ۱۰ کاراکتر باشد');
      if (msgBox) { msgBox.className = 'form-msg form-error'; msgBox.textContent = errs.join(' — '); msgBox.style.display = errs.length ? 'block' : 'none'; }
      if (errs.length) return;

      if (btn) { btn.disabled = true; btn.dataset.orig = btn.textContent || ''; btn.textContent = 'در حال ارسال…'; }
      try {
        const res = await fetch(form.dataset.action || '/api/contact', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const j = await res.json();
        if (j.ok) {
          if (msgBox) { msgBox.className = 'form-msg form-success'; msgBox.textContent = j.message || 'پیام شما با موفقیت ثبت شد'; msgBox.style.display = 'block'; }
          form.reset();
          (window as unknown as { cdToast: (m: string) => void }).cdToast(j.message || 'پیام شما ثبت شد؛ به‌زودی تماس می‌گیریم.');
        } else {
          if (msgBox) { msgBox.className = 'form-msg form-error'; msgBox.textContent = j.message || 'ارسال ناموفق بود'; msgBox.style.display = 'block'; }
          (window as unknown as { cdToast: (m: string, k?: string) => void }).cdToast(j.message || 'ارسال ناموفق بود', 'err');
        }
      } catch {
        if (msgBox) { msgBox.className = 'form-msg form-error'; msgBox.textContent = 'خطای شبکه؛ دوباره تلاش کنید'; msgBox.style.display = 'block'; }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.orig || 'ارسال'; }
      }
    });
  });
})();
