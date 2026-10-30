/* ═══ کافه‌دانش — اعتبارسنجی و ارسال فرم‌ها ═══
   • شماره موبایل ایران: ۱۱ رقم و شروع با ۰۹ (نمونه: 09123456789)
   • ارقام فارسی/عربی و فاصله و خط تیره به‌صورت کنترل‌شده نرمال‌سازی می‌شوند
   • پیام خطا فارسی و کنار فیلد؛ خطا داده‌های دیگر فرم را پاک نمی‌کند
   • پیام‌ها در پنل مدیریت (پیام‌ها) قابل مشاهده و پیگیری‌اند */
(function () {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const fa = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

  /* نرمال‌سازی: تبدیل ارقام فارسی/عربی به لاتین و حذف جداکننده‌ها */
  function normalizeDigits(v) {
    return String(v || '')
      .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/[\s\-()]/g, '');
  }

  /* اعتبارسنج مشترک شماره موبایل ایران */
  window.CDPhone = {
    normalize: normalizeDigits,
    isValid: v => /^09\d{9}$/.test(normalizeDigits(v)),
    format: v => {
      const d = normalizeDigits(v);
      return d.length === 11 ? d.slice(0, 4) + ' ' + d.slice(4, 7) + ' ' + d.slice(7) : d;
    },
  };

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const MIN_SEND_GAP = 20; // ثانیه — جلوگیری از ارسال چندباره ناخواسته

  function setError(input, msg) {
    const field = input.closest('.field') || input.parentElement;
    field.classList.add('invalid');
    input.classList.add('control-error');
    input.setAttribute('aria-invalid', 'true');
    const err = $('.field-err', field);
    if (err) { err.textContent = msg; err.style.display = 'block'; }
  }
  function clearError(input) {
    const field = input.closest('.field') || input.parentElement;
    field.classList.remove('invalid');
    input.classList.remove('control-error');
    input.removeAttribute('aria-invalid');
    const err = $('.field-err', field);
    if (err) { err.textContent = ''; err.style.display = ''; }
  }

  function validate(form) {
    let ok = true;
    let firstBad = null;
    $$('[required]', form).forEach(input => {
      const v = (input.value || '').trim();
      const isPhone = input.dataset.kind === 'phone' || input.type === 'tel';
      const isEmail = input.type === 'email';
      let msg = '';
      if (!v) msg = 'این فیلد الزامی است.';
      else if (isPhone && !window.CDPhone.isValid(v)) msg = 'شماره موبایل معتبر نیست؛ نمونه درست: 09123456789';
      else if (isEmail && !EMAIL_RE.test(v)) msg = 'ایمیل معتبر نیست؛ نمونه درست: name@example.com';
      else if (input.dataset.kind === 'phone-optional' && v && !window.CDPhone.isValid(v)) msg = 'شماره موبایل معتبر نیست؛ نمونه درست: 09123456789';
      if (msg) { setError(input, msg); ok = false; firstBad = firstBad || input; }
      else clearError(input);
    });
    // فیلد تله اسپم باید خالی بماند
    const honey = $('input[name="website"]', form);
    if (honey && honey.value) ok = false;
    if (firstBad) { firstBad.focus(); }
    return ok;
  }

  // ورودی تلفن: کیبورد عددی در موبایل + پاک‌سازی خطا هنگام تایپ
  $$('form input[type="tel"], form input[data-kind="phone"], form input[data-kind="phone-optional"]').forEach(inp => {
    inp.setAttribute('inputmode', 'numeric');
    inp.setAttribute('maxlength', '14');
    inp.addEventListener('input', () => clearError(inp));
  });
  $$('form [required]').forEach(inp => inp.addEventListener('input', () => clearError(inp)));

  /* فرم‌های درخواست/تماس: ثبت در پنل مدیریت */
  $$('form[data-cd-form]').forEach(form => {
    const kind = form.dataset.cdForm; // request | contact
    const okBox = $('.form-ok', form.closest('.form-card') || form.parentElement) || $('.form-ok', form);
    const errBox = $('.form-err-global', form);

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (form.dataset.sending === '1') return; // جلوگیری از ارسال چندباره

      if (!validate(form)) return;

      // محدودیت نرخ ارسال ساده سمت کاربر
      const last = parseInt(sessionStorage.getItem('cd_last_send') || '0', 10);
      if (Date.now() - last < MIN_SEND_GAP * 1000) {
        if (errBox) { errBox.style.display = 'flex'; errBox.textContent = 'پیام قبلی شما همین حالا ثبت شده است؛ لطفاً چند لحظه بعد دوباره تلاش کنید.'; }
        return;
      }

      const btn = $('button[type="submit"]', form);
      const btnTxt = btn ? btn.innerHTML : '';
      form.dataset.sending = '1';
      if (btn) { btn.disabled = true; btn.innerHTML = 'در حال ثبت…'; }
      if (errBox) errBox.style.display = 'none';

      // ساخت رکورد پیام
      const now = new Date();
      const ref = 'CD-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
      const msg = {
        id: 'm' + now.getTime(),
        ref,
        kind,
        name: ($('#' + (kind === 'request' ? 'rname' : 'cname'), form) || {}).value || '',
        phone: window.CDPhone.normalize(($('#' + (kind === 'request' ? 'rphone' : 'cphone'), form) || {}).value || ''),
        email: ($('#' + (kind === 'request' ? 'remail' : 'cmail'), form) || {}).value || '',
        service: ($('#rsvc', form) || {}).value || '',
        subject: ($('#' + (kind === 'request' ? 'rsubj' : 'csubj'), form) || {}).value || '',
        package: (($('#rpackage')) || {}).value || '',
        message: ($('#' + (kind === 'request' ? 'rmsg' : 'cmsg'), form) || {}).value || '',
        date: now.toISOString(),
        status: 'new',
      };
      const honey = $('input[name="website"]', form);

      /* ارسال ابری به api/messages (روی ورسل ذخیرهٔ واقعی و نمایش در پنل)؛
         اگر سرور/API نبود (لوکال یا گیت‌هاب پیجز) → ذخیرهٔ محلی همان مرورگر (دمو) */
      (async () => {
        let saved = false;
        let refOut = ref;
        let serverError = '';
        try {
          const r = await fetch('api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              kind: msg.kind, name: msg.name, phone: msg.phone, email: msg.email,
              service: msg.service, subject: msg.subject, package: msg.package,
              message: msg.message, website: honey ? honey.value : '',
            }),
          });
          const ct = r.headers.get('content-type') || '';
          if (ct.includes('application/json')) {
            const d = await r.json().catch(() => ({}));
            if (r.ok && d.ok) { saved = true; if (d.ref) refOut = d.ref; }
            // خطای اعتبارسنجی/اسپم → پیام روشن به کاربر؛ خطای سرور/نبود Blob → بی‌صدا به حالت دمو
            else if (r.status === 400 || r.status === 429) { serverError = d.message || 'ثبت پیام انجام نشد؛ دوباره تلاش کنید.'; }
          }
          // بدون JSON یعنی API وجود ندارد (دمو) — خطا نشان داده نمی‌شود
        } catch (err) { /* شبکه/API نیست → دمو */ }

        if (serverError) {
          if (errBox) { errBox.style.display = 'flex'; errBox.textContent = serverError + ' — یا با شماره ۰۹۱۶۵۸۰۶۲۰۷ تماس بگیرید.'; }
          if (btn) { btn.disabled = false; btn.innerHTML = btnTxt; }
          form.dataset.sending = '0';
          return;
        }

        if (!saved) window.CDStore.addMessage(msg); // حالت دمو
        sessionStorage.setItem('cd_last_send', String(Date.now()));

        if (btn) { btn.disabled = false; btn.innerHTML = btnTxt; }
        form.dataset.sending = '0';
        form.reset();
        const pk = $('#rpackage');
        if (pk) pk.value = '';
        if (okBox) {
          const span = okBox.querySelector('[data-ref]');
          if (span) span.textContent = refOut;
          okBox.classList.add('show');
          okBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      })();
    });
  });
})();
