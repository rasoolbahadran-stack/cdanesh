/* ═══════════════════════════════════════════════
   کافه‌دانش — اسکریپت مشترک پنل مدیریت
   API helper، توست، تأیید، مودال، انتخابگر رسانه، ویرایشگر RTL، ذخیره خودکار
   ═══════════════════════════════════════════════ */

export interface ApiResponse {
  ok: boolean;
  message?: string;
  error?: string;
  data?: unknown;
}

/* ---------- API helper: همیشه نتیجه واقعی سرور ---------- */
export async function api(url: string, method = 'GET', body?: unknown): Promise<ApiResponse> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const j = await res.json().catch(() => ({ ok: false, message: 'پاسخ نامعتبر از سرور' }));
    return j as ApiResponse;
  } catch {
    return { ok: false, message: 'خطای شبکه؛ اتصال سرور را بررسی کنید' };
  }
}

/* ---------- توست ---------- */
export function toast(msg: string, kind: 'ok' | 'err' = 'ok') {
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
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; setTimeout(() => t.remove(), 420); }, 4600);
}

/* ---------- تأیید حذف ---------- */
export function confirmDlg(message: string, onYes: () => void) {
  const scrim = document.createElement('div');
  scrim.className = 'modal-scrim open';
  scrim.innerHTML = `
    <div class="modal" style="width:min(430px,100%)">
      <div class="modal-head"><h3>تأیید عملیات</h3></div>
      <div class="modal-body"><p style="margin:0">${message}</p>
        <div style="display:flex;gap:10px;margin-top:18px">
          <button class="btn btn-danger" data-yes>بله، انجام بده</button>
          <button class="btn btn-ghost" data-no>انصراف</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(scrim);
  scrim.querySelector('[data-yes]')!.addEventListener('click', () => { scrim.remove(); onYes(); });
  scrim.querySelector('[data-no]')!.addEventListener('click', () => scrim.remove());
  scrim.addEventListener('click', (e) => { if (e.target === scrim) scrim.remove(); });
}

/* ---------- انتخابگر رسانه ---------- */
let mediaPickerCb: ((url: string) => void) | null = null;

export function openMediaPicker(cb: (url: string) => void) {
  mediaPickerCb = cb;
  let scrim = document.getElementById('media-picker') as HTMLElement | null;
  if (!scrim) {
    scrim = document.createElement('div');
    scrim.id = 'media-picker';
    scrim.className = 'modal-scrim';
    scrim.innerHTML = `
      <div class="modal">
        <div class="modal-head">
          <h3>کتابخانه رسانه</h3>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="file" id="mp-file" accept="image/*" style="display:none" />
            <button class="btn btn-gold btn-sm" id="mp-upload">＋ بارگذاری تصویر</button>
            <button class="btn btn-ghost btn-sm" data-close>بستن</button>
          </div>
        </div>
        <div class="modal-body"><div class="media-grid" id="mp-grid"></div><div id="mp-empty" class="empty-state" style="display:none"><div class="big">🖼</div>هنوز تصویری بارگذاری نشده است</div></div>
      </div>`;
    document.body.appendChild(scrim);
    scrim.querySelector('[data-close]')!.addEventListener('click', () => scrim!.classList.remove('open'));
    scrim.addEventListener('click', (e) => { if (e.target === scrim) scrim!.classList.remove('open'); });
    scrim.querySelector('#mp-upload')!.addEventListener('click', () => (scrim!.querySelector('#mp-file') as HTMLInputElement).click());
    scrim.querySelector('#mp-file')!.addEventListener('change', async (e) => {
      const input = e.target as HTMLInputElement;
      if (!input.files?.length) return;
      const fd = new FormData();
      fd.append('file', input.files[0]);
      toast('در حال بارگذاری تصویر…');
      try {
        const res = await fetch('/api/admin/media', { method: 'POST', body: fd });
        const j = await res.json();
        if (j.ok) { toast(j.message || 'تصویر بارگذاری شد'); loadMedia(); }
        else toast(j.message || 'بارگذاری ناموفق بود', 'err');
      } catch { toast('خطای شبکه در بارگذاری', 'err'); }
      input.value = '';
    });
  }
  loadMedia();
  scrim.classList.add('open');
}

async function loadMedia() {
  const grid = document.querySelector('#mp-grid') as HTMLElement;
  const empty = document.querySelector('#mp-empty') as HTMLElement;
  if (!grid) return;
  const j = await api('/api/admin/media');
  grid.innerHTML = '';
  const items = Array.isArray(j.data) ? (j.data as { id: number; url: string; filename: string; alt: string }[]) : [];
  empty.style.display = items.length ? 'none' : 'block';
  items.forEach((m) => {
    const el = document.createElement('div');
    el.className = 'media-item';
    el.innerHTML = `<img src="${m.url}" alt="${m.alt || m.filename}" loading="lazy" /><div class="mi-name">${m.filename}</div><button class="mi-del" title="حذف">🗑</button>`;
    el.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('mi-del')) {
        confirmDlg('این تصویر برای همیشه حذف شود؟', async () => {
          const r = await api(`/api/admin/media?id=${m.id}`, 'DELETE');
          if (r.ok) { toast(r.message || 'حذف شد'); loadMedia(); } else toast(r.message || 'حذف ناموفق بود', 'err');
        });
        return;
      }
      scrimById('media-picker').classList.remove('open');
      if (mediaPickerCb) mediaPickerCb(m.url);
      mediaPickerCb = null;
    });
    grid.appendChild(el);
  });
}

function scrimById(id: string): HTMLElement { return document.getElementById(id)!; }

/* ---------- ویرایشگر محتوا RTL ---------- */
const ED_TOOLBAR: { cmd?: string[]; val?: string; html: string; title: string; action?: string }[] = [
  { cmd: ['undo'], html: '↺', title: 'واگرد' },
  { cmd: ['redo'], html: '↻', title: 'ازنو' },
  { html: '<span class="lbl">H2</span>', title: 'تیتر اصلی بخش', cmd: ['formatBlock'], val: 'H2' },
  { html: '<span class="lbl">H3</span>', title: 'تیتر فرعی', cmd: ['formatBlock'], val: 'H3' },
  { html: '<span class="lbl">P</span>', title: 'پاراگراف', cmd: ['formatBlock'], val: 'P' },
  { html: '', title: '', cmd: undefined, action: 'sep' },
  { cmd: ['bold'], html: 'B', title: 'پررنگ' },
  { cmd: ['italic'], html: 'I', title: 'مورب' },
  { cmd: ['insertUnorderedList'], html: '•', title: 'فهرست نقطه‌ای' },
  { cmd: ['insertOrderedList'], html: '۱.', title: 'فهرست شماره‌دار' },
  { action: 'quote', html: '❝', title: 'نقل‌قول' },
  { html: '', title: '', cmd: undefined, action: 'sep' },
  { action: 'link', html: '🔗', title: 'درج لینک' },
  { action: 'image', html: '🖼 تصویر', title: 'افزودن تصویر از کتابخانه رسانه' },
  { action: 'table', html: '▦', title: 'درج جدول' },
  { action: 'cta', html: '🔘', title: 'درج دکمه فراخوان (CTA)' },
  { cmd: ['insertHorizontalRule'], html: '―', title: 'خط جداکننده' },
  { html: '', title: '', cmd: undefined, action: 'sep' },
  { action: 'clean', html: '🧹', title: 'پاک‌سازی فرمت' },
  { action: 'source', html: '<span class="lbl">&lt;/&gt;</span>', title: 'مشاهده کد HTML' },
];

export function initEditor(containerId: string, initialHtml = ''): { getHtml: () => string; setHtml: (h: string) => void; onChange: (cb: () => void) => void } {
  const root = document.getElementById(containerId);
  if (!root) throw new Error('editor container missing');
  root.innerHTML = `
    <div class="editor-toolbar"></div>
    <div class="editor-area" contenteditable="true" data-placeholder="محتوای صفحه را اینجا بنویسید…"></div>
    <textarea class="html-source" spellcheck="false" style="display:none;width:100%;min-height:360px;padding:14px;direction:ltr;text-align:left;font:13px/1.8 Consolas,monospace;background:#faf9ff;border:1px solid var(--a-line);border-radius:0 0 10px 10px;tab-size:2"></textarea>
    <div class="editor-footer">
      <span class="ed-count">۰ کلمه</span>
      <span class="ed-status"></span>
    </div>`;

  const toolbar = root.querySelector('.editor-toolbar') as HTMLElement;
  const area = root.querySelector('.editor-area') as HTMLElement;
  const source = root.querySelector('.html-source') as HTMLTextAreaElement;
  const count = root.querySelector('.ed-count') as HTMLElement;
  const status = root.querySelector('.ed-status') as HTMLElement;
  let changeCb: (() => void) | null = null;
  let sourceMode = false;
  let sourceEditor: any = null;
  let codeMirrorLoad: Promise<boolean> | null = null;

  const CODEMIRROR_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/';
  function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('CodeMirror script failed: ' + src));
      document.head.appendChild(script);
    });
  }

  function ensureCodeMirror(): Promise<boolean> {
    if ((window as any).CodeMirror) return Promise.resolve(true);
    if (!codeMirrorLoad) {
      codeMirrorLoad = (async () => {
        const cssId = 'cdanesh-codemirror-css';
        if (!document.getElementById(cssId)) {
          const link = document.createElement('link');
          link.id = cssId;
          link.rel = 'stylesheet';
          link.href = CODEMIRROR_BASE + 'codemirror.min.css';
          document.head.appendChild(link);
        }
        await loadScript(CODEMIRROR_BASE + 'codemirror.min.js');
        await loadScript(CODEMIRROR_BASE + 'mode/xml/xml.min.js');
        await loadScript(CODEMIRROR_BASE + 'mode/javascript/javascript.min.js');
        await loadScript(CODEMIRROR_BASE + 'mode/css/css.min.js');
        await loadScript(CODEMIRROR_BASE + 'mode/htmlmixed/htmlmixed.min.js');
        return !!(window as any).CodeMirror;
      })().catch(() => false);
    }
    return codeMirrorLoad;
  }

  ED_TOOLBAR.forEach((t) => {
    if (t.action === 'sep') {
      const sep = document.createElement('span');
      sep.className = 'ed-sep';
      toolbar.appendChild(sep);
      return;
    }
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ed-btn';
    b.title = t.title;
    b.innerHTML = t.html;
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', () => {
      if (t.action === 'link') {
        const sel = window.getSelection();
        const txt = sel?.toString() || '';
        const url = window.prompt('آدرس لینک (مثلاً /services یا https://…):', '/');
        if (!url) return;
        if (txt && document.queryCommandSupported('createLink')) {
          document.execCommand('createLink', false, url);
        } else {
          document.execCommand('insertHTML', false, `<a href="${url}">${txt || 'متن لینک'}</a>`);
        }
      } else if (t.action === 'image') {
        area.focus();
        const currentSelection = window.getSelection();
        const savedRange = currentSelection && currentSelection.rangeCount
          ? currentSelection.getRangeAt(0).cloneRange()
          : null;
        openMediaPicker((url) => {
          const alt = window.prompt('متن جایگزین تصویر (Alt):', '') || 'تصویر';
          const safeUrl = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
          const safeAlt = alt.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
          const html = `<img src="${safeUrl}" alt="${safeAlt}" loading="lazy" />`;
          if (sourceMode) {
            if (sourceEditor) {
              sourceEditor.replaceSelection(html);
            } else {
              const start = source.selectionStart;
              source.setRangeText(html, start, source.selectionEnd, 'end');
            }
            markDirty();
            return;
          }
          area.focus();
          if (savedRange) {
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(savedRange);
          }
          document.execCommand('insertHTML', false, html);
          markDirty();
        });
        return;
      } else if (t.action === 'table') {
        const html = `<table><thead><tr><th>ستون ۱</th><th>ستون ۲</th><th>ستون ۳</th></tr></thead><tbody><tr><td>مقدار</td><td>مقدار</td><td>مقدار</td></tr><tr><td>مقدار</td><td>مقدار</td><td>مقدار</td></tr></tbody></table><p></p>`;
        document.execCommand('insertHTML', false, html);
      } else if (t.action === 'cta') {
        const text = window.prompt('متن دکمه:', 'درخواست مشاوره رایگان') || 'دکمه';
        const href = window.prompt('لینک دکمه:', '/consult') || '/consult';
        document.execCommand('insertHTML', false, `<p><a class="cta-btn" href="${href}">${text}</a></p>`);
      } else if (t.action === 'quote') {
        document.execCommand('formatBlock', false, 'BLOCKQUOTE');
      } else if (t.action === 'clean') {
        document.execCommand('removeFormat');
        document.execCommand('formatBlock', false, 'P');
      } else if (t.action === 'source') {
        if (!sourceMode) {
          source.value = area.innerHTML;
          area.style.display = 'none';
          source.style.display = 'block';
          const useCodeMirror = await ensureCodeMirror();
          if (useCodeMirror) {
            if (!sourceEditor) {
              sourceEditor = (window as any).CodeMirror.fromTextArea(source, {
                mode: 'htmlmixed',
                lineNumbers: true,
                lineWrapping: true,
                indentUnit: 2,
                tabSize: 2,
                viewportMargin: Infinity,
              });
              sourceEditor.on('change', () => {
                source.value = sourceEditor.getValue();
                markDirty();
              });
            } else {
              sourceEditor.setValue(area.innerHTML);
            }
            sourceEditor.getWrapperElement().style.display = 'block';
            sourceEditor.refresh();
            source.style.display = 'none';
            status.textContent = 'ویرایش مستقیم HTML · CodeMirror';
          } else {
            source.value = area.innerHTML;
            source.style.display = 'block';
            status.textContent = 'CodeMirror بارگذاری نشد؛ ویرایش متنی فعال است';
          }
          sourceMode = true;
        } else {
          const html = sourceEditor ? sourceEditor.getValue() : source.value;
          area.innerHTML = html;
          source.value = html;
          if (sourceEditor) sourceEditor.getWrapperElement().style.display = 'none';
          source.style.display = 'none';
          area.style.display = 'block';
          sourceMode = false;
          markDirty();
        }
        return;
      } else if (t.cmd) {
        area.focus();
        document.execCommand(t.cmd[0], false, t.val ?? undefined);
      }
      markDirty();
    });
    toolbar.appendChild(b);
  });

  function markDirty() {
    status.textContent = '● تغییرات ذخیره‌نشده';
    status.style.color = 'var(--a-amber)';
    if (changeCb) changeCb();
    updateCount();
  }

  function updateCount() {
    const words = area.textContent?.trim().split(/\s+/).filter(Boolean).length ?? 0;
    count.textContent = `${String(words).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])} کلمه`;
  }

  area.addEventListener('input', () => { markDirty(); });
  source.addEventListener('input', () => { markDirty(); });
  area.addEventListener('blur', updateCount);

  area.innerHTML = initialHtml;
  updateCount();

  return {
    getHtml: () => (sourceMode ? (sourceEditor ? sourceEditor.getValue() : source.value) : area.innerHTML),
    setHtml: (h: string) => {
      const value = h || '';
      area.innerHTML = value;
      source.value = value;
      if (sourceEditor) sourceEditor.setValue(value);
      updateCount();
    },
    onChange: (cb: () => void) => { changeCb = cb; },
    setStatus: (txt: string, okFlag = true) => {
      status.textContent = txt;
      status.style.color = okFlag ? 'var(--a-green)' : 'var(--a-amber)';
    },
  } as ReturnType<typeof initEditor> & { setStatus: (t: string, ok?: boolean) => void };
}

/* ---------- کمکی فرم: تبدیل خطوط به آرایه و برعکس ---------- */
export function linesToArray(v: string): string[] {
  return v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}
export function arrayToLines(v: unknown): string {
  return Array.isArray(v) ? (v as string[]).join('\n') : '';
}

/* ---------- تاریخ و اعداد فارسی ---------- */
export const faNum = (n: string | number) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);

/* ثبت در پنجره برای استفاده صفحات */
declare global {
  interface Window {
    CDA: {
      api: typeof api;
      toast: typeof toast;
      confirmDlg: typeof confirmDlg;
      openMediaPicker: typeof openMediaPicker;
      initEditor: typeof initEditor;
      linesToArray: typeof linesToArray;
      arrayToLines: typeof arrayToLines;
      faNum: typeof faNum;
    };
  }
}
window.CDA = { api, toast, confirmDlg, openMediaPicker, initEditor, linesToArray, arrayToLines, faNum };

/* ---------- رفتار مشترک پنل: سایدبار ---------- */
(function sidebarInit() {
  document.addEventListener('DOMContentLoaded', () => {
    const layout = document.querySelector('.admin-layout');
    const toggle = document.querySelector('.side-collapse');
    const openBtn = document.querySelector('.side-open-m');
    const scrim = document.querySelector('.side-scrim');
    if (!layout) return;
    const saved = localStorage.getItem('cd_side') || 'open';
    if (saved === 'collapsed' && window.innerWidth > 1080) layout.classList.add('side-collapsed');
    toggle?.addEventListener('click', () => {
      const collapsed = layout.classList.toggle('side-collapsed');
      localStorage.setItem('cd_side', collapsed ? 'collapsed' : 'open');
    });
    openBtn?.addEventListener('click', () => document.body.classList.add('side-open'));
    scrim?.addEventListener('click', () => document.body.classList.remove('side-open'));
  });
})();
