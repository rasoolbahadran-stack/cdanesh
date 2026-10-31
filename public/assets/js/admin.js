/* ═══ کافه‌دانش — پنل مدیریت (دو حالته: ابری واقعی + آزمایشی مرورگر) ═══
   • حالت ابری: مقالات در Vercel Blob ذخیره و بلافاصله برای همه بازدیدکنندگان منتشر می‌شوند (ورود با رمز ADMIN_PASSWORD در ورسل)
   • حالت دمو: بدون سرور، ذخیره در localStorage همان مرورگر */
(function () {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const fa = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ─── محافظت مسیر: بدون نشست → صفحه ورود ─── */
  if (!window.CDStore || !CDStore.session()) {
    location.replace('/admin-login');
    return;
  }
  // نشست ابری ۷ روزه است؛ منقضی → بازگشت به ورود
  const __sess = CDStore.session();
  if (__sess && __sess.mode === 'cloud' && Date.now() - (__sess.at || 0) > 6.5 * 24 * 60 * 60 * 1000) {
    CDStore.logout();
    location.replace('/admin-login');
    return;
  }

  let viewEl = $('#adm-view'); // let — هر نما عنصر تازه می‌سازد (باید قابل جایگزینی باشد)
  let view = viewEl;
  function swapView() {
    // هر نما را با یک عنصر تازه شروع کن تا شنونده‌های نمای قبلی کاملاً پاک شوند؛
    // viewEl هم باید به‌روز شود وگرنه بار دوم replaceChild روی عنصر جداشده خطا می‌دهد
    const fresh = viewEl.cloneNode(false);
    if (viewEl.parentNode) viewEl.parentNode.replaceChild(fresh, viewEl);
    viewEl = fresh;
    view = fresh;
  }
  const toast = msg => {
    let t = $('#adm-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'adm-toast';
      t.style.cssText = 'position:fixed; bottom:24px; inset-inline-start:50%; transform:translateX(50%); background:#0a0a0e; border:1px solid rgba(227,185,83,.5); color:var(--gold-2); padding:11px 22px; border-radius:999px; font-size:13.5px; z-index:300; box-shadow:0 20px 50px -20px rgba(0,0,0,.9); pointer-events:none';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._h);
    t._h = setTimeout(() => { t.style.opacity = '0'; }, 2600);
  };

  /* ─── لایه ابری مقالات: وضعیت، ذخیره، مهاجرت دمو → ابر ─── */
  const isCloud = () => !!(window.CDArticles && CDArticles.mode && CDArticles.mode() === 'cloud');

  function updateStorBadge() {
    const b = $('#stor-badge');
    if (!b) return;
    b.hidden = false;
    const cloud = isCloud();
    b.classList.toggle('on', cloud);
    b.innerHTML = cloud
      ? '<span class="dot" aria-hidden="true"></span><span>ذخیره‌سازی ابری (واقعی) — <b>مقالات، پیام‌ها، صفحات و رسانه</b> برای همه منتشر می‌شوند</span>'
      : '<span class="dot" aria-hidden="true"></span><span>حالت آزمایشی: مرورگر — برای انتشار واقعی، بنر راهنما را در داشبورد ببینید</span>';
  }

  function gregSortToday() {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }
  function jalaliToday() {
    try { return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'numeric', day: 'numeric' }).format(new Date()); }
    catch (e) { return fa(new Date().getFullYear()) + '/' + fa(new Date().getMonth() + 1) + '/' + fa(new Date().getDate()); }
  }

  async function cloudPut(nextList, okMsg) {
    const r = await CDArticles.cloudSave(nextList);
    if (r.ok) { toast(okMsg); return true; }
    if (r.error === 'UNAUTH') { CDStore.logout(); location.replace('/admin-login'); return false; }
    alert(r.error === 'HTTP_504'
      ? 'ذخیره ابری انجام نشد: سرور دیر پاسخ داد (تایم‌اوت). چند لحظه بعد دوباره تلاش کنید؛ اگر تکرار شد، صفحه را تازه‌سازی (F5) کنید.'
      : 'ذخیره ابری انجام نشد: ' + (r.message || r.error));
    return false;
  }

  // اعمال یک تغییر روی فهرست ابری و ذخیره کامل (orig: مقاله مبنا برای یافتن با اسلاگ قدیمی)
  function cloudUpsert(rec, orig, okMsg) {
    const cur = CDArticles.all().slice();
    const i = cur.findIndex(x => ((orig && orig.id && x.id === orig.id) || (orig && orig.slug && x.slug === orig.slug)));
    let next;
    if (i > -1) { next = cur.slice(); next[i] = Object.assign({}, cur[i], rec); }
    else if (orig) { next = [Object.assign({}, orig, rec)].concat(cur); }
    else { next = [rec].concat(cur); }
    return cloudPut(next, okMsg);
  }
  function cloudDelete(rec, okMsg) {
    const next = CDArticles.all().filter(x => !((rec.id && x.id === rec.id) || x.slug === rec.slug));
    return cloudPut(next, okMsg);
  }

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

  /* ═════════════ پاک‌ساز HTML — فهرست سفید تگ‌ها (هماهنگ با نسخهٔ SSR) ═════════════
     محتوای مقاله/صفحه فقط توسط مدیر نوشته می‌شود؛ اما برای دفاع در عمق، خروجی
     ویرایشگر پیش از ذخیره با همین فهرست سفید پاک‌سازی می‌شود. */
  const ALLOWED_TAGS = { a: 1, b: 1, strong: 1, i: 1, em: 1, u: 1, br: 1, code: 1, mark: 1, small: 1, sub: 1, sup: 1, span: 1, p: 1, h2: 1, h3: 1, h4: 1, ul: 1, ol: 1, li: 1, blockquote: 1, img: 1, table: 1, thead: 1, tbody: 1, tr: 1, th: 1, td: 1, figure: 1, figcaption: 1, hr: 1, div: 1, pre: 1, iframe: 1 };

  function sanitizeAttrs(tag, attrs) {
    const out = [];
    const re = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let m;
    while ((m = re.exec(attrs || ''))) {
      const name = m[1].toLowerCase();
      const val = m[2] != null ? m[2] : m[3];
      if (/^on/i.test(name)) continue;
      if (tag === 'a' && name === 'href') {
        if (/^(https?:|\/|#|tel:|mailto:)/i.test(val.trim())) out.push('href="' + val.replace(/"/g, '&quot;') + '"');
        continue;
      }
      if (tag === 'a' && name === 'title') { out.push('title="' + val.replace(/"/g, '&quot;') + '"'); continue; }
      if (tag === 'img' && ['src', 'alt', 'width', 'height', 'loading'].includes(name)) {
        if (name === 'src' && !/^(https?:|\/|data:image\/)/i.test(val.trim())) continue;
        out.push(name + '="' + val.replace(/"/g, '&quot;') + '"');
        continue;
      }
      if (tag === 'iframe' && ['src', 'width', 'height', 'allow', 'allowfullscreen', 'loading', 'title'].includes(name)) {
        if (name === 'src' && !/^https:\/\//i.test(val.trim())) continue;
        out.push(name === 'allowfullscreen' ? 'allowfullscreen' : name + '="' + val.replace(/"/g, '&quot;') + '"');
        continue;
      }
      if (tag === 'td' && name === 'colspan') { out.push('colspan="' + val.replace(/[^\d]/g, '') + '"'); continue; }
      if (name === 'dir' && (val === 'rtl' || val === 'ltr')) { out.push('dir="' + val + '"'); continue; }
      if (name === 'class' && /^(prose-cta|check-list|table-wrap)$/.test(val)) { out.push('class="' + val + '"'); continue; }
    }
    return out.length ? ' ' + out.join(' ') : '';
  }

  function sanitizeHtml(html, trusted) {
    /* حالت trusted: محتوای خود مدیر است و هیچ چیزی حذف نمی‌شود —
       پشتیبانی کامل از <style> و <script> و هر کد آزاد (مثل بلوک HTML گوتنبرگ) */
    if (trusted === true) return String(html == null ? '' : html);
    let h = String(html == null ? '' : html);
    h = h.replace(/<!--[\s\S]*?-->/g, '');
    h = h.replace(/<\s*(script|style|object|embed|form|input|button|select|textarea|link|meta|base)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
    h = h.replace(/<\s*(script|style|object|embed|form|input|button|select|textarea|link|meta|base)\b[^>]*\/?>/gi, '');
    h = h.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    h = h.replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
    h = h.replace(/<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:\s[^<>]*)?)\/?>/g, (m0, rawTag, rawAttrs) => {
      const tag = rawTag.toLowerCase();
      if (!ALLOWED_TAGS[tag]) return '';
      const closing = /^<\s*\//.test(m0);
      if (tag === 'br' || tag === 'hr' || tag === 'img') return closing ? '' : '<' + tag + sanitizeAttrs(tag, rawAttrs || '') + '>';
      return closing ? '</' + tag + '>' : '<' + tag + sanitizeAttrs(tag, rawAttrs || '') + '>';
    });
    return h;
  }

  /* ═════════════ ویرایشگر HTML حرفه‌ای — WYSIWYG + حالت کد ═════════════ */
  const ED_ICONS = {
    h2: '<b style="font-size:15px">H2</b>', h3: '<b style="font-size:13px">H3</b>', p: '<b style="font-size:12px">متن</b>',
    bold: '<b>B</b>', italic: '<i>I</i>', ul: '• فهرست', ol: '۱. فهرست', quote: '❝', link: '🔗', image: '🖼',
    table: 'جدول', hr: '—', htmlblock: '<b dir="ltr" style="font-size:11px">HTML</b>', html: '&lt;/&gt;',
  };
  const ED_HTML_HINT = '<p class="adm-hint" style="margin-top:10px">مستقیم بنویسید (مثل وردپرس). با دکمهٔ <b dir="ltr">HTML</b> کد آزاد پیست کنید و همان لحظه نتیجهٔ رندرشده را ببینید؛ با <b dir="ltr">&lt;/&gt;</b> هم به حالت کد بروید — کدهای <b dir="ltr">CSS (&lt;style&gt;)</b> و <b dir="ltr">JavaScript (&lt;script&gt;)</b> کامل حفظ می‌شوند.</p>';
  function edToolbarHtml() {
    const btn = (cmd, title) => '<button type="button" class="ed-btn" data-cmd="' + cmd + '" title="' + title + '" tabindex="-1">' + ED_ICONS[cmd] + '</button>';
    return '<div class="ed-toolbar" dir="rtl">'
      + btn('h2', 'تیتر اصلی (H2)') + btn('h3', 'زیرتیتر (H3)') + btn('p', 'پاراگراف معمولی')
      + '<span class="ed-sep"></span>'
      + btn('bold', 'ضخیم') + btn('italic', 'ایتالیک')
      + '<span class="ed-sep"></span>'
      + btn('ul', 'فهرست نقطه‌ای') + btn('ol', 'فهرست شماره‌دار') + btn('quote', 'نقل‌قول')
      + '<span class="ed-sep"></span>'
      + btn('link', 'لینک') + btn('image', 'تصویر از کتابخانه رسانه') + btn('table', 'جدول') + btn('hr', 'خط جداکننده')
      + '<span class="ed-sep"></span>'
      + btn('htmlblock', 'ابزار HTML — کد آزاد با پیش‌نمایش زنده')
      + btn('html', 'حالت کد — پشتیبانی کامل HTML/CSS/JS')
      + '</div>';
  }

  /* ═══ ابزار HTML — پیست کد آزاد + پیش‌نمایش زنده (iframe ایزوله) ═══
     کد عیناً داخل مقاله/صفحه ذخیره می‌شود؛ CSS و JavaScript هم پشتیبانی می‌شود. */
  function openHtmlWidget(insert) {
    let root = $('#cd-html-root');
    if (!root) { root = document.createElement('div'); root.id = 'cd-html-root'; document.body.appendChild(root); }
    const wrapDoc = code => '<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
      + '<style>body{font-family:Vazirmatn,Tahoma,sans-serif;background:#fff;color:#24243a;margin:0;padding:16px;line-height:2;font-size:15px}img{max-width:100%;height:auto}</style></head><body>'
      + String(code || '') + '</body></html>';
    root.innerHTML = '<div class="adm-modal-veil" data-close="1"></div>'
      + '<div class="adm-modal adm-modal-lg" role="dialog" aria-label="ابزار HTML" dir="rtl">'
      + '<div class="adm-modal-head"><b>ابزار HTML — کد آزاد با پیش‌نمایش زنده</b><button type="button" class="adm-btn" data-close="1">بستن ✕</button></div>'
      + '<div class="adm-modal-body adm-modal-split2">'
      + '<div><label class="adm-label">کد HTML / CSS / JS خود را این‌جا پیست کنید</label>'
      + '<textarea class="control" id="hw-src" dir="ltr" spellcheck="false" style="min-height:340px; font-size:12.5px; line-height:1.9; font-family:monospace; text-align:left"></textarea></div>'
      + '<div><label class="adm-label">نتیجهٔ رندرشده (همان لحظه به‌روز می‌شود)</label>'
      + '<iframe id="hw-view" style="width:100%; height:340px; border:1px solid var(--line); border-radius:12px; background:#fff" sandbox="allow-scripts" title="پیش‌نمایش HTML"></iframe></div>'
      + '</div>'
      + '<div class="adm-modal-foot"><span class="adm-hint">کد شما عیناً داخل مقاله/صفحه ذخیره می‌شود — <b dir="ltr">&lt;style&gt;</b> و <b dir="ltr">&lt;script&gt;</b> هم حفظ می‌شود.</span>'
      + '<span style="flex:1"></span>'
      + '<button type="button" class="adm-btn" id="hw-clear">پاک کردن کد</button>'
      + '<button type="button" class="btn btn-gold btn-sm" id="hw-insert">درج در متن</button></div></div>';
    root.style.display = 'block';
    document.body.classList.add('adm-modal-open');
    const srcEl = $('#hw-src', root);
    const view = $('#hw-view', root);
    let t = null;
    const render = () => { view.srcdoc = wrapDoc(srcEl.value); };
    srcEl.addEventListener('input', () => { clearTimeout(t); t = setTimeout(render, 300); });
    $('#hw-clear', root).addEventListener('click', () => { srcEl.value = ''; render(); srcEl.focus(); });
    const close = () => { root.style.display = 'none'; document.body.classList.remove('adm-modal-open'); };
    root.addEventListener('click', e => {
      if (e.target.closest('[data-close]')) { close(); return; }
      if (e.target.closest('#hw-insert')) {
        const code = srcEl.value.trim();
        if (!code) { toast('اول کد HTML را در کادر سمت راست وارد کنید.'); return; }
        close();
        insert(code);
      }
    });
    render();
  }

  /* ویرایشگر: WYSIWYG پیش‌فرض + toggle کد HTML؛ خروجی getHtml() همیشه HTML کامل بدنه است */
  function makeEditor(host, initialHtml) {
    host.innerHTML = edToolbarHtml()
      + '<div class="ed-canvas prose" contenteditable="true" dir="rtl" spellcheck="false"></div>'
      + '<textarea class="control ed-src" dir="ltr" style="display:none; min-height:380px; font-size:13px; line-height:1.9; font-family:monospace"></textarea>'
      + ED_HTML_HINT;
    const canvas = $('.ed-canvas', host);
    const src = $('.ed-src', host);
    let mode = 'wysiwyg';
    /* محتوای پنل، خودِ مدیر است → بارگذاری و بازگشت از حالت کد «trusted» انجام می‌شود؛
       به این ترتیب بلوک‌های HTML آزاد (شامل style/script) موقع ویرایش مجدد هم
       بدون حذف می‌مانند (رفع از دست رفتن کدها در ذخیرهٔ دوباره). */
    canvas.innerHTML = String(initialHtml || '') || '<p><br></p>';

    const syncToSrc = () => { src.value = canvas.innerHTML.replace(/<\/(p|h2|h3|ul|ol|li|blockquote|div|table|tr|figure)>/g, '$&\n'); };
    const syncFromSrc = () => { canvas.innerHTML = String(src.value || '') || '<p><br></p>'; };

    function exec(cmd) {
      if (cmd === 'html') {
        if (mode === 'wysiwyg') {
          syncToSrc(); canvas.style.display = 'none'; src.style.display = 'block'; mode = 'html';
        } else {
          /* بازگشت به ویژوال، دیگر چیزی را حذف نمی‌کند — کدها همین‌طور حفظ می‌شوند */
          syncFromSrc(); src.style.display = 'none'; canvas.style.display = 'block'; mode = 'wysiwyg';
        }
        $$('.ed-btn', host).forEach(b => { if (b.dataset.cmd === 'html') b.classList.toggle('active', mode === 'html'); });
        host.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
      if (mode === 'html') { syncFromSrc(); src.style.display = 'none'; canvas.style.display = 'block'; mode = 'wysiwyg'; $$('.ed-btn', host).forEach(b => { if (b.dataset.cmd === 'html') b.classList.remove('active'); }); }
      canvas.focus();
      if (cmd === 'h2' || cmd === 'h3' || cmd === 'p') {
        document.execCommand('formatBlock', false, cmd === 'p' ? 'p' : cmd);
        return;
      }
      if (cmd === 'bold' || cmd === 'italic') { document.execCommand(cmd); return; }
      if (cmd === 'ul' || cmd === 'ol') { document.execCommand(cmd === 'ul' ? 'insertUnorderedList' : 'insertOrderedList'); return; }
      if (cmd === 'quote') { document.execCommand('formatBlock', false, 'blockquote'); return; }
      if (cmd === 'hr') { document.execCommand('insertHorizontalRule'); return; }
      if (cmd === 'link') {
        const sel = window.getSelection();
        const has = sel && !sel.isCollapsed;
        const url = prompt('آدرس لینک (مثلاً /web-design یا https://…):', '');
        if (url) {
          if (has) document.execCommand('createLink', false, url);
          else document.execCommand('insertHTML', false, '<a href="' + esc(url) + '">' + esc(url.replace(/^https?:\/\//, '')) + '</a>&nbsp;');
        }
        return;
      }
      if (cmd === 'image') {
        openMedia({ filter: 'image', pick: 'درج در متن' }, (url, alt) => {
          canvas.focus();
          document.execCommand('insertHTML', false, '<figure class="prose-fig"><img src="' + esc(url) + '" alt="' + esc(alt || '') + '" loading="lazy"></figure><p><br></p>');
        });
        return;
      }
      if (cmd === 'table') {
        document.execCommand('insertHTML', false,
          '<div class="table-wrap"><table><thead><tr><th>ستون ۱</th><th>ستون ۲</th><th>ستون ۳</th></tr></thead>'
          + '<tbody><tr><td>—</td><td>—</td><td>—</td></tr><tr><td>—</td><td>—</td><td>—</td></tr></tbody></table></div><p><br></p>');
        return;
      }
      if (cmd === 'htmlblock') {
        openHtmlWidget(code => {
          canvas.focus();
          try {
            /* درج در انتهای محتوا — پیش‌بینی‌پذیر و همیشه خارج از ساختار قبلی */
            const range = document.createRange();
            range.selectNodeContents(canvas);
            range.collapse(false);
            const frag = range.createContextualFragment(String(code || ''));
            range.insertNode(frag);
          } catch (e) {
            document.execCommand('insertHTML', false, esc(code));
          }
          host.dispatchEvent(new Event('input', { bubbles: true }));
        });
        return;
      }
    }
    host.addEventListener('click', e => {
      const b = e.target.closest('.ed-btn');
      if (b) { e.preventDefault(); exec(b.dataset.cmd); }
    });
    // چسباندن از Word/صفحات دیگر → فقط HTML پاک‌سازی‌شده
    canvas.addEventListener('paste', e => {
      e.preventDefault();
      const html = (e.clipboardData || window.clipboardData).getData('text/html');
      if (html) document.execCommand('insertHTML', false, sanitizeHtml(html));
      else document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text/plain'));
    });
    return {
      /* حالت کد → همان متن خام (با style/script)؛ حالت ویژوال → HTML واقعی بدنه
         (بلوک‌های HTML آزاد هم در همان‌جا حفظ می‌شوند) */
      getHtml() { return mode === 'html' ? String(src.value || '') : canvas.innerHTML; },
      setHtml(h) {
        if (mode === 'html') src.value = h;
        else canvas.innerHTML = String(h || '') || '<p><br></p>';
        host.dispatchEvent(new Event('input', { bubbles: true }));
      },
      focus() { (mode === 'html' ? src : canvas).focus(); },
    };
  }

  /* ─── تبدیل HTML ویرایشگر ↔ بلوک‌های ذخیره‌سازی ─── */
  /* متن درون‌خطی: پس از escape کامل، فقط تگ‌های امنِ فهرست سفید بازسازی می‌شوند
     (سازگار با نسخهٔ SSR در src/lib/ssr-articles.mjs و نسخهٔ کلاینت data/articles.js).
     ⚠ رفع باگ: این تابع قبلاً در blocksToHtml استفاده می‌شد اما تعریفش جا افتاده بود؛
     نتیجه: ویرایش هر مقاله/صفحه‌ای که فهرست، نقل‌قول یا جدول داشت، ویرایشگر را خراب می‌کرد. */
  function sanitizeAttrsInline(tag, attrs) {
    const out = [];
    const re = /([a-zA-Z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let m;
    while ((m = re.exec(attrs || ''))) {
      const name = m[1].toLowerCase();
      const val = m[2] != null ? m[2] : m[3];
      if (/^on/i.test(name)) continue;
      if (tag === 'a' && name === 'href') {
        if (/^(https?:|\/|#|tel:|mailto:)/i.test(val.trim())) out.push('href="' + val.replace(/"/g, '&quot;') + '"');
        continue;
      }
      if (tag === 'a' && name === 'title') { out.push('title="' + val.replace(/"/g, '&quot;') + '"'); continue; }
      if (name === 'dir' && (val === 'rtl' || val === 'ltr')) { out.push('dir="' + val + '"'); continue; }
    }
    return out.length ? ' ' + out.join(' ') : '';
  }
  function rich(s) {
    let h = esc(s);
    h = h.replace(/&lt;(\/?)((?:a|b|strong|i|em|u|br|code|mark|small|sub|sup|span)\b)((?:[^&]|&(?!gt;))*)&gt;/gi, (m0, c, t, at) =>
      '<' + c + t.toLowerCase() + sanitizeAttrsInline(t.toLowerCase(), at.replace(/&quot;/g, '"').replace(/&#39;/g, "'")) + '>');
    return h;
  }

  const CTA_DIV = (c) => '<div class="prose-cta" data-pre="' + esc(c.pre || '') + '" data-link="' + esc(c.link || '') + '" data-label="' + esc(c.label || '') + '" data-post="' + esc(c.post || '') + '"><p>' + esc(c.pre || '') + ' <a href="' + esc(c.link || '') + '">' + esc(c.label || '') + '</a>' + esc(c.post || '') + '</p></div>';

  function htmlToBlocks(html) {
    const clean = sanitizeHtml(html, true); // محتوای خود مدیر — کدها بدون حذف نگه داشته می‌شوند
    const root = new DOMParser().parseFromString('<div id="x">' + clean + '</div>', 'text/html').getElementById('x');
    const out = [];
    let h2n = 0, h3n = 0;
    const inline = el => sanitizeHtml(el.innerHTML);
    Array.from(root.childNodes).forEach(node => {
      if (node.nodeType === 3) { // متن خالی و متن ساده
        const t = (node.textContent || '').trim();
        if (t) out.push({ p: t });
        return;
      }
      if (node.nodeType !== 1) return;
      const tag = node.tagName.toLowerCase();
      if (tag === 'h2') { h2n++; h3n = 0; out.push({ h2: node.textContent.trim(), id: node.id || ('s' + h2n) }); return; }
      if (tag === 'h3') { h3n++; out.push({ h3: node.textContent.trim(), id: node.id || ('s' + h2n + 'x' + h3n) }); return; }
      if (tag === 'h4') { out.push({ h3: node.textContent.trim(), id: 'h4' + out.length }); return; }
      if (tag === 'p') {
        if (node.closest('.prose-cta')) return; // خودِ CTA پایین پردازش می‌شود
        const t = inline(node).trim();
        if (t && t !== '<br>') out.push({ p: t });
        return;
      }
      if (tag === 'ul') { out.push({ ul: Array.from(node.querySelectorAll(':scope > li')).map(li => inline(li)).filter(x => x.trim()) }); return; }
      if (tag === 'ol') { out.push({ ol: Array.from(node.querySelectorAll(':scope > li')).map(li => inline(li)).filter(x => x.trim()) }); return; }
      if (tag === 'blockquote') { out.push({ quote: inline(node) }); return; }
      if (tag === 'img') { out.push({ img: { src: node.getAttribute('src') || '', alt: node.getAttribute('alt') || '', cap: '' } }); return; }
      if (tag === 'figure') {
        const img = node.querySelector('img');
        if (img) out.push({ img: { src: img.getAttribute('src') || '', alt: img.getAttribute('alt') || '', cap: (node.querySelector('figcaption') || {}).textContent || '' } });
        return;
      }
      if (tag === 'table') {
        const head = Array.from(node.querySelectorAll('thead th')).map(th => th.textContent.trim());
        const rows = Array.from(node.querySelectorAll('tbody tr')).map(tr => Array.from(tr.querySelectorAll('td,th')).map(td => td.textContent.trim()));
        if (head.length || rows.length) out.push({ table: { head, rows } });
        return;
      }
      if (node.classList && node.classList.contains('prose-cta')) {
        out.push({ cta: { pre: node.dataset.pre || '', link: node.dataset.link || '', label: node.dataset.label || '', post: node.dataset.post || '' } });
        return;
      }
      const outer = node.outerHTML;
      if (outer && outer.replace(/<br\s*\/?>/g, '').trim()) out.push({ html: outer });
    });
    return out;
  }

  function blocksToHtml(blocks) {
    let h = '';
    (blocks || []).forEach(b => {
      if (b.p) { h += '<p>' + b.p + '</p>'; return; }           // p قبلاً در لحظهٔ ذخیره پاک‌سازی شده؛ برای بذرهای قدیمی:
      if (b.h2) { h += '<h2 id="' + esc(b.id || '') + '">' + esc(b.h2) + '</h2>'; return; }
      if (b.h3) { h += '<h3 id="' + esc(b.id || '') + '">' + esc(b.h3) + '</h3>'; return; }
      if (b.ul) { h += '<ul>' + b.ul.map(li => '<li>' + rich(li) + '</li>').join('') + '</ul>'; return; }
      if (b.ol) { h += '<ol>' + b.ol.map((li, i) => '<li>' + rich(li) + '</li>').join('') + '</ol>'; return; }
      if (b.quote) { h += '<blockquote>' + rich(b.quote) + '</blockquote>'; return; }
      if (b.img) { h += '<figure class="prose-fig"><img src="' + esc(b.img.src) + '" alt="' + esc(b.img.alt || '') + '"' + (b.img.cap ? '' : '') + '>' + (b.img.cap ? '<figcaption>' + esc(b.img.cap) + '</figcaption>' : '') + '</figure>'; return; }
      if (b.table) { h += '<div class="table-wrap"><table><thead><tr>' + b.table.head.map(th => '<th>' + esc(th) + '</th>').join('') + '</tr></thead><tbody>' + b.table.rows.map(r => '<tr>' + r.map(td => '<td>' + rich(td) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>'; return; }
      if (b.cta) { h += CTA_DIV(b.cta); return; }
      if (b.html) { h += b.html; return; }
    });
    return h;
  }

  /* ═════════════ کتابخانه رسانه (شبیه رسانهٔ وردپرس) ═════════════
     آپلود تصویر/فایل روی فضای ابری، کپی لینک، درج در متن و انتخاب تصویر شاخص.
     تصاویر بزرگ خودکار به WebP تبدیل و تا عرض ۱۶۰۰ پیکسل کوچک می‌شوند. */
  let mediaCache = null;

  function mediaOverlayHtml() {
    return '<div class="cd-media-veil" aria-hidden="true"></div>'
      + '<div class="cd-media" role="dialog" aria-label="کتابخانه رسانه" dir="rtl">'
      + '<div class="cd-media-head"><b>کتابخانه رسانه</b>'
      + '<span class="cd-media-hint">تصاویر بزرگ خودکار به WebP فشرده می‌شوند؛ حجم بهینه = سرعت بهتر سایت</span>'
      + '<button type="button" class="adm-btn" id="media-close">بستن</button></div>'
      + '<div class="cd-media-drop" id="media-drop"><input type="file" id="media-file" multiple accept="image/*,application/pdf" hidden>'
      + '<p>فایل را این‌جا رها کنید یا</p><button type="button" class="btn btn-gold btn-sm" id="media-browse">انتخاب فایل از دستگاه</button>'
      + '<span class="adm-hint" id="media-status"></span></div>'
      + '<div class="cd-media-grid" id="media-grid"><div class="adm-empty">در حال دریافت…</div></div>'
      + '</div>';
  }

  function humanSize(n) {
    if (!n) return '';
    if (n < 1024) return fa(n) + ' بایت';
    if (n < 1024 * 1024) return fa(Math.round(n / 1024)) + ' کیلوبایت';
    return fa((n / 1024 / 1024).toFixed(1)) + ' مگابایت';
  }

  /* تصویر بزرگ → WebP فشرده (بدون تغییر ابعاد در حد ۱۶۰۰px) */
  function imageToWebp(file) {
    return new Promise(resolve => {
      if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml' || file.size <= 220 * 1024) return resolve(file);
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        try {
          const maxW = 1600;
          const scale = img.width > maxW ? maxW / img.width : 1;
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          c.toBlob(b => {
            URL.revokeObjectURL(url);
            if (b && /webp/.test(b.type) && b.size < file.size) {
              resolve(new File([b], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' }));
            } else resolve(file);
          }, 'image/webp', 0.82);
        } catch (err) { URL.revokeObjectURL(url); resolve(file); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  function openMedia(opts, cb) {
    opts = opts || {};
    if (!isCloud()) {
      alert('کتابخانه رسانه در فضای ابری کار می‌کند.\nابتدا در پنل، مراحل اتصال فضای ابری (بنر راهنما) را انجام دهید تا آپلود تصویر فعال شود.');
      return;
    }
    let veil = $('#cd-media-veil-el');
    if (!veil) {
      const wrap = document.createElement('div');
      wrap.id = 'cd-media-root';
      wrap.innerHTML = mediaOverlayHtml();
      document.body.appendChild(wrap);
      veil = wrap;
    }
    const root = $('#cd-media-root');
    root.style.display = 'block';
    const close = () => { root.style.display = 'none'; };
    $('#media-close', root).addEventListener('click', close);
    $('.cd-media-veil', root).addEventListener('click', close);
    const drop = $('#media-drop', root);
    const fileInput = $('#media-file', root);
    const statusEl = $('#media-status', root);
    const grid = $('#media-grid', root);

    const draw = () => {
      const items = (mediaCache || []).filter(m => !opts.filter || opts.filter === 'image' ? true : true);
      grid.innerHTML = items.map(m => {
        const isImg = /\.(webp|jpe?g|png|gif|avif|svg)(\?|$)/i.test(m.url) || (m.name && /\.(webp|jpe?g|png|gif|avif|svg)$/i.test(m.name));
        return '<div class="cd-media-item" data-url="' + esc(m.url) + '" data-name="' + esc(m.name || '') + '" data-img="' + (isImg ? '1' : '0') + '">'
          + '<div class="cd-media-thumb">' + (isImg ? '<img src="' + esc(m.url) + '" alt="" loading="lazy">' : '<span class="cd-media-filetype">' + esc((m.name || '').split('.').pop() || 'فایل') + '</span>') + '</div>'
          + '<div class="cd-media-name" title="' + esc(m.name || '') + '">' + esc(m.name || '') + '</div>'
          + '<div class="cd-media-size">' + humanSize(m.size) + '</div>'
          + '<div class="cd-media-actions">'
          + (opts.pick ? '<button class="adm-btn primary" data-act="pick">' + esc(opts.pick) + '</button>' : '')
          + '<button class="adm-btn" data-act="copy">کپی لینک</button>'
          + '<button class="adm-btn danger" data-act="del">حذف</button>'
          + '</div></div>';
      }).join('') || '<div class="adm-empty">هنوز فایلی آپلود نشده است.</div>';
    };

    const load = async () => {
      grid.innerHTML = '<div class="adm-empty">در حال دریافت…</div>';
      try {
        const r = await fetch('api/media', { headers: { Accept: 'application/json' } });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.ok) { mediaCache = d.media || []; draw(); }
        else { grid.innerHTML = '<div class="adm-empty">دریافت فهرست ناموفق بود: ' + esc(d.message || d.error || '') + '</div>'; }
      } catch (e) { grid.innerHTML = '<div class="adm-empty">ارتباط با سرور برقرار نشد.</div>'; }
    };

    const upload = async files => {
      for (const f of Array.from(files || [])) {
        statusEl.textContent = 'در حال آپلود: ' + f.name;
        try {
          const payload = await imageToWebp(f);
          const fd = new FormData();
          fd.append('file', payload, payload.name || f.name);
          const r = await fetch('api/media', { method: 'POST', body: fd });
          const d = await r.json().catch(() => ({}));
          if (r.ok && d.ok) { mediaCache = [d.media].concat(mediaCache || []); draw(); }
          else { alert('آپلود «' + f.name + '» انجام نشد: ' + (d.message || d.error || r.status)); }
        } catch (e) { alert('آپلود «' + f.name + '» انجام نشد.'); }
      }
      statusEl.textContent = '';
    };

    $('#media-browse', root).addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => { upload(fileInput.files); fileInput.value = ''; });
    ;['dragover', 'dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('drag'); }));
    ;['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('drag'); }));
    drop.addEventListener('drop', e => upload(e.dataTransfer.files));

    grid.addEventListener('click', e => {
      const b = e.target.closest('button[data-act]');
      if (!b) return;
      const item = b.closest('.cd-media-item');
      const url = item.dataset.url, name = item.dataset.name, isImg = item.dataset.img === '1';
      if (b.dataset.act === 'pick') {
        if (opts.filter === 'image' && !isImg) { alert('برای تصویر شاخص فقط تصویر انتخاب کنید.'); return; }
        close();
        cb(url, isImg ? (name.replace(/\.[^.]+$/, '') || '') : '');
      }
      if (b.dataset.act === 'copy') {
        (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject())
          .then(() => toast('لینک کپی شد'))
          .catch(() => { prompt('لینک فایل:', url); });
      }
      if (b.dataset.act === 'del') {
        if (!confirm('این فایل از فضای ابری حذف شود؟')) return;
        b.disabled = true;
        fetch('api/media?url=' + encodeURIComponent(url), { method: 'DELETE' })
          .then(r => r.json().catch(() => ({})))
          .then(d => {
            if (d.ok) { mediaCache = (mediaCache || []).filter(m => m.url !== url); draw(); toast('فایل حذف شد'); }
            else { b.disabled = false; alert('حذف انجام نشد.'); }
          }).catch(() => { b.disabled = false; });
      }
    });

    load();
  }

  /* ─── مقاله: ادغام داده پایه و پنل ─── */
  function allArticles() { return CDArticles.all(); }
  function findArticle(key) {
    return allArticles().find(a => (a.id === key || a.slug === key)) || null;
  }
  const COVER_OPTIONS = ['/assets/img/cover-blog.webp', '/assets/img/cover-ai.webp', '/assets/img/cover-cwv.webp', '/assets/img/cover-responsive.webp', '/assets/img/cover-corporate.webp', '/assets/img/service-web.webp', '/assets/img/service-seo.webp', '/assets/img/service-content.webp', '/assets/img/ai-tools.webp'];

  function statusPill(a) {
    if (a.status === 'draft') return '<span class="status-pill st-draft">پیش‌نویس</span>';
    if (a.status === 'scheduled') return '<span class="status-pill st-new">زمان‌بندی‌شده</span>';
    return '<span class="status-pill st-pub">منتشرشده</span>';
  }

  /* ═════════════ نمای مقالات: فهرست ═════════════ */
  function renderArticles() {
    swapView();
    const S = window.CDStore;
    const list = allArticles();
    const cloud = isCloud();
    // بنر انتقال مقاله‌های آزمایشی همین مرورگر به فضای ابری
    let migBox = '';
    if (cloud && S && (S.newArticles().length || Object.keys(S.articleOverrides()).length)) {
      const nNew = S.newArticles().length;
      const nOvr = Object.keys(S.articleOverrides()).length;
      migBox = '<div class="adm-panel" style="margin-bottom:14px; border-color:rgba(227,185,83,.45); background:linear-gradient(150deg,rgba(227,185,83,.08),transparent)"><div style="display:flex; justify-content:space-between; align-items:center; gap:14px; flex-wrap:wrap">'
        + '<div><b>انتقال داده‌های آزمایشی این مرورگر</b><p class="adm-hint" style="margin:4px 0 0">'
        + fa(nNew) + ' مقالهٔ جدید و ' + fa(nOvr) + ' ویرایش آزمایشی در همین مرورگر ذخیره است که در فهرست ابری نیست. با انتقال، برای همه بازدیدکنندگان منتشر می‌شوند.</p></div>'
        + '<button class="btn btn-gold" id="mig-articles" type="button">انتقال و انتشار</button></div></div>';
    }
    /* ─── اصلاح خودکار متن‌های قدیمی نسخهٔ ابری (ادعا، نویسنده، تاریخ آینده، هدیه‌ها) ─── */
    const fixTargets = () => {
      const t = { claim: false, author: false, date: false, gift: false };
      list.forEach(a => {
        try {
          if (JSON.stringify(a).includes('نصف تلاش')) t.claim = true;
          if (a.author === 'تیم محتوای کافه‌دانش') t.author = true;
          if (a.slug === 'website-design-cost-bushehr-1405') {
            if (a.date === '۱۴۰۵/۰۸/۱۴' || String(a.sort) === '20261105') t.date = true;
            if (!JSON.stringify(a).includes('هاست هدیه')) t.gift = true;
          }
        } catch (e) { /* noop */ }
      });
      return t;
    };
    let fixBox = '';
    const fx = cloud ? fixTargets() : null;
    if (fx && (fx.claim || fx.author || fx.date || fx.gift)) {
      const items = [];
      if (fx.claim) items.push('حذف ادعای «نصف تلاش» در مقاله سئو');
      if (fx.author) items.push('درست‌کردن نام نویسنده (رسول بهادران)');
      if (fx.date) items.push('اصلاح تاریخ آیندهٔ مقاله تعرفه‌ها');
      if (fx.gift) items.push('افزودن هدیه‌های دامنه و هاست به مقاله تعرفه‌ها');
      fixBox = '<div class="adm-panel" style="margin-bottom:14px; border-color:rgba(88,201,139,.45); background:linear-gradient(150deg,rgba(88,201,139,.07),transparent)">'
        + '<div style="display:flex; justify-content:space-between; align-items:center; gap:14px; flex-wrap:wrap"><div><b>اصلاح خودکار متن‌های قدیمی نسخهٔ ابری</b>'
        + '<p class="adm-hint" style="margin:4px 0 0">' + items.join(' • ') + '</p></div>'
        + '<button class="btn btn-gold" id="fix-cloud-texts" type="button">اصلاح و ذخیره</button></div></div>';
    }
    view.innerHTML = setupBannerHtml() + (migBox
      ? migBox
      : '') + (fixBox
      ? fixBox
      : '')
      + '<div class="adm-topbar"><div><h1>مدیریت مقالات</h1><p class="lead">تولید، ویرایش، پیش‌نمایش و انتشار مقالات مجله'
      + (cloud ? ' — <b style="color:var(--ok)">انتشار فوری برای همه بازدیدکنندگان فعال است.</b>' : ' — در این حالت، تغییرات فقط در همین مرورگر ذخیره می‌شود.') + '</p></div>'
      + '<div class="adm-actions"><button type="button" class="btn btn-gold" id="new-article">+ مقاله جدید</button></div></div>'
      + '<div class="adm-panel"><div class="adm-toolbar">'
      + '<input class="control" id="art-search" type="search" placeholder="جست‌وجو در عنوان‌ها…">'
      + '<select class="control" id="art-status" style="max-width:180px"><option value="all">همه وضعیت‌ها</option><option value="published">منتشرشده</option><option value="draft">پیش‌نویس</option><option value="scheduled">زمان‌بندی‌شده</option></select>'
      + '</div><div class="adm-table-wrap"><table class="adm-table"><thead><tr><th>عنوان</th><th>دسته</th><th>وضعیت</th><th>تاریخ</th><th>اقدام‌ها</th></tr></thead><tbody id="art-rows"></tbody></table></div></div>';

    const fixBtn = $('#fix-cloud-texts');
    if (fixBtn) fixBtn.addEventListener('click', async () => {
      fixBtn.disabled = true; fixBtn.textContent = 'در حال اصلاح…';
      const NEW = 'ساختار اصولی سایت از ابتدا، فرایند خزش و درک صفحات توسط موتورهای جست‌وجو را ساده‌تر می‌کند و می‌تواند نیاز به اصلاحات فنی پرهزینه در آینده را کاهش دهد.';
      const patchStr = s => String(s == null ? '' : s)
        .replace(/بعداً با نصف تلاش رتبه می‌گیرد\.?/g, NEW)
        .replace(/با نصف تلاش رتبه می‌گیرد\.?/g, NEW)
        .replace(/نصف تلاش/g, 'فرایند بهینه‌سازی و توسعه سئو ساده‌تر می‌شود');
      const next = list.map(a0 => {
        let a;
        try { a = JSON.parse(JSON.stringify(a0)); } catch (e) { return a0; }
        if (a.author === 'تیم محتوای کافه‌دانش') a.author = 'رسول بهادران';
        if (a.slug === 'website-design-cost-bushehr-1405') {
          if (a.date === '۱۴۰۵/۰۸/۱۴') a.date = '۱۴۰۵/۰۸/۰۵';
          if (String(a.sort) === '20261105') a.sort = 20261027;
          if (!JSON.stringify(a).includes('هاست هدیه')) {
            a.blocks = (a.blocks || []).concat([{ p: 'برای شفافیت بیشتر: همهٔ پکیج‌های کافه‌دانش دامنهٔ .IR رایگان دارند؛ پکیج استارتر ۳ ماه و پکیج حرفه‌ای ۶ ماه هاست هدیه دارند و در پکیج‌های فروشگاهی و اختصاصی یک سال هاست هدیه به مشتریان تعلق می‌گیرد. جدول کامل امکانات در بخش تعرفه‌های صفحهٔ اصلی آمده است.' }]);
          }
        }
        a.blocks = (a.blocks || []).map(b => {
          const s = JSON.stringify(b);
          if (!s.includes('نصف تلاش')) return b;
          try { return JSON.parse(patchStr(s)); } catch (e) { return b; }
        });
        if (typeof a.excerpt === 'string' && a.excerpt.includes('نصف تلاش')) a.excerpt = patchStr(a.excerpt);
        if (typeof a.seoDesc === 'string' && a.seoDesc.includes('نصف تلاش')) a.seoDesc = patchStr(a.seoDesc);
        return a;
      });
      const ok = await cloudPut(next, 'متن‌های قدیمی اصلاح و در فضای ابری ذخیره شد');
      if (ok) renderArticles();
      else { fixBtn.disabled = false; fixBtn.textContent = 'اصلاح و ذخیره'; }
    });

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
          + (isPub
            ? '<a class="adm-btn" href="/blog/' + encodeURIComponent(a.slug) + '" target="_blank">مشاهده در سایت</a>'
            : '<a class="adm-btn" href="/article?slug=' + encodeURIComponent(a.slug) + '&preview=1" target="_blank">پیش‌نمایش</a>')
          + '<button class="adm-btn" data-act="toggle" data-key="' + esc(key) + '">' + (isPub ? 'لغو انتشار' : 'انتشار') + '</button>'
          + (isNew ? '<button class="adm-btn danger" data-act="delete" data-key="' + esc(key) + '">حذف</button>'
                   : (isCloud() ? '<button class="adm-btn danger" data-act="delete" data-key="' + esc(key) + '">حذف</button>' : ''))
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
        if (isCloud()) {
          b.disabled = true;
          cloudUpsert({ status: next }, a, next === 'published' ? 'مقاله منتشر شد — برای همه بازدیدکنندگان فعال است' : 'انتشار لغو شد (پیش‌نویس)')
            .then(ok => { if (ok) renderArticles(); });
        } else {
          if (a.id) CDStore.updateNewArticle(a.id, { status: next });
          else CDStore.saveArticleOverride(a.slug, { status: next });
          toast(next === 'published' ? 'مقاله منتشر شد' : 'انتشار لغو شد');
          renderArticles();
        }
      }
      if (b.dataset.act === 'delete') {
        if (confirm('این مقاله کاملاً حذف شود؟')) {
          if (isCloud()) {
            b.disabled = true;
            cloudDelete(a, 'مقاله حذف شد').then(ok => { if (ok) renderArticles(); });
          } else {
            CDStore.deleteNewArticle(a.id); toast('مقاله حذف شد'); renderArticles();
          }
        }
      }
    });
    // مهاجرت داده‌های آزمایشی مرورگر → ابر
    const migBtn = $('#mig-articles');
    if (migBtn) migBtn.addEventListener('click', async () => {
      migBtn.disabled = true;
      migBtn.textContent = 'در حال انتقال…';
      const overrides = S.articleOverrides();
      const fresh = S.newArticles();
      let next = CDArticles.all().slice();
      Object.keys(overrides).forEach(slug => {
        const o = overrides[slug];
        const i = next.findIndex(x => x.slug === slug);
        if (o && o.deleted) { if (i > -1) next.splice(i, 1); }
        else if (i > -1) next[i] = Object.assign({}, next[i], o);
      });
      fresh.forEach(n => {
        if (!next.some(x => x.slug === n.slug)) {
          const cp = Object.assign({}, n); delete cp.id;
          next.unshift(cp);
        }
      });
      const ok = await cloudPut(next, 'مقالات آزمایشی به فضای ابری منتقل و منتشر شد');
      if (ok) { S.remove('articles'); S.remove('articles_new'); renderArticles(); }
      else { migBtn.disabled = false; migBtn.textContent = 'انتقال و انتشار'; }
    });
    draw();
    bindSetupRecheck();
  }

  /* ═════════════ نمای ویرایش/تولید مقاله — ویرایشگر حرفه‌ای ═════════════ */
  function renderArticleEditor(key) {
    swapView();
    const isNew = !key;
    const a = isNew ? {
      title: '', slug: '', excerpt: '', cat: 'seo', catLabel: 'سئو', tags: [], author: 'رسول بهادران',
      date: '—', read: 5, cover: COVER_OPTIONS[0], coverAlt: '', seoTitle: '', seoDesc: '',
      status: 'draft', publishAt: '', blocks: [],
    } : findArticle(key);

    if (!isNew && !a) { location.hash = '#/articles'; return; }

    const catLabels = { design: 'طراحی و تجربه کاربری', seo: 'سئو', content: 'تولید محتوا', performance: 'عملکرد و سرعت', ai: 'هوش مصنوعی' };

    view.innerHTML =
      '<div class="adm-topbar"><div><h1>' + (isNew ? 'مقاله جدید' : 'ویرایش مقاله') + '</h1><p class="lead">' + (isNew ? 'بنویسید، منتشر کنید — بلافاصله در مجله برای همه و گوگل نمایش داده می‌شود. پیش‌نمایش زنده در سمت چپ.' : esc(a.title)) + '</p></div>'
      + '<div class="adm-actions">'
      + (!isNew ? '<a class="btn btn-ghost" target="_blank" rel="noopener" href="' + (((a.status || 'published') === 'published') ? ('/blog/' + encodeURIComponent(a.slug)) : ('/article?slug=' + encodeURIComponent(a.slug) + '&preview=1')) + '">پیش‌نمایش در سایت</a>' : '')
      + '<button type="button" class="btn btn-ghost" id="art-back">بازگشت</button>'
      + '<button type="button" class="btn btn-ghost" id="art-save-draft">ذخیره پیش‌نویس</button>'
      + '<button type="button" class="btn btn-ghost" id="art-save">ذخیره</button>'
      + '<button type="button" class="btn btn-gold" id="art-publish">' + (isNew ? 'انتشار مقاله' : 'انتشار') + '</button></div></div>'
      + '<div class="adm-editor-split">'
      + '<div class="adm-editor-col">'
      + '<div class="adm-panel">'
      + '<div class="adm-form-grid">'
      + '<div><label class="adm-label" for="f-title">عنوان مقاله *</label><input class="control" id="f-title" value="' + esc(a.title) + '"><button type="button" class="adm-btn" id="f-makeslug" style="margin-top:6px">تولید اسلاگ از عنوان</button></div>'
      + '<div><label class="adm-label" for="f-slug">اسلاگ (یک‌تا) *</label><input class="control" id="f-slug" dir="ltr" style="text-align:left" value="' + esc(a.slug) + '"><p class="adm-hint" id="slug-preview">آدرس نهایی مقاله: <b dir="ltr">https://cdanesh.ir/blog/<slug></b></p></div>'
      + '<div class="field-full"><label class="adm-label" for="f-excerpt">خلاصه / توضیحات متا *</label><textarea class="control" id="f-excerpt" style="min-height:70px">' + esc(a.excerpt) + '</textarea></div>'
      + '<div><label class="adm-label" for="f-cat">دسته‌بندی *</label><select class="control" id="f-cat">' + Object.entries(catLabels).map(([k, v]) => '<option value="' + k + '"' + (a.cat === k ? ' selected' : '') + '>' + v + '</option>').join('') + '</select><p class="adm-hint">دسته، محل نمایش مقاله در مجله و مقالات مرتبط را تعیین می‌کند.</p></div>'
      + '<div><label class="adm-label" for="f-tags">برچسب‌ها (با ویرگول)</label><input class="control" id="f-tags" value="' + esc((a.tags || []).join('، ')) + '"></div>'
      + '<div><label class="adm-label" for="f-author">نویسنده</label><input class="control" id="f-author" value="' + esc(a.author || 'رسول بهادران') + '"></div>'
      + '<div><label class="adm-label" for="f-read">زمان مطالعه (دقیقه)</label><input class="control" id="f-read" type="number" min="1" max="60" value="' + (a.read || 5) + '"></div>'
      + '<div class="field-full"><label class="adm-label">تصویر شاخص *</label>'
      + '<div style="display:flex; gap:16px; align-items:flex-start; flex-wrap:wrap">'
      + '<img id="cover-preview" src="' + esc(a.cover) + '" alt="" style="width:210px; border-radius:14px; border:1px solid var(--line)">'
      + '<div style="flex:1; min-width:240px; display:grid; gap:8px">'
      + '<div style="display:flex; gap:8px; flex-wrap:wrap"><button type="button" class="btn btn-gold btn-sm" id="cover-media">انتخاب از کتابخانه رسانه</button>'
      + '<input class="control" id="f-cover" dir="ltr" style="text-align:left; flex:1; min-width:200px" value="' + esc(a.cover) + '" placeholder="/assets/img/… یا لینک کتابخانه رسانه"></div>'
      + '<input class="control" id="f-coveralt" value="' + esc(a.coverAlt || '') + '" placeholder="متن جایگزین تصویر (Alt) — برای سئو الزامی است">'
      + '<p class="adm-hint">عکس دلخواه: اول از «کتابخانه رسانه» آپلود و انتخاب کنید — دیگر محدود به تصاویر قبلی سایت نیستید.</p>'
      + '</div></div></div>'
      + '<div><label class="adm-label" for="f-status">وضعیت انتشار</label><select class="control" id="f-status">'
      + '<option value="draft"' + (a.status === 'draft' ? ' selected' : '') + '>پیش‌نویس</option>'
      + '<option value="published"' + ((a.status || 'published') === 'published' ? ' selected' : '') + '>منتشرشده</option>'
      + '<option value="scheduled"' + (a.status === 'scheduled' ? ' selected' : '') + '>زمان‌بندی‌شده</option>'
      + '</select></div>'
      + '<div><label class="adm-label" for="f-publishat">زمان انتشار (برای حالت زمان‌بندی)</label><input class="control" id="f-publishat" type="datetime-local" dir="ltr" value="' + esc(a.publishAt || '') + '"></div>'
      + '<div><label class="adm-label" for="f-seotitle">عنوان سئو</label><input class="control" id="f-seotitle" value="' + esc(a.seoTitle || '') + '"></div>'
      + '<div><label class="adm-label" for="f-seodesc">توضیحات متا</label><input class="control" id="f-seodesc" value="' + esc(a.seoDesc || '') + '"></div>'
      + '</div>'
      + '<div style="margin-top:22px"><label class="adm-label">محتوای مقاله *</label>'
      + '<p class="adm-hint" style="margin-bottom:10px">مثل وردپرس مستقیم بنویسید (WYSIWYG)، عکس و جدول درج کنید یا با دکمهٔ <b dir="ltr">HTML</b> کد آزاد با پیش‌نمایش زنده اضافه کنید.</p>'
      + '<div id="f-editor"></div>'
      + '</div></div>'
      + '</div>'
      + '<aside class="adm-preview-col" id="art-preview-col">'
      + '<div class="adm-preview-head"><b>پیش‌نمایش زنده — سمت چپ</b><span>همان چیزی که در سایت منتشر می‌شود</span></div>'
      + '<div class="adm-site-preview" dir="rtl">'
      + '<figure class="pv-cover" id="pv-cover-wrap"><img id="pv-cover" alt=""></figure>'
      + '<div class="pv-meta" id="pv-meta"></div>'
      + '<h1 class="pv-title" id="pv-title"></h1>'
      + '<div class="pv-prose" id="pv-body"></div>'
      + '</div>'
      + '</aside>'
      + '</div>';

    const editor = makeEditor($('#f-editor'), blocksToHtml(a.blocks));

    const updSlugPreview = () => {
      const s = $('#f-slug').value.trim() || '<slug>';
      $('#slug-preview').innerHTML = 'آدرس نهایی مقاله: <b dir="ltr">https://cdanesh.ir/blog/' + esc(s) + '</b>';
    };
    $('#f-slug').addEventListener('input', updSlugPreview);
    updSlugPreview();

    $('#f-cover').addEventListener('input', () => { $('#cover-preview').src = $('#f-cover').value; });
    $('#cover-media').addEventListener('click', () => {
      openMedia({ filter: 'image', pick: 'انتخاب به‌عنوان تصویر شاخص' }, (url, name) => {
        $('#f-cover').value = url;
        $('#cover-preview').src = url;
        if (name && !$('#f-coveralt').value.trim()) $('#f-coveralt').value = name;
        updatePreview();
      });
    });

    /* ─── پیش‌نمایش زنده (سمت چپ) — همان رندرِ سایت (CDArticles.renderBlocks) ─── */
    const updatePreview = () => {
      const titleEl = $('#pv-title');
      if (!titleEl) return;
      titleEl.textContent = $('#f-title').value.trim() || 'عنوان مقاله';
      const catSel = $('#f-cat');
      $('#pv-meta').textContent = jalaliToday()
        + ' · ' + ($('#f-read').value || '5') + ' دقیقه مطالعه'
        + ' · ' + ($('#f-author').value.trim() || 'رسول بهادران')
        + (catSel ? ' · ' + catSel.options[catSel.selectedIndex].text : '');
      const cov = $('#f-cover').value.trim();
      const wrap = $('#pv-cover-wrap');
      if (cov) { wrap.hidden = false; $('#pv-cover').src = cov; } else { wrap.hidden = true; }
      try { $('#pv-body').innerHTML = CDArticles.renderBlocks(htmlToBlocks(editor.getHtml())); }
      catch (e) { /* noop */ }
    };
    let pvTimer = null;
    const updatePreviewLazy = () => { clearTimeout(pvTimer); pvTimer = setTimeout(updatePreview, 300); };
    $('#f-editor').addEventListener('input', updatePreviewLazy);
    view.addEventListener('input', e => { if (!e.target.closest('#f-editor')) updatePreviewLazy(); });
    updatePreview();

    $('#f-makeslug').addEventListener('click', () => {
      const s = $('#f-title').value.trim()
        .replace(/[؟?!,،.:؛«»()\[\]{}"'@#$%^&*+=|\\/~`]/g, '')
        .replace(/[\s\u200c\u200e\u200f]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
      $('#f-slug').value = s;
      updSlugPreview();
    });
    $('#art-back').addEventListener('click', () => { location.hash = '#/articles'; });

    const collect = (statusOverride) => {
      const title = $('#f-title').value.trim();
      const slug = $('#f-slug').value.trim();
      const excerpt = $('#f-excerpt').value.trim();
      const html = editor.getHtml().trim();
      if (!title || !slug || !excerpt || !html.replace(/<[^>]*>/g, '').trim()) {
        alert('عنوان، اسلاگ، خلاصه و محتوا الزامی است.'); return null;
      }
      if (!/^[a-zA-Z0-9\u0600-\u06FF-]+$/.test(slug)) { alert('اسلاگ فقط شامل حروف، عدد و خط تیره باشد.'); return null; }
      const dup = allArticles().find(x => x.slug === slug && (x.id || x.slug) !== (a.id || a.slug));
      if (dup) { alert('این اسلاگ برای مقاله دیگری استفاده شده است.'); return null; }

      const cat = $('#f-cat').value;
      const status = statusOverride || $('#f-status').value;
      const publishAt = status === 'scheduled' ? $('#f-publishat').value : '';
      return {
        title, slug, excerpt,
        cat, catLabel: catLabels[cat],
        tags: $('#f-tags').value.split(/[،,]/).map(t => t.trim()).filter(Boolean),
        author: $('#f-author').value.trim() || 'رسول بهادران',
        read: Math.max(1, parseInt($('#f-read').value, 10) || 5),
        cover: $('#f-cover').value.trim() || COVER_OPTIONS[0],
        coverAlt: $('#f-coveralt').value.trim() || title,
        seoTitle: $('#f-seotitle').value.trim() || (title + ' | کافه‌دانش'),
        seoDesc: $('#f-seodesc').value.trim() || excerpt,
        status, publishAt,
        blocks: htmlToBlocks(html),
        updated: jalaliToday(),
      };
    };

    const save = async (forcedStatus, okMsg) => {
      const data = collect(forcedStatus);
      if (!data) return;
      const status = data.status;
      if (!isCloud()) {
        // حالت دمو — فقط همین مرورگر؛ بنر راهنمای اتصال ابری نمایش داده می‌شود
        if (isNew) {
          const rec = Object.assign({ id: 'n' + Date.now(), date: jalaliToday(), sort: gregSortToday() }, data);
          CDStore.addNewArticle(rec);
        } else if (a.id) {
          CDStore.updateNewArticle(a.id, Object.assign({}, a, data));
        } else {
          CDStore.saveArticleOverride(a.slug, Object.assign({}, a, data));
        }
        toast('ذخیره شد (دمو — فقط در همین مرورگر). برای انتشار واقعی، فضای ابری را وصل کنید.');
        location.hash = '#/articles';
        return;
      }
      const rec = isNew ? Object.assign({ date: jalaliToday(), sort: gregSortToday() }, data) : data;
      const orig = isNew ? null : { id: a.id, slug: a.slug };
      const saveBtns = ['#art-save', '#art-save2', '#art-save-draft', '#art-publish'].map(sel => $(sel));
      saveBtns.forEach(b => { if (b) b.disabled = true; });
      const msg = okMsg || (status === 'draft'
        ? 'پیش‌نویس در فضای ابری ذخیره شد'
        : status === 'scheduled' ? 'مقاله زمان‌بندی شد — سر موعد خودکار عمومی می‌شود'
        : 'انتشار شد — مقاله همین حالا در مجله برای همه و گوگل نمایش داده می‌شود');
      const ok = await cloudUpsert(rec, orig, msg);
      if (ok) location.hash = '#/articles';
      else saveBtns.forEach(b => { if (b) b.disabled = false; });
    };
    $('#art-save').addEventListener('click', () => save());
    $('#art-publish').addEventListener('click', () => save('published'));
    $('#art-save-draft').addEventListener('click', () => save('draft'));
  }

  /* ═════════════ صفحات: صفحات ابری + سئوی صفحات سایت ═════════════ */
  const PAGE_LIST = [
    { path: '/', name: 'صفحه اصلی' },
    { path: '/services', name: 'همه خدمات' },
    { path: '/web-design', name: 'طراحی سایت' },
    { path: '/e-commerce', name: 'فروشگاه اینترنتی' },
    { path: '/uiux', name: 'طراحی UI/UX' },
    { path: '/seo', name: 'سئو' },
    { path: '/content-production', name: 'تولید محتوا' },
    { path: '/speed-optimization', name: 'بهینه‌سازی سرعت' },
    { path: '/ai-solutions', name: 'هوش مصنوعی' },
    { path: '/support', name: 'پشتیبانی' },
    { path: '/portfolio', name: 'نمونه‌کارها' },
    { path: '/blog', name: 'مجله' },
    { path: '/faq', name: 'سؤالات متداول' },
    { path: '/about', name: 'درباره ما' },
    { path: '/contact', name: 'تماس' },
    { path: '/request', name: 'ثبت درخواست' },
    { path: '/privacy', name: 'حریم خصوصی (ابر)' },
    { path: '/terms', name: 'شرایط استفاده (ابر)' },
  ];

  function pageUrlOf(p) {
    return (p.slug === 'terms' || p.slug === 'privacy') ? ('/' + p.slug) : ('/p/' + p.slug);
  }

  async function renderPages() {
    swapView();
    view.innerHTML =
      '<div class="adm-topbar"><div><h1>مدیریت صفحات</h1><p class="lead">صفحات متنی ابری (ساختن صفحه جدید، ویرایش و انتشار) و سئوی صفحات ثابت سایت</p></div></div>'
      + '<div class="adm-panel"><div class="adm-tabs" id="pg-tabs">'
      + '<button type="button" data-t="cloud" class="active">صفحات ابری (افزودن / ویرایش)</button>'
      + '<button type="button" data-t="seo">سئوی صفحات سایت</button>'
      + '</div><div id="pg-body"><div class="adm-empty">در حال دریافت…</div></div></div>';

    const body = $('#pg-body');
    let cloudPages = [];

    const drawCloud = () => {
      body.innerHTML =
        '<div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:14px; flex-wrap:wrap">'
        + '<p class="adm-hint">صفحهٔ جدید در آدرس <b dir="ltr">cdanesh.ir/p/&lt;slug&gt;</b> منتشر می‌شود؛ «شرایط استفاده» و «حریم خصوصی» در مسیر همیشگی خودشان (/terms و /privacy) از همین‌جا ویرایش می‌شوند.</p>'
        + '<button type="button" class="btn btn-gold" id="pg-new">+ افزودن صفحه جدید</button></div>'
        + '<div class="adm-table-wrap"><table class="adm-table"><thead><tr><th>صفحه</th><th>وضعیت</th><th>آخرین تغییر</th><th>اقدام‌ها</th></tr></thead><tbody>'
        + (cloudPages.map(p => {
            const key = esc(p.slug);
            return '<tr><td><b style="font-size:13.5px">' + esc(p.title) + '</b><br><a href="' + esc(pageUrlOf(p)) + '" target="_blank" dir="ltr" style="font-size:11px; color:var(--faint)">' + esc(pageUrlOf(p)) + '</a></td>'
              + '<td>' + (p.status === 'draft' ? '<span class="status-pill st-draft">پیش‌نویس</span>' : '<span class="status-pill st-pub">منتشرشده</span>') + '</td>'
              + '<td style="white-space:nowrap">' + esc(p.updated || '—') + '</td>'
              + '<td><div class="row-actions">'
              + '<button class="adm-btn" data-act="edit" data-key="' + key + '">ویرایش</button>'
              + '<a class="adm-btn" href="' + esc(pageUrlOf(p)) + '" target="_blank">مشاهده</a>'
              + '<button class="adm-btn" data-act="toggle" data-key="' + key + '">' + (p.status === 'draft' ? 'انتشار' : 'لغو انتشار') + '</button>'
              + (p.slug === 'terms' || p.slug === 'privacy' ? '' : '<button class="adm-btn danger" data-act="delete" data-key="' + key + '">حذف</button>')
              + '</div></td></tr>';
          }).join('') || '<tr><td colspan="4"><div class="adm-empty">صفحه‌ای نیست — با «افزودن صفحه جدید» اولین صفحه را بسازید.</div></td></tr>')
        + '</tbody></table></div>';

      $('#pg-new').addEventListener('click', () => { location.hash = '#/pages/new'; });
      // شنونده روی عنصر تازهٔ جدول بسته می‌شود تا با هر بازرندر تکراری نشود
      const tbl = body.querySelector('.adm-table-wrap');
      if (tbl) tbl.addEventListener('click', async e => {
        const b = e.target.closest('button[data-act]');
        if (!b) return;
        const p = cloudPages.find(x => x.slug === b.dataset.key);
        if (!p) return;
        if (b.dataset.act === 'edit') location.hash = '#/pages/edit/' + encodeURIComponent(p.slug);
        if (b.dataset.act === 'toggle') {
          b.disabled = true;
          const next = Object.assign({}, p, { status: p.status === 'draft' ? 'published' : 'draft', updated: jalaliToday() });
          const ok = await saveCloudPages(cloudPages.map(x => x.slug === p.slug ? next : x), 'تغییر وضعیت صفحه ذخیره شد');
          if (ok) load(); else b.disabled = false;
        }
        if (b.dataset.act === 'delete') {
          if (!confirm('این صفحه کامل حذف شود؟')) return;
          b.disabled = true;
          const ok = await saveCloudPages(cloudPages.filter(x => x.slug !== p.slug), 'صفحه حذف شد');
          if (ok) load(); else b.disabled = false;
        }
      });
    };

    const drawSeo = () => {
      const ov = CDStore.seoOverrides();
      body.innerHTML = '<div class="adm-table-wrap"><table class="adm-table"><thead><tr><th>صفحه</th><th style="min-width:220px">عنوان سئو</th><th style="min-width:260px">توضیحات متا</th><th></th></tr></thead><tbody>'
        + PAGE_LIST.map(p => {
          const o = ov[p.path] || {};
          return '<tr data-page="' + p.path + '"><td><b style="font-size:13px">' + p.name + '</b><br><span dir="ltr" style="font-size:11px;color:var(--faint)">' + p.path + '</span></td>'
            + '<td><input class="control pg-title" value="' + esc(o.title || '') + '" placeholder="پیش‌فرض فعلی صفحه"></td>'
            + '<td><input class="control pg-desc" value="' + esc(o.description || '') + '" placeholder="پیش‌فرض فعلی صفحه"></td>'
            + '<td><button class="adm-btn" data-save="' + p.path + '">ذخیره</button></td></tr>';
        }).join('')
        + '</tbody></table></div>';
      const tbl = body.querySelector('.adm-table-wrap');
      if (tbl) tbl.addEventListener('click', function onSave(e) {
        const b = e.target.closest('button[data-save]');
        if (!b) return;
        const tr = b.closest('tr');
        const path = b.dataset.save;
        const title = $('.pg-title', tr).value.trim();
        const description = $('.pg-desc', tr).value.trim();
        CDStore.saveSeo(path, { title, description });
        toast('سئوی «' + path + '» ذخیره شد');
      });
    };

    async function saveCloudPages(list, msg) {
      if (!isCloud()) { alert('برای ذخیرهٔ صفحات، ابتدا فضای ابری را وصل کنید (بنر راهنما در داشبورد).'); return false; }
      try {
        const r = await fetch('api/pages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pages: list }),
        });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.ok) { toast(msg || 'صفحات ذخیره شد — بلافاصله روی سایت منتشر شد'); return true; }
        if (r.status === 401) { CDStore.logout(); location.replace('/admin-login'); return false; }
        alert('ذخیره انجام نشد: ' + (d.message || d.error || r.status));
        return false;
      } catch (e) { alert('ارتباط با سرور برقرار نشد.'); return false; }
    }

    const load = async () => {
      if (isCloud()) {
        try {
          const r = await fetch('api/pages', { headers: { Accept: 'application/json' } });
          const d = await r.json().catch(() => ({}));
          if (r.ok && d.ok) cloudPages = d.pages || [];
        } catch (e) { /* noop */ }
        // صفحات پایهٔ همراه پروژه (شرایط استفاده و حریم خصوصی) اگر هنوز در ابر نیستند
        if (window.CD_PAGES_SEED) {
          let changed = false;
          CD_PAGES_SEED.forEach(seed => {
            if (!cloudPages.some(p => p.slug === seed.slug)) { cloudPages.push(seed); changed = true; }
          });
          if (changed) await saveCloudPages(cloudPages, 'صفحات پایه برای اولین بار به فضای ابری منتقل شد');
        }
      }
      drawCloud();
    };

    $('#pg-tabs').addEventListener('click', e => {
      const b = e.target.closest('button[data-t]');
      if (!b) return;
      $$('#pg-tabs button').forEach(x => x.classList.toggle('active', x === b));
      if (b.dataset.t === 'cloud') load(); else drawSeo();
    });

    load();
  }

  /* ─── ویرایشگر صفحهٔ ابری ─── */
  function renderPageEditor(key) {
    swapView();
    const isNew = !key;

    const build = (p) => {
      view.innerHTML =
        '<div class="adm-topbar"><div><h1>' + (isNew ? 'صفحه جدید' : 'ویرایش صفحه') + '</h1><p class="lead">' + (isNew ? 'صفحهٔ متنی جدید بسازید؛ در /p/&lt;slug&gt; منتشر می‌شود. پیش‌نمایش زنده در سمت چپ.' : esc(p.title)) + '</p></div>'
        + '<div class="adm-actions">'
        + (!isNew ? '<a class="btn btn-ghost" target="_blank" rel="noopener" href="' + esc(pageUrlOf(p)) + '">مشاهده در سایت</a>' : '')
        + '<button type="button" class="btn btn-ghost" id="pg-back">بازگشت</button>'
        + '<button type="button" class="btn btn-ghost" id="pg-save-draft">ذخیره پیش‌نویس</button>'
        + '<button type="button" class="btn btn-gold" id="pg-publish">' + (isNew ? 'انتشار صفحه' : 'انتشار') + '</button></div></div>'
        + '<div class="adm-editor-split">'
        + '<div class="adm-editor-col">'
        + '<div class="adm-panel"><div class="adm-form-grid">'
        + '<div><label class="adm-label" for="pf-title">عنوان صفحه *</label><input class="control" id="pf-title" value="' + esc(p.title) + '"></div>'
        + '<div><label class="adm-label" for="pf-slug">اسلاگ (یک‌تا) *</label><input class="control" id="pf-slug" dir="ltr" style="text-align:left" value="' + esc(p.slug) + '"' + (p.slug === 'terms' || p.slug === 'privacy' ? ' readonly' : '') + '><p class="adm-hint" id="pf-url">آدرس نهایی: <b dir="ltr">https://cdanesh.ir' + esc(pageUrlOf(p)) + '</b></p></div>'
        + '<div><label class="adm-label" for="pf-eyebrow">برچسب بالای صفحه</label><input class="control" id="pf-eyebrow" value="' + esc(p.eyebrow || '') + '"></div>'
        + '<div><label class="adm-label" for="pf-lead">جملهٔ معرفی (زیر عنوان)</label><input class="control" id="pf-lead" value="' + esc(p.lead || '') + '"></div>'
        + '<div><label class="adm-label" for="pf-seotitle">عنوان سئو</label><input class="control" id="pf-seotitle" value="' + esc(p.seoTitle || '') + '"></div>'
        + '<div><label class="adm-label" for="pf-seodesc">توضیحات متا</label><input class="control" id="pf-seodesc" value="' + esc(p.seoDesc || '') + '"></div>'
        + '</div>'
        + '<div style="margin-top:22px"><label class="adm-label">محتوای صفحه *</label>'
        + '<p class="adm-hint" style="margin-bottom:10px">با دکمهٔ <b dir="ltr">HTML</b> کد آزاد با پیش‌نمایش زنده اضافه کنید؛ عکس از کتابخانه رسانه.</p>'
        + '<div id="pf-editor"></div></div></div>'
        + '</div>'
        + '<aside class="adm-preview-col">'
        + '<div class="adm-preview-head"><b>پیش‌نمایش زنده — سمت چپ</b><span>همان چیزی که در سایت منتشر می‌شود</span></div>'
        + '<div class="adm-site-preview" dir="rtl">'
        + '<div class="pv-meta" id="pvp-eyebrow" hidden></div>'
        + '<h1 class="pv-title" id="pvp-title"></h1>'
        + '<div class="pv-meta" id="pvp-lead" hidden></div>'
        + '<div class="pv-prose" id="pvp-body"></div>'
        + '</div>'
        + '</aside>'
        + '</div>';

      const editor = makeEditor($('#pf-editor'), blocksToHtml(p.blocks || []));

      /* ─── پیش‌نمایش زنده صفحه (سمت چپ) ─── */
      const updatePagePreview = () => {
        const titleEl = $('#pvp-title');
        if (!titleEl) return;
        const eyebrow = $('#pf-eyebrow').value.trim();
        const lead = $('#pf-lead').value.trim();
        const ebEl = $('#pvp-eyebrow'), ldEl = $('#pvp-lead');
        ebEl.hidden = !eyebrow; if (eyebrow) ebEl.textContent = eyebrow;
        ldEl.hidden = !lead; if (lead) ldEl.textContent = lead;
        titleEl.textContent = $('#pf-title').value.trim() || 'عنوان صفحه';
        try { $('#pvp-body').innerHTML = CDArticles.renderBlocks(htmlToBlocks(editor.getHtml())); }
        catch (e) { /* noop */ }
      };
      let pvTimerP = null;
      const updatePagePreviewLazy = () => { clearTimeout(pvTimerP); pvTimerP = setTimeout(updatePagePreview, 300); };
      $('#pf-editor').addEventListener('input', updatePagePreviewLazy);
      view.addEventListener('input', e => { if (!e.target.closest('#pf-editor')) updatePagePreviewLazy(); });
      updatePagePreview();

      $('#pf-slug').addEventListener('input', () => {
        const s = $('#pf-slug').value.trim();
        $('#pf-url').innerHTML = 'آدرس نهایی: <b dir="ltr">https://cdanesh.ir' + esc(s === 'terms' || s === 'privacy' ? '/' + s : '/p/' + s) + '</b>';
      });
      $('#pf-back').addEventListener('click', () => { location.hash = '#/pages'; });

      const save = async (status) => {
        const title = $('#pf-title').value.trim();
        const slug = $('#pf-slug').value.trim();
        const html = editor.getHtml().trim();
        if (!title || !slug || !html.replace(/<[^>]*>/g, '').trim()) { alert('عنوان، اسلاگ و محتوا الزامی است.'); return; }
        if (!/^[a-zA-Z0-9\u0600-\u06FF-]{1,60}$/.test(slug)) { alert('اسلاگ فقط حروف، عدد و خط تیره (حداکثر ۶۰ کاراکتر).'); return; }
        if (['blog', 'article', 'admin', 'admin-login', 'api', 'assets', 'p'].includes(slug)) { alert('این اسلاگ رزرو است؛ اسلاگ دیگری انتخاب کنید.'); return; }
        const r = await fetch('api/pages', { headers: { Accept: 'application/json' } });
        const d = await r.json().catch(() => ({}));
        let list = (r.ok && d.ok) ? (d.pages || []) : (window.CD_PAGES_SEED || []);
        const dup = list.find(x => x.slug === slug && x.slug !== (p.slug || ''));
        if (dup) { alert('این اسلاگ برای صفحه دیگری استفاده شده است.'); return; }
        const rec = {
          slug, title,
          eyebrow: $('#pf-eyebrow').value.trim(),
          lead: $('#pf-lead').value.trim(),
          seoTitle: $('#pf-seotitle').value.trim() || (title + ' | کافه‌دانش'),
          seoDesc: $('#pf-seodesc').value.trim(),
          status: status || 'published',
          blocks: htmlToBlocks(html),
          updated: jalaliToday(),
        };
        const next = list.some(x => x.slug === (p.slug || slug))
          ? list.map(x => x.slug === (p.slug || slug) ? rec : x)
          : [rec].concat(list);
        const btns = ['#pg-publish', '#pg-save-draft'].map(s => $(s));
        btns.forEach(b => { if (b) b.disabled = true; });
        if (!isCloud()) { alert('برای ذخیره، ابتدا فضای ابری را وصل کنید (بنر راهنما در داشبورد).'); btns.forEach(b => { if (b) b.disabled = false; }); return; }
        try {
          const r2 = await fetch('api/pages', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pages: next }),
          });
          const d2 = await r2.json().catch(() => ({}));
          if (r2.ok && d2.ok) {
            toast(status === 'draft' ? 'پیش‌نویس ذخیره شد' : 'صفحه منتشر شد — در آدرس نهایی قابل مشاهده است');
            location.hash = '#/pages';
          } else {
            alert('ذخیره انجام نشد: ' + (d2.message || d2.error || r2.status));
            btns.forEach(b => { if (b) b.disabled = false; });
          }
        } catch (e) { alert('ارتباط با سرور برقرار نشد.'); btns.forEach(b => { if (b) b.disabled = false; }); }
      };
      $('#pg-publish').addEventListener('click', () => save('published'));
      $('#pg-save-draft').addEventListener('click', () => save('draft'));
    };

    if (isNew) {
      build({ slug: '', title: '', eyebrow: '', lead: '', seoTitle: '', seoDesc: '', status: 'draft', blocks: [] });
      return;
    }
    (async () => {
      let pages = [];
      try {
        const r = await fetch('api/pages', { headers: { Accept: 'application/json' } });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.ok) pages = d.pages || [];
      } catch (e) { /* noop */ }
      if (!pages.length && window.CD_PAGES_SEED) pages = window.CD_PAGES_SEED.slice();
      const p = pages.find(x => x.slug === key);
      if (!p) { location.hash = '#/pages'; return; }
      build(p);
    })();
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

  /* ─── لایه پیام‌ها: ابری (api/messages + Blob) یا مرورگر ─── */
  let msgCloud = null;          // null = هنوز بررسی نشده؛ true/false نتیجهٔ اتصال
  let msgList = [];             // فهرست یکپارچهٔ پیام‌ها (ابری یا محلی)

  async function loadMessages() {
    const local = CDStore.messages();
    try {
      const r = await fetch('api/messages', { headers: { Accept: 'application/json' } });
      const ct = r.headers.get('content-type') || '';
      if (r.ok && ct.includes('application/json')) {
        const d = await r.json();
        if (d && d.ok && Array.isArray(d.messages)) {
          msgCloud = true;
          msgList = d.messages;
          // پیام‌های آزمایشی همین مرورگر که هنوز در ابر نیستند → یک‌باره بالا بفرست
          if (local.length && !local.some(m => m.cloud)) {
            await pushLocalMessages(local);
          }
          return;
        }
      }
    } catch (e) { /* بدون سرور → حالت محلی */ }
    msgCloud = false;
    msgList = local;
  }

  async function pushLocalMessages(local) {
    try {
      const r = await fetch('api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: local.map(m => Object.assign({}, m, { cloud: true })) }),
      });
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        if (d && d.ok && Array.isArray(d.messages)) { msgList = d.messages; CDStore.remove('messages'); }
      }
    } catch (e) { /* noop */ }
  }

  async function saveMessages(nextList) {
    const body = JSON.stringify({ messages: nextList });
    if (msgCloud) {
      let r = null;
      /* دو تلاش خودکار برای خطاهای گذرا (تایم‌اوت لحظه‌ای سرور)؛
         PUT کل فهرست است و تکرارش ایمن. */
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          r = await fetch('api/messages', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body,
          });
          if (r.status !== 502 && r.status !== 503 && r.status !== 504) break;
        } catch (e) { r = null; }
        if (attempt === 0) await new Promise(res => setTimeout(res, 900));
      }
      if (!r) { alert('ارتباط با سرور برقرار نشد؛ اتصال اینترنت را بررسی کنید.'); return false; }
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok) { msgList = d.messages || nextList; return true; }
      if (r.status === 401) { CDStore.logout(); location.replace('/admin-login'); return false; }
      alert(r.status === 504
        ? 'ذخیرهٔ پیام‌ها انجام نشد: سرور دیر پاسخ داد (تایم‌اوت). چند لحظه بعد دوباره تلاش کنید.'
        : 'ذخیره ابری پیام‌ها انجام نشد: ' + (d.message || d.error || r.status));
      return false;
    }
    // حالت دمو: همان ذخیرهٔ مرورگر
    CDStore.write('messages', nextList);
    msgList = nextList;
    return true;
  }

  const unreadCount = () => msgList.filter(m => (m.status || 'new') === 'new').length;

  function updateMsgBadge() {
    const badge = $('#nav-msg-count');
    if (!badge) return;
    const n = unreadCount();
    badge.textContent = fa(n);
    badge.hidden = n === 0;
  }

  /* ═════════════ پیام‌ها ═════════════
     کلیک روی هر پیام → پنجرهٔ کامل پیام (خواندن راحت + همهٔ دکمه‌های پاسخ و مدیریت)؛
     باز کردن پیام جدید، خودکار «خوانده‌شده» می‌شود؛ همهٔ تغییرات ابری ذخیره می‌شوند. */
  function renderMessages() {
    swapView();
    const cloud = msgCloud === true;
    updateMsgBadge();

    view.innerHTML = setupBannerHtml()
      + '<div class="adm-topbar"><div><h1>پیام‌ها و درخواست‌ها</h1><p class="lead">پیام‌های ثبت‌شده از فرم‌های تماس و درخواست خدمات'
      + (cloud ? ' — <b style="color:var(--ok)">ذخیره ابری فعال است؛ پیام‌های همه بازدیدکنندگان این‌جا می‌آید.</b>' : ' — حالت دمو: فقط پیام‌های همین مرورگر.') + '</p></div>'
      + '<div class="adm-actions"><button type="button" class="btn btn-ghost" id="msg-refresh">به‌روزرسانی فهرست</button>'
      + '<button type="button" class="btn btn-ghost" id="msg-export">خروجی JSON</button></div></div>'
      + '<div class="adm-panel"><div class="adm-tabs" id="msg-tabs">'
      + '<button type="button" data-f="all" class="active">همه (' + fa(msgList.length) + ')</button>'
      + '<button type="button" data-f="new">جدید (' + fa(msgList.filter(m => (m.status || 'new') === 'new').length) + ')</button>'
      + '<button type="button" data-f="read">خوانده‌شده</button>'
      + '<button type="button" data-f="replied">پاسخ‌داده‌شده</button>'
      + '</div>'
      + '<p class="adm-hint" style="margin:12px 4px 0">برای باز کردن و خواندن کامل هر پیام، <b>روی خود پیام کلیک کنید</b> — پنجرهٔ کامل پیام با همهٔ دکمه‌های پاسخ باز می‌شود و پیام جدید خودکار «خوانده‌شده» می‌شود.</p>'
      + '<div id="msg-list" style="margin-top:10px"></div></div>';

    const listBox = $('#msg-list');
    let curFilter = 'all';

    /* شمارهٔ ایران → فرمت واتس‌اپ (۰۹… → ۹۸۹…) */
    const waLink = (m) => {
      const d = String(m.phone || '').replace(/[۰-۹]/g, x => '۰۱۲۳۴۵۶۷۸۹'.indexOf(x)).replace(/\D/g, '');
      if (!d) return '';
      const intl = d.startsWith('98') ? d : (d.startsWith('0') ? '98' + d.slice(1) : d);
      const txt = 'سلام ' + (m.name || '') + '، در پاسخ به ' + (m.kind === 'request' ? 'درخواست' : 'پیام') + ' شما در کافه‌دانش (کد ' + (m.ref || '') + ')';
      return 'https://wa.me/' + intl + '?text=' + encodeURIComponent(txt);
    };
    const snippet = m => {
      const t = ((m.subject ? 'موضوع: ' + m.subject + ' — ' : '') + (m.message || '')).replace(/\s+/g, ' ').trim();
      return t.length > 110 ? t.slice(0, 110) + '…' : t;
    };

    const draw = f => {
      if (f) curFilter = f;
      const items = msgList.filter(m => curFilter === 'all' || (m.status || 'new') === curFilter);
      listBox.innerHTML = items.map(m => {
        const st = m.status || 'new';
        return '<div class="msg-row adm-check" data-id="' + esc(m.id) + '" data-act="open" role="button" tabindex="0" aria-label="باز کردن پیام">'
          + '<span class="status-pill ' + (st === 'new' ? 'st-new' : st === 'replied' ? 'st-pub' : 'st-draft') + '">' + (st === 'new' ? 'جدید' : st === 'replied' ? 'پاسخ داده شد' : 'خوانده‌شده') + '</span>'
          + '<div style="flex:1; min-width:220px">'
          + '<b style="font-size:13.5px">' + esc(m.name || '—') + '</b> <span dir="ltr" style="font-size:11.5px; color:var(--faint)">' + esc(m.phone || '') + (m.email ? ' · ' + esc(m.email) : '') + '</span>'
          + '<div class="msg-snippet">' + esc(snippet(m)) + '</div>'
          + '<span style="font-size:11.5px; color:var(--faint)">' + (m.kind === 'request' ? 'درخواست خدمات' : 'پیام تماس')
          + (m.package ? ' — پکیج: ' + esc(m.package) : '') + (m.budget ? ' — بودجه: ' + esc(m.budget) : '')
          + ' — کد ' + esc(m.ref) + ' — ' + faDate(m.date) + '</span>'
          + '</div>'
          + '<div class="msg-quick">'
          + '<button type="button" class="adm-btn primary" data-act="open">باز کردن و خواندن</button>'
          + '<button type="button" class="adm-btn danger" data-act="del">حذف</button>'
          + '</div></div>';
      }).join('')
        || '<div class="adm-empty">پیامی در این وضعیت وجود ندارد. فرم‌های سایت، پیام‌ها را همین‌جا ثبت می‌کنند.</div>';
    };
    draw('all');
    bindSetupRecheck();

    /* تغییر وضعیت/حذف — همیشه روی آخرین فهرست ابری */
    const setStatus = async (id, status) => {
      const next = msgList.map(m => m.id === id ? Object.assign({}, m, { status }) : m);
      const ok = await saveMessages(next);
      if (ok) { updateMsgBadge(); draw(); }
      return ok;
    };
    const removeById = async id => {
      const next = msgList.filter(m => m.id !== id);
      const ok = await saveMessages(next);
      if (ok) { updateMsgBadge(); draw(); }
      return ok;
    };

    /* ─── پنجرهٔ کامل پیام (باز کردن/خواندن/پاسخ/حذف) ─── */
    const openMessageModal = async (rec) => {
      let m = rec;
      // پیام جدید با باز شدن، خودکار خوانده‌شده می‌شود
      if ((m.status || 'new') === 'new') {
        m = Object.assign({}, m, { status: 'read' });
        await setStatus(m.id, 'read');
      }
      const wa = waLink(m);
      let root = $('#cd-msg-root');
      if (!root) { root = document.createElement('div'); root.id = 'cd-msg-root'; document.body.appendChild(root); }
      root.innerHTML = '<div class="adm-modal-veil" data-close="1"></div>'
        + '<div class="adm-modal" role="dialog" aria-label="مشاهدهٔ پیام" dir="rtl">'
        + '<div class="adm-modal-head"><b>' + (m.kind === 'request' ? 'درخواست خدمات' : 'پیام تماس') + ' — کد ' + esc(m.ref) + '</b>'
        + '<button type="button" class="adm-btn" data-close="1">بستن ✕</button></div>'
        + '<div class="adm-modal-body">'
        + '<div class="msg-grid">'
        + '<div><small>نام</small><b>' + esc(m.name || '—') + '</b></div>'
        + '<div><small>موبایل</small><b dir="ltr">' + esc(m.phone || '—') + '</b></div>'
        + (m.email ? '<div><small>ایمیل</small><b dir="ltr">' + esc(m.email) + '</b></div>' : '')
        + (m.service ? '<div><small>خدمت</small><b>' + esc(m.service) + '</b></div>' : '')
        + (m.package ? '<div><small>پکیج</small><b>' + esc(m.package) + '</b></div>' : '')
        + (m.budget ? '<div><small>بودجه</small><b>' + esc(m.budget) + '</b></div>' : '')
        + (m.subject ? '<div><small>موضوع</small><b>' + esc(m.subject) + '</b></div>' : '')
        + '<div><small>تاریخ</small><b>' + faDate(m.date) + '</b></div>'
        + '</div>'
        + '<div class="msg-full"><small>متن کامل پیام</small><p>' + esc(m.message || '') + '</p></div>'
        + '</div>'
        + '<div class="adm-modal-foot">'
        + (wa ? '<a class="btn btn-gold btn-sm" href="' + esc(wa) + '" target="_blank" rel="noopener">پاسخ در واتس‌اپ</a>' : '')
        + (m.phone ? '<a class="btn btn-ghost btn-sm" href="tel:' + esc(m.phone) + '">تماس با فرستنده</a>' : '')
        + (m.email ? '<a class="btn btn-ghost btn-sm" href="mailto:' + esc(m.email) + '?subject=' + encodeURIComponent('پاسخ به پیام ' + (m.ref || '') + ' — کافه‌دانش') + '">پاسخ با ایمیل</a>' : '')
        + '<span style="flex:1"></span>'
        + '<button type="button" class="adm-btn" data-act="copy">کپی متن پیام</button>'
        + '<button type="button" class="adm-btn" data-act="unread">علامت‌گذاری «جدید»</button>'
        + '<button type="button" class="adm-btn primary" data-act="replied">پاسخ داده شد</button>'
        + '<button type="button" class="adm-btn danger" data-act="del">حذف پیام</button>'
        + '</div></div>';
      root.style.display = 'block';
      document.body.classList.add('adm-modal-open');
      const close = () => { root.style.display = 'none'; document.body.classList.remove('adm-modal-open'); };
      root.addEventListener('click', async e => {
        if (e.target.closest('[data-close]')) { close(); return; }
        const b = e.target.closest('button[data-act]');
        if (!b) return;
        const act = b.dataset.act;
        if (act === 'copy') {
          try { await navigator.clipboard.writeText(m.message || ''); toast('متن پیام کپی شد'); }
          catch (err) { prompt('متن پیام:', m.message || ''); }
        }
        if (act === 'unread') { const ok = await setStatus(m.id, 'new'); if (ok) { toast('وضعیت: جدید'); close(); } }
        if (act === 'replied') { const ok = await setStatus(m.id, 'replied'); if (ok) { toast('وضعیت: پاسخ داده شد'); close(); } }
        if (act === 'del') {
          if (!confirm('این پیام برای همیشه حذف شود؟')) return;
          const ok = await removeById(m.id);
          if (ok) { toast('پیام حذف شد'); close(); }
        }
      });
    };

    $('#msg-tabs').addEventListener('click', e => {
      const b = e.target.closest('button[data-f]');
      if (!b) return;
      $$('#msg-tabs button').forEach(x => x.classList.toggle('active', x === b));
      draw(b.dataset.f);
    });
    listBox.addEventListener('click', e => {
      // دکمه‌ها
      const b = e.target.closest('button[data-act]');
      if (b) {
        const row = b.closest('.msg-row');
        const m = row ? msgList.find(x => x.id === row.dataset.id) : null;
        if (!m) return;
        if (b.dataset.act === 'open') openMessageModal(m);
        if (b.dataset.act === 'del') {
          if (!confirm('این پیام حذف شود؟')) return;
          b.disabled = true;
          removeById(m.id).then(ok => { if (!ok) b.disabled = false; });
        }
        return;
      }
      if (e.target.closest('a')) return; // لینک‌ها (واتس‌اپ/تماس) به‌صورت عادی
      // کلیک روی خود پیام → باز کردن کامل
      const row = e.target.closest('.msg-row');
      if (row) {
        const m = msgList.find(x => x.id === row.dataset.id);
        if (m) openMessageModal(m);
      }
    });
    $('#msg-refresh').addEventListener('click', async () => {
      const btn = $('#msg-refresh');
      btn.disabled = true; btn.textContent = 'در حال دریافت…';
      await loadMessages();
      updateMsgBadge();
      renderMessages();
    });
    $('#msg-export').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(msgList, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'cdanesh-messages.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  /* ═════════════ کتابخانه رسانه (نمای مستقل) ═════════════ */
  function renderMedia() {
    swapView();
    view.innerHTML = setupBannerHtml()
      + '<div class="adm-topbar"><div><h1>کتابخانه رسانه</h1><p class="lead">آپلود و مدیریت تصاویر و فایل‌ها روی فضای ابری — برای تصویر شاخص، داخل متن مقالات و صفحات</p></div>'
      + '<div class="adm-actions"><button type="button" class="btn btn-gold" id="media-open">باز کردن کتابخانه رسانه</button></div></div>'
      + '<div class="adm-panel"><p class="adm-hint">در پنجرهٔ کتابخانه می‌توانید فایل را بکشید و رها کنید یا از دستگاه انتخاب کنید؛ تصاویر بزرگ خودکار به WebP فشرده می‌شوند تا سایت سریع بماند (سقف هر فایل ۴ مگابایت). برای هر فایل: کپی لینک یا حذف. از داخل ویرایشگر مقاله/صفحه هم همین کتابخانه با دکمهٔ 🖼 باز می‌شود.</p></div>';
    $('#media-open').addEventListener('click', () => openMedia({}));
    bindSetupRecheck();
  }

  /* ═════════════ درگاه پرداخت ═════════════ */
  let payCloud = null;   // null = بررسی نشده؛ true/false اتصال ابری
  let payList = [];      // [{id, name, url, active, note}]

  async function loadPayments() {
    try {
      const r = await fetch('api/payments', { headers: { Accept: 'application/json' } });
      const ct = r.headers.get('content-type') || '';
      if (r.ok && ct.includes('application/json')) {
        const d = await r.json();
        if (d && d.ok && Array.isArray(d.gateways)) { payCloud = true; payList = d.gateways; return; }
      }
    } catch (e) { /* بدون سرور → حالت محلی */ }
    payCloud = false;
    payList = CDStore.read('gateways', []);
  }

  async function savePayments(nextList) {
    if (payCloud) {
      try {
        const r = await fetch('api/payments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gateways: nextList }),
        });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.ok) { payList = d.gateways || nextList; return true; }
        if (r.status === 401) { CDStore.logout(); location.replace('/admin-login'); return false; }
        alert('ذخیره ابری درگاه انجام نشد: ' + (d.message || d.error || r.status));
        return false;
      } catch (e) { alert('ارتباط با سرور برقرار نشد.'); return false; }
    }
    CDStore.write('gateways', nextList);
    payList = nextList;
    return true;
  }

  function renderPayments() {
    swapView();
    const cloud = payCloud === true;
    let working = payList.map(g => Object.assign({}, g));

    view.innerHTML = setupBannerHtml()
      + '<div class="adm-topbar"><div><h1>درگاه پرداخت</h1><p class="lead">لینک درگاه‌های واسط (زرین‌پال، آیدی‌پی، زیبال و…) را این‌جا ثبت کن؛ دکمه‌های «پرداخت آنلاین» سایت بلافاصله به همان لینک وصل می‌شوند.'
      + (cloud ? ' — <b style="color:var(--ok)">ذخیره ابری فعال است.</b>' : ' — حالت دمو: ذخیره فقط در همین مرورگر.') + '</p></div>'
      + '<div class="adm-actions"><button type="button" class="btn btn-gold" id="pay-add">+ درگاه جدید</button>'
      + '<button type="button" class="btn btn-ghost" id="pay-save">ذخیره تغییرات</button></div></div>'
      + '<div class="adm-panel"><div class="adm-table-wrap"><table class="adm-table"><thead><tr>'
      + '<th style="min-width:150px">نام درگاه</th><th style="min-width:260px">آدرس لینک پرداخت</th><th style="min-width:150px">پکیج مرتبط</th><th>فعال</th><th></th>'
      + '</tr></thead><tbody id="pay-rows"></tbody></table></div>'
      + '<p class="adm-hint" style="margin-top:14px">نکته‌ها: آدرس باید با <b dir="ltr">https://</b> شروع شود. برای هر پکیج می‌توانی یک درگاه جدا با لینک و مبلغ خودش بسازی (ستون «پکیج مرتبط»)؛ درگاهِ «همهٔ پکیج‌ها» به همهٔ دکمه‌ها وصل می‌شود. دکمه‌های پرداخت در تب جدید باز می‌شوند و تا وقتی هیچ درگاهی فعال نکنی، در سایت نمایش داده نمی‌شوند — لینک مرده نداریم.</p></div>';

    const rows = $('#pay-rows');
    const PKG_OPTS = [
      { v: '', t: 'همهٔ پکیج‌ها' },
      { v: 'starter', t: 'استارتر' },
      { v: 'pro', t: 'حرفه‌ای' },
      { v: 'shop', t: 'فروشگاهی' },
      { v: 'custom', t: 'اختصاصی' },
    ];
    const draw = () => {
      rows.innerHTML = working.map((g, i) =>
        '<tr><td><input class="control p-name" data-i="' + i + '" value="' + esc(g.name || '') + '" placeholder="مثلاً زرین‌پال ۱۵ میلیون"></td>'
        + '<td><input class="control p-url" data-i="' + i + '" dir="ltr" style="text-align:left" value="' + esc(g.url || '') + '" placeholder="https://zarinp.al/xxxx"></td>'
        + '<td><select class="control p-pkg" data-i="' + i + '">' + PKG_OPTS.map(o => '<option value="' + o.v + '"' + (String(g.pkg || '') === o.v ? ' selected' : '') + '>' + o.t + '</option>').join('') + '</select></td>'
        + '<td><button type="button" class="adm-btn' + (g.active ? ' primary' : '') + '" data-active="' + i + '">' + (g.active ? 'فعال' : 'غیرفعال') + '</button></td>'
        + '<td><button type="button" class="adm-btn danger" data-del="' + i + '">حذف</button></td></tr>').join('')
        || '<tr><td colspan="5"><div class="adm-empty">هنوز درگاهی ثبت نشده است. با «+ درگاه جدید» لینک پرداخت را اضافه کن.</div></td></tr>';
    };
    draw();

    rows.addEventListener('input', e => {
      const el = e.target;
      if (el.classList.contains('p-name')) working[+el.dataset.i].name = el.value;
      if (el.classList.contains('p-url')) working[+el.dataset.i].url = el.value;
    });
    rows.addEventListener('change', e => {
      const el = e.target;
      if (el.classList.contains('p-pkg')) working[+el.dataset.i].pkg = el.value;
    });
    rows.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.active !== undefined) {
        const i = +b.dataset.active;
        const grp = String(working[i].pkg || ''); // فعال‌سازی فقط در گروه همان پکیج
        working = working.map((g, j) => Object.assign({}, g, { active: j === i ? !g.active : (String(g.pkg || '') === grp ? false : g.active) }));
        draw();
      }
      if (b.dataset.del !== undefined) { working.splice(+b.dataset.del, 1); draw(); }
    });
    $('#pay-add').addEventListener('click', () => {
      working.push({ id: 'g' + Date.now(), name: '', url: '', active: working.length === 0, note: '' });
      draw();
    });
    $('#pay-save').addEventListener('click', async () => {
      const clean = working
        .map(g => Object.assign({}, g, { name: (g.name || '').trim(), url: (g.url || '').trim() }))
        .filter(g => g.name && g.url);
      const bad = clean.find(g => !/^https:\/\/[^\s]+\.[^\s]+/.test(g.url));
      if (bad) { alert('آدرس درگاه «' + bad.name + '» معتبر نیست؛ باید با https:// شروع شود.'); return; }
      if (clean.length && !clean.some(g => g.active)) {
        alert('حداقل یک درگاه را «فعال» کن تا دکمه پرداخت سایت کار کند.');
        return;
      }
      const btn = $('#pay-save');
      btn.disabled = true;
      const ok = await savePayments(clean.map((g, i) => Object.assign(g, { id: g.id || ('g' + Date.now() + i) })));
      btn.disabled = false;
      if (ok) { working = payList.map(g => Object.assign({}, g)); toast('درگاه پرداخت ذخیره شد — دکمه‌های سایت به‌روز شدند'); }
    });
    bindSetupRecheck();
  }

  /* ═════════════ سئو ═════════════ */
  function renderSeo() {
    swapView();
    const robots = 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin-login\n\nSitemap: https://cdanesh.ir/sitemap.xml';
    const pages = PAGE_LIST.filter(p => p.path !== '/privacy' && p.path !== '/terms').map(p => 'https://cdanesh.ir' + p.path);
    view.innerHTML =
      '<div class="adm-topbar"><div><h1>سئو</h1><p class="lead">ابزارهای سئوی فنی سایت — از نقشه سایت تا داده‌های ساختاریافته</p></div></div>'
      + '<div class="adm-grid2">'
      + '<div class="adm-panel"><div class="adm-panel-head"><b>Robots.txt</b><span class="chip">فعال</span></div><pre style="direction:ltr; text-align:left; background:rgba(255,255,255,.04); border:1px solid var(--line); border-radius:12px; padding:16px; font-size:12px; overflow:auto; white-space:pre-wrap">' + esc(robots) + '</pre>'
      + '<p class="adm-hint">این فایل روی سایت واقعی در <b dir="ltr">cdanesh.ir/robots.txt</b> فعال است.</p></div>'
      + '<div class="adm-panel"><div class="adm-panel-head"><b>نقشه سایت (Sitemap)</b><span class="chip">به‌روز خودکار</span></div><div style="max-height:300px; overflow:auto"><ul style="display:grid; gap:6px; font-size:12px" dir="ltr">'
      + pages.map(u => '<li dir="ltr" style="direction:ltr; text-align:left">' + esc(u) + '</li>').join('')
      + '<li dir="ltr" style="direction:ltr; text-align:left">https://cdanesh.ir/blog/&lt;slug&gt; — آدرس اختصاصی هر مقاله (خودکار)</li>'
      + '<li dir="ltr" style="direction:ltr; text-align:left">https://cdanesh.ir/p/&lt;slug&gt; — صفحات ابری (خودکار)</li>'
      + '</ul></div><p class="adm-hint">نقشهٔ سایت به‌صورت خودکار ساخته می‌شود: هر مقاله یا صفحه‌ای که منتشر کنید، بلافاصله به <b dir="ltr">cdanesh.ir/sitemap.xml</b> اضافه می‌شود.</p></div>'
      + '</div>'
      + '<div class="adm-panel" style="margin-top:18px"><div class="adm-panel-head"><b>وضعیت داده‌های ساختاریافته</b><span class="chip chip-gold">مطابق محتوای واقعی</span></div>'
      + '<div class="adm-check"><span class="adm-audit-ok">●</span><div><b>Organization + WebSite</b><span>در تمام صفحات</span></div></div>'
      + '<div class="adm-check"><span class="adm-audit-ok">●</span><div><b>FAQPage</b><span>صفحات خدمات و سؤالات متداول — در HTML واقعی صفحه</span></div></div>'
      + '<div class="adm-check"><span class="adm-audit-ok">●</span><div><b>Article</b><span>صفحه مقاله — به‌صورت پویا</span></div></div>'
      + '<div class="adm-check"><span class="adm-audit-ok">●</span><div><b>BreadcrumbList</b><span>مسیر صفحات داخلی</span></div></div>'
      + '<p class="adm-hint">نمایش FAQ یا امتیازهای ویژه در نتایج گوگل تضمینی نیست؛ این داده‌ها فقط ساختار واقعی محتوا را برای موتور جست‌وجو روشن می‌کنند.</p></div>'
      + '<div class="adm-panel" style="margin-top:18px"><div class="adm-panel-head"><b>نام برند در گوگل — «کافه‌دانش»</b><span class="chip">متادیتای سایت درست است</span></div>'
      + '<p class="adm-hint">نام برند در همهٔ متادیتاهای سایت صحیح و یکدست است: <b>«کافه‌دانش»</b> — در title همهٔ صفحات، <b dir="ltr">og:site_name</b>، دادهٔ ساختاریافتهٔ Organization و WebSite و نقشهٔ سایت. اگر گوگل هنوز نام قدیمی یا نادرست (مثل «کافه ئانش» یا توضیح قدیمی) نشان می‌دهد، این دادهٔ قدیمیِ ایندکس گوگل است، نه سایت:<br>'
      + '۱) در <b>Google Search Console</b> → بخش URL Inspection آدرس <b dir="ltr">https://cdanesh.ir/</b> را بدهید و «Request Indexing» بزنید.<br>'
      + '۲) همین کار را برای /about ، /services و /blog انجام دهید.<br>'
      + '۳) در بخش Sitemaps نقشهٔ سایت <b dir="ltr">https://cdanesh.ir/sitemap.xml</b> را دوباره ثبت کنید.<br>'
      + '۴) اگر پروفایل کسب‌وکار گوگل (Google Business) دارید، نام و توضیح آن‌جا را هم دقیقاً «کافه‌دانش» کنید.<br>'
      + '۵) چند روز تا چند هفته صبر کنید — گوگل به‌تدریج توضیح و نام جدید را جایگزین می‌کند. برای دیدن وضعیت ایندکس فعلی، در گوگل <b dir="ltr">site:cdanesh.ir</b> را جست‌وجو کنید.</p></div>';
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
    swapView();
    const s = CDStore.settings();
    view.innerHTML =
      '<div class="adm-topbar"><div><h1>تنظیمات</h1><p class="lead">اطلاعات عمومی، امنیت حساب و مدیریت داده‌های نسخه آزمایشی</p></div></div>'
      + '<div class="adm-grid2">'
      + '<div class="adm-panel"><div class="adm-panel-head"><b>اطلاعات سایت</b></div><div class="adm-form-grid">'
      + '<div><label class="adm-label">ایمیل عمومی</label><input class="control" id="s-email" dir="ltr" value="' + esc(s.email || 'info@cdanesh.ir') + '"></div>'
      + '<div><label class="adm-label">تلفن نمایشی</label><input class="control" id="s-phone" dir="ltr" value="' + esc(s.phone || '') + '" placeholder="09165806207"></div>'
      + '</div><button type="button" class="btn btn-gold btn-sm" id="s-save" style="margin-top:16px">ذخیره</button></div>'
      + '<div class="adm-panel"><div class="adm-panel-head"><b>تغییر نام کاربری و رمز عبور</b></div>'
      + (isCloud()
        ? '<div class="adm-form-grid" style="margin-top:12px">'
        + '<div><label class="adm-label">نام کاربری جدید (اختیاری)</label><input class="control" id="u-new" dir="ltr" autocomplete="username" placeholder="بدون تغییر بماند"></div>'
        + '<div><label class="adm-label">رمز فعلی *</label><input class="control" id="u-old" type="password" dir="ltr" autocomplete="current-password"></div>'
        + '<div><label class="adm-label">رمز جدید (اختیاری — حداقل ۸ کاراکتر)</label><input class="control" id="u-newpass" type="password" dir="ltr" autocomplete="new-password"></div>'
        + '</div>'
        + '<button type="button" class="btn btn-gold btn-sm" id="u-save" style="margin-top:16px">ذخیره اعتبارنامه</button>'
        + '<p class="adm-hint" style="margin-top:12px">پس از ذخیره، همهٔ نشست‌های فعال روی دستگاه‌های دیگر بسته می‌شوند و مرورگر پیشنهاد ذخیرهٔ رمز جدید می‌دهد — تأیید کنید تا دفعهٔ بعد خودکار پر شود. نکتهٔ اطمینان: رمز ثبت‌شده در ورسل (ADMIN_PASSWORD) همیشه به‌عنوان کلید اضطراری هم کار می‌کند تا دسترسی هیچ‌وقت از دست نرود.</p>'
        + '</div>'
        : '<div class="adm-form-grid" style="margin-top:12px"><div><label class="adm-label">رمز فعلی</label><input class="control" id="p-old" type="password" dir="ltr"></div>'
        + '<div><label class="adm-label">رمز جدید (حداقل ۸ کاراکتر)</label><input class="control" id="p-new" type="password" dir="ltr"></div></div>'
        + '<button type="button" class="btn btn-ghost btn-sm" id="p-save" style="margin-top:16px">تغییر رمز</button>'
        + '<p class="adm-hint" style="margin-top:12px">در حالت ابری (ورسل) نام کاربری و رمز از همین بخش و به‌صورت واقعی تغییر می‌کند؛ حالا در دمو فقط رمز همین مرورگر عوض می‌شود.</p></div>')
      + '</div>'
      + '<div class="adm-panel" style="margin-top:18px"><div class="adm-panel-head"><b>اعلان فوری پیام‌ها (تلگرام) — اختیاری اما پیشنهادشده</b></div>'
      + '<p class="adm-hint" style="margin-bottom:12px">اگر این بخش را یک‌بار تنظیم کنی، هر پیام یا درخواستی که مشتری در سایت ثبت می‌کند، همان لحظه به تلگرام تو می‌آید (نام، شماره، پکیج، بودجه و متن پیام). حتی بدون این تنظیم، همهٔ پیام‌ها در بخش «پیام‌ها و درخواست‌ها» پنل ضبط می‌شوند و از همان‌جا دکمهٔ «پاسخ در واتس‌اپ» برای جواب سریع داری.</p>'
      + '<ol class="adm-hint" style="padding-inline-start:20px; display:grid; gap:8px">'
      + '<li>در تلگرام به <b dir="ltr">@BotFather</b> پیام بده، دستور <b dir="ltr">/newbot</b> را بزن و ربات بساز؛ توکن (شبیه <b dir="ltr">123456:ABC-DEF…</b>) را کپی کن.</li>'
      + '<li>به <b dir="ltr">@userinfobot</b> پیام بده تا «Id» چت خودت را بگیری (یک عدد مثل <b dir="ltr">123456789</b>).</li>'
      + '<li>در داشبورد ورسل → پروژهٔ کافه‌دانش → <b>Settings → Environment Variables</b> دو متغیر بساز: <b dir="ltr">TELEGRAM_BOT_TOKEN</b> و <b dir="ltr">TELEGRAM_CHAT_ID</b> و مقادیر را وارد کن.</li>'
      + '<li>در تب Deployments یک Redeploy بزن. تمام — از این به بعد پیام‌ها همان لحظه به تلگرامت می‌رسد.</li>'
      + '</ol></div>'
      + (isCloud() ? '<div class="adm-panel" style="margin-top:18px"><div class="adm-panel-head"><b>پشتیبان‌گیری داده‌های ابری</b><span class="chip">پیشنهادشده</span></div>'
        + '<p class="adm-hint" style="margin-bottom:12px">کل مقالات، پیام‌ها، صفحات و فهرست رسانه از فضای ابری دریافت و به‌صورت یک فایل JSON دانلود می‌شود. این فایل را هر از گاهی در جای امن نگه دارید.</p>'
        + '<button type="button" class="btn btn-ghost btn-sm" id="c-export">خروجی کامل داده‌های ابری (JSON)</button></div>' : '')
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
    const uSave = $('#u-save');
    if (uSave) uSave.addEventListener('click', async () => {
      const oldPass = $('#u-old').value;
      const newUsername = $('#u-new').value.trim();
      const newPass = $('#u-newpass').value;
      if (!oldPass) { alert('رمز فعلی را وارد کنید.'); return; }
      if (!newUsername && !newPass) { alert('نام کاربری یا رمز جدید را وارد کنید.'); return; }
      if (newPass && newPass.length < 8) { alert('رمز جدید حداقل ۸ کاراکتر باشد.'); return; }
      uSave.disabled = true;
      try {
        const r = await fetch('api/login', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: oldPass, username: newUsername, newPassword: newPass }),
        });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.ok) {
          $('#u-old').value = $('#u-newpass').value = '';
          toast(d.message || 'اعتبارنامه به‌روزرسانی شد');
          if (newUsername) CDStore.saveSettings({ adminUser: newUsername });
        } else if (r.status === 401) {
          CDStore.logout(); location.replace('/admin-login');
        } else {
          alert(d.message || d.error || 'تغییر انجام نشد.');
        }
      } catch (e) { alert('ارتباط با سرور برقرار نشد.'); }
      uSave.disabled = false;
    });
    const pSave = $('#p-save');
    if (pSave) pSave.addEventListener('click', () => {
      const old = $('#p-old').value, nw = $('#p-new').value;
      if (old !== (CDStore.settings().adminPass || 'cdanesh1404')) { alert('رمز فعلی درست نیست.'); return; }
      if (nw.length < 8) { alert('رمز جدید حداقل ۸ کاراکتر باشد.'); return; }
      CDStore.saveSettings({ adminPass: nw });
      $('#p-old').value = $('#p-new').value = '';
      toast('رمز مدیر تغییر کرد');
    });
    const cExport = $('#c-export');
    if (cExport) cExport.addEventListener('click', async () => {
      cExport.disabled = true; cExport.textContent = 'در حال دریافت از ابر…';
      const grab = async (u, k) => {
        try { const r = await fetch(u, { headers: { Accept: 'application/json' } }); const d = await r.json().catch(() => ({})); return (d && d.ok && d[k]) ? d[k] : []; }
        catch (e) { return []; }
      };
      const [arts, msgs, pgs, media] = await Promise.all([
        grab('api/articles', 'articles'), grab('api/messages', 'messages'), grab('api/pages', 'pages'), grab('api/media', 'media'),
      ]);
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), articles: arts, messages: msgs, pages: pgs, media }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'cdanesh-cloud-backup.json';
      a.click();
      URL.revokeObjectURL(a.href);
      cExport.disabled = false; cExport.textContent = 'خروجی کامل داده‌های ابری (JSON)';
      toast('پشتیبان کامل دانلود شد');
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

  /* ═════════════ نمودارها (SVG خالص — بدون کتابخانه) ═════════════ */
  function barChartSvg(values, labels, color, opts) {
    opts = opts || {};
    const W = 560, H = 190, pad = 26, gap = 8;
    const n = values.length || 1;
    const max = Math.max.apply(null, values.concat([1]));
    const bw = (W - pad * 2 - gap * (n - 1)) / n;
    const bars = values.map((v, i) => {
      const h = Math.round((v / max) * (H - pad - 40));
      const x = pad + i * (bw + gap);
      const y = H - 30 - h;
      return '<g><rect x="' + x + '" y="' + y + '" width="' + Math.max(4, bw) + '" height="' + Math.max(2, h) + '" rx="5" fill="' + color + '" opacity="' + (v ? '.85' : '.18') + '"></rect>'
        + (v ? '<text x="' + (x + bw / 2) + '" y="' + (y - 7) + '" font-size="11" fill="var(--mut)" text-anchor="middle">' + fa(v) + '</text>' : '')
        + (labels[i] ? '<text x="' + (x + bw / 2) + '" y="' + (H - 10) + '" font-size="9.5" fill="var(--faint)" text-anchor="middle">' + esc(labels[i]) + '</text>' : '')
        + '</g>';
    }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%; height:auto" role="img">' + bars + '</svg>';
  }

  function hBarSvg(rows) {
    const max = Math.max.apply(null, rows.map(r => r[1]).concat([1]));
    return rows.map(r =>
      '<div style="margin-bottom:12px"><div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:5px"><span class="muted">' + esc(r[0]) + '</span><b>' + fa(r[1]) + '</b></div>'
      + '<div class="adm-meter"><i style="width:' + Math.round(r[1] / max * 100) + '%; background:' + r[2] + '"></i></div></div>'
    ).join('');
  }

  /* بنر راهنمای اتصال فضای ابری — وقتی Blob یا رمز تنظیم نشده باشد نمایش داده می‌شود */
  const SETUP = { probed: false, blob: null, pass: null };

  function probeCloud() {
    return Promise.all([
      fetch('api/login', { headers: { Accept: 'application/json' } })
        .then(r => {
          if (r.status === 503) { SETUP.pass = false; return r.json().catch(() => ({})); }
          if (r.ok || r.status === 401) { SETUP.pass = true; return {}; }
          SETUP.pass = false; return {};
        })
        .catch(() => { SETUP.pass = false; return {}; }),
      fetch('api/articles?scope=public', { headers: { Accept: 'application/json' } })
        .then(async r => {
          const d = await r.json().catch(() => ({}));
          SETUP.blob = !(r.status === 503 && d.error === 'NO_BLOB');
        })
        .catch(() => { SETUP.blob = false; }),
    ]).then(() => {
      SETUP.probed = true;
      updateStorBadge();
      // اگر نمای جاری از بنر راهنما پشتیبانی می‌کند، با وضعیت قطعی دوباره رندر شود
      const h = (location.hash || '#/dashboard').replace(/^#\//, '');
      const mod = h.split('/')[0];
      if (mod === 'dashboard' || mod === '') renderDashboard();
      else if (mod === 'articles' && !h.includes('edit') && !h.includes('new')) renderArticles();
      else if (mod === 'messages') renderMessages();
      else if (mod === 'payments') renderPayments();
    });
  }

  function setupBannerHtml() {
    if (!SETUP.probed || (SETUP.blob && SETUP.pass)) return '';
    const step1 = '<div class="adm-setup-step"><b>گام ۱ — اتصال فضای ابری (Blob)</b><span>ورسل → پروژهٔ cdanesh → تب <b>Storage</b> → <b>Create Database</b> → نوع <b>Blob</b> → نام <b dir="ltr">cdanesh-content</b> → <b>Connect to Project</b>. تا زمانی که این کار انجام نشود، مقالات و پیام‌ها فقط در همین مرورگر ذخیره می‌شوند.</span></div>';
    const step2 = '<div class="adm-setup-step"><b>گام ۲ — تعیین رمز مدیر</b><span>ورسل → تب <b>Settings</b> → <b>Environment Variables</b> → متغیر جدید: نام <b dir="ltr">ADMIN_PASSWORD</b> و مقدار یک رمز قوی (حداقل ۱۰ کاراکتر) → تیک Production و Preview → Save.</span></div>';
    const step3 = '<div class="adm-setup-step"><b>گام ۳ — انتشار مجدد</b><span>ورسل → تب <b>Deployments</b> → آخرین دیپلوی → <b>⋯</b> → <b>Redeploy</b>. بعد از ۲–۳ دقیقه، خروج بزنید و با رمز ابری وارد شوید — از این لحظه مقالات، پیام‌ها، صفحات و رسانه واقعی و برای همه منتشر می‌شوند.</span></div>';
    return '<div class="adm-panel adm-setup" style="margin-bottom:18px; border:1px solid rgba(232,194,104,.55); background:linear-gradient(150deg,rgba(232,194,104,.1),rgba(232,194,104,.03))">'
      + '<div class="adm-panel-head"><b>⚠ فعال‌سازی انتشار واقعی (یک‌بار برای همیشه — حدود ۵ دقیقه)</b></div>'
      + '<p class="adm-hint" style="margin-bottom:14px">الان در <b>حالت آزمایشی</b> هستید: مقاله‌ای که منتشر می‌کنید فقط در همین مرورگر دیده می‌شود و پیام فرم‌ها ذخیره ابری ندارد. با این سه گام، همه‌چیز واقعی می‌شود:</p>'
      + step1 + step2 + step3
      + '<div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-top:14px">'
      + '<button type="button" class="btn btn-gold btn-sm" id="setup-recheck">بررسی دوبارهٔ وضعیت</button>'
      + '<span class="adm-hint" id="setup-status">' + (!SETUP.blob ? 'فضای ابری: متصل نیست' : 'فضای ابری: متصل ✓') + ' · ' + (!SETUP.pass ? 'رمز مدیر: ثبت نشده' : 'رمز مدیر: ثبت ✓') + '</span>'
      + '</div></div>';
  }

  function bindSetupRecheck() {
    const b = $('#setup-recheck');
    if (!b) return;
    b.addEventListener('click', async () => {
      b.disabled = true; b.textContent = 'در حال بررسی…';
      await probeCloud();
      const mod = (location.hash || '#/dashboard').replace(/^#\//, '').split('/')[0];
      if (mod === 'dashboard' || mod === '') renderDashboard();
      else if (mod === 'articles') renderArticles();
      else if (mod === 'messages') renderMessages();
      else if (mod === 'pages') renderPages();
      else if (mod === 'payments') renderPayments();
      if (SETUP.blob && SETUP.pass) toast('اتصال ابری فعال است — با خروج و ورود مجدد با رمز ابری، حالت واقعی شروع می‌شود');
    });
  }

  /* ═════════════ داشبورد ═════════════ */
  function renderDashboard() {
    swapView();
    const arts = allArticles();
    const pub = arts.filter(a => (a.status || 'published') === 'published').length;
    const drafts = arts.filter(a => a.status === 'draft').length;
    const sched = arts.filter(a => a.status === 'scheduled').length;
    const msgs = msgList;
    const newMsgs = unreadCount();
    const kpi = (ico, lbl, val) =>
      '<div class="admin-card adm-kpi"><span class="ico">' + ico + '</span><div><small>' + lbl + '</small><b>' + fa(val) + '</b></div></div>';
    const icoDoc = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>';
    const icoMsg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20l1-4.9a8.4 8.4 0 1 1 17-3.6Z"/></svg>';
    const icoPf = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="3"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

    /* نمودار ۱: پیام‌های ۱۴ روز اخیر */
    const days = [], counts = [], labels = [];
    const faShort = d => fa(d.getDate());
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      days.push(d);
      counts.push(msgs.filter(m => { const t = new Date(m.date); return t >= d && t < next; }).length);
      labels.push(i % 2 === 0 ? faShort(d) : '');
    }
    /* نمودار ۲: مقالات به تفکیک دسته */
    const catColors = { seo: '#8a6cf0', design: '#e3b953', content: '#58c98b', performance: '#6ec3e8', ai: '#e58a6a' };
    const catRows = Object.keys(catColors).map(k => [
      (CDArticles.CATS.find(c => c.key === k) || { label: k }).label,
      arts.filter(a => a.cat === k).length,
      catColors[k],
    ]);

    view.innerHTML = setupBannerHtml()
      + '<div class="adm-topbar"><div><h1>سلام مدیر کافه‌دانش</h1><p class="lead">خلاصه وضعیت محتوا، پیام‌ها و سایت</p></div>'
      + '<div class="adm-actions"><a class="btn btn-gold" href="#/articles/new">+ مقاله جدید</a><a class="btn btn-ghost" href="/" target="_blank">مشاهده سایت</a></div></div>'
      + '<div class="admin-stat">'
      + kpi(icoDoc, 'مقالات منتشرشده', pub)
      + kpi(icoDoc, 'پیش‌نویس و زمان‌بندی', drafts + sched)
      + kpi(icoMsg, 'پیام‌های جدید', newMsgs)
      + kpi(icoPf, 'نمونه‌کارهای فعال', CD_PORTFOLIO.length)
      + '</div>'
      + '<div class="admin-card" style="margin-top:18px"><div style="padding:18px 20px; border-bottom:1px solid var(--line)"><b style="font-size:14.5px">پیام‌های دریافتی — ۱۴ روز اخیر</b></div><div style="padding:18px 20px">'
      + barChartSvg(counts, labels, '#e3b953')
      + '</div></div>'
      + '<div class="adm-grid2" style="margin-top:18px">'
      + '<div class="admin-card" style="padding:0; overflow:hidden"><div style="padding:18px 20px; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; align-items:center"><b style="font-size:14.5px">آخرین پیام‌ها</b><a href="#/messages" class="link-more" style="font-size:12.5px">همه پیام‌ها</a></div>'
      + (msgs.length
        ? '<table class="admin-table"><thead><tr><th>نام</th><th>نوع</th><th>تاریخ</th><th>وضعیت</th></tr></thead><tbody>'
          + msgs.slice(0, 5).map(m => '<tr><td>' + esc(m.name || '—') + '</td><td>' + (m.kind === 'request' ? 'درخواست' : 'تماس') + '</td><td style="direction:ltr; text-align:right; font-size:12px">' + faDate(m.date) + '</td><td><span class="status-pill ' + (m.status === 'new' ? 'st-new' : 'st-draft') + '">' + (m.status === 'new' ? 'جدید' : 'پیگیری‌شده') + '</span></td></tr>').join('')
          + '</tbody></table>'
        : '<div class="adm-empty">هنوز پیامی ثبت نشده است. یک تست از فرم تماس بفرستید تا اینجا ببینید.</div>')
      + '</div>'
      + '<div class="admin-card" style="padding:0; overflow:hidden"><div style="padding:18px 20px; border-bottom:1px solid var(--line)"><b style="font-size:14.5px">مقالات به تفکیک دسته</b></div><div style="padding:20px">'
      + hBarSvg(catRows)
      + '<div style="margin-top:18px">'
      + [['منتشرشده', pub, 'var(--ok)'], ['پیش‌نویس', drafts, 'var(--gold)'], ['زمان‌بندی‌شده', sched, '#7f7fe0']].map(([l, n, c]) =>
        '<div style="margin-bottom:12px"><div style="display:flex; justify-content:space-between; font-size:12.5px; margin-bottom:6px"><span class="muted">' + l + '</span><b>' + fa(n) + '</b></div><div class="adm-meter"><i style="width:' + (arts.length ? Math.round(n / arts.length * 100) : 0) + '%; background:' + c + '"></i></div></div>').join('')
      + '</div>'
      + '<a class="btn btn-ghost btn-sm btn-block" href="#/articles" style="margin-top:8px">مدیریت مقالات</a></div></div>'
      + '</div>'
      + '<div class="adm-panel" style="margin-top:18px"><div class="adm-panel-head"><b>' + (isCloud() ? 'وضعیت انتشار و ذخیره‌سازی' : 'راهنمای سریع پنل') + '</b></div>'
      + (isCloud()
        ? '<p class="adm-hint">اتصال ابری فعال است: مقاله‌ها، پیام‌های فرم‌ها، صفحات و رسانه در فضای ابری ورسل (Vercel Blob) ذخیره می‌شوند — «انتشار» به‌معنای نمایش فوری برای همه بازدیدکنندگان و گوگل است. پیش‌نویس‌ها فقط با لینک پیش‌نمایش دیده می‌شوند.</p>'
        : '<p class="adm-hint">حالت آزمایشی (بدون سرور): تغییرات فقط در همین مرورگر ذخیره می‌شوند. بنر زودهنگام بالای همین صفحه، سه گام اتصال ابری را توضیح می‌دهد.</p>')
      + '</div>';
    bindSetupRecheck();
  }

  /* ═════════════ مسیریابی ═════════════ */
  function route() {
    const h = (location.hash || '#/dashboard').replace(/^#\//, '');
    const [mod, ...rest] = h.split('/');
    $$('.admin-side nav a').forEach(a => a.classList.toggle('active', a.dataset.nav === (mod || 'dashboard')));

    if (mod === 'articles' && rest[0] === 'new') return renderArticleEditor(null);
    if (mod === 'articles' && rest[0] === 'edit') return renderArticleEditor(decodeURIComponent(rest[1] || ''));
    if (mod === 'pages' && rest[0] === 'new') return renderPageEditor(null);
    if (mod === 'pages' && rest[0] === 'edit') return renderPageEditor(decodeURIComponent(rest[1] || ''));
    switch (mod) {
      case 'articles': return renderArticles();
      case 'media': return renderMedia();
      case 'pages': return renderPages();
      case 'portfolio': return renderPortfolio();
      case 'faq': return renderFaq();
      case 'messages': return renderMessages();
      case 'payments': return renderPayments();
      case 'seo': return renderSeo();
      case 'performance': return renderPerformance();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  }

  $('#adm-logout').addEventListener('click', () => {
    try { fetch('api/login', { method: 'DELETE' }).catch(() => {}); } catch (e) { /* noop */ }
    CDStore.logout();
    location.replace('/admin-login');
  });

  window.addEventListener('hashchange', () => { route(); window.scrollTo({ top: 0 }); });

  /* ─── نشان وضعیت ذخیره‌سازی + بارگذاری پیام‌ها و درگاه از سرور + بازرندر ─── */
  updateStorBadge();
  updateMsgBadge();
  probeCloud(); // وضعیت اتصال ابری → بنر راهنمای سه‌گامی

  // پیام‌ها: ابتدا از سرور (ابری)، سپس بازرندر نمای جاری
  loadMessages().then(() => {
    updateMsgBadge();
    const mod = (location.hash || '#/dashboard').replace(/^#\//, '').split('/')[0];
    if (mod === 'messages') renderMessages();
    else if (mod === 'dashboard' || mod === '') renderDashboard();
  });

  // درگاه پرداخت: بارگذاری فهرست و بازرندر اگر همین نما باز است
  loadPayments().then(() => {
    const mod = (location.hash || '#/dashboard').replace(/^#\//, '').split('/')[0];
    if (mod === 'payments') renderPayments();
  });

  if (window.CDArticles && CDArticles.subscribe) {
    CDArticles.subscribe(() => {
      updateStorBadge();
      const h = (location.hash || '#/dashboard').replace(/^#\//, '');
      const mod = h.split('/')[0];
      if (mod === 'articles' && !h.includes('edit') && !h.includes('new')) renderArticles();
      else if (mod === 'dashboard' || mod === '') renderDashboard();
    });
  }
  route();
})();
