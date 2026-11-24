/* ==========================================================================
   کافه‌دانش — Sanitizer پارسرمحور HTML (بدون وابستگی خارجی)
   ---------------------------------------------------------------------------
   نسخهٔ قبلی با چند replace Regex کار می‌کرد؛ مشکلات واقعی آن:
   • جفت‌تگ‌های ممنوع (form/button/…) «همراه با کل محتوای متنی داخلشان» حذف
     می‌شدند و متن مجاز مقاله از بین می‌رفت.
   • تگ‌های ناقص (مانند <title بدون بستن) رفتار غیرقابل‌پیش‌بینی داشتند.
   این ماژول یک Tokenizer واقعی کاراکتربه‌کاراکتر است:
   • متن‌ها حفظ می‌شوند و «<» بدون حرف بعدی متن عادی است
   • نام تگ و attributeها با احترام به quoteها جدا می‌شوند
   • سیاست سه‌گانه: KEEP (تگ مجاز با فیلتر attributeها)، UNWRAP (تگ حذف،
     متن می‌ماند — مانند form/button)، DROP (تگ و محتوایش حذف — script/style)
   • event handlerها، javascript:/vbscript: و data: غیرتصویری مسدود می‌شوند
   خروجی همیشه رشته‌ای امن برای رندر در صفحهٔ عمومی است.
   ========================================================================== */

/** تگ‌های مجاز با محتوایشان — لیست ویرایشگر + ساختارهای مقاله */
const KEEP_TAGS = new Set([
  'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'b', 'i', 'u',
  'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'table', 'thead', 'tbody', 'tfoot',
  'tr', 'th', 'td', 'div', 'span', 'figure', 'figcaption', 'pre', 'code',
  'small', 'sub', 'sup', 'section', 'article', 'main', 'aside', 'header', 'footer', 'nav', 'caption',
  'details', 'summary',
]);

/** تگ‌هایی که «تگشان» حذف می‌شود ولی متن داخلشان می‌ماند (فرم/دکمه/پوسته) */
const UNWRAP_TAGS = new Set([
  'form', 'button', 'select', 'option', 'optgroup', 'textarea', 'label', 'input',
  'fieldset', 'legend', 'datalist', 'output', 'html', 'head', 'body', 'font', 'center',
]);

/** تگ‌هایی که «همراه با کل محتوایشان» حذف می‌شوند (کد اجرایی/استایل/جاگذاری).
     title هم اینجاست: متن عنوان سند محتوای مقاله نیست و نباید رندر شود. */
const DROP_TAGS = new Set(['script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'svg', 'math', 'title']);

/** تگ‌های بدون تگ پایانی */
const VOID_TAGS = new Set(['br', 'hr', 'img', 'input', 'area', 'base', 'col', 'source', 'track', 'wbr']);

/** attributeهای مجاز عمومی */
const KEEP_ATTRS = new Set([
  'alt', 'title', 'class', 'id', 'dir', 'lang', 'colspan', 'rowspan', 'width', 'height',
  'loading', 'decoding', 'start', 'type', 'rel', 'open', 'role', 'tabindex',
  'aria-label', 'aria-labelledby', 'aria-controls', 'aria-expanded', 'aria-hidden',
]);
/** attributeهای URL که پروتکلشان بررسی می‌شود */
const URL_ATTRS = new Set(['href', 'src', 'srcset', 'poster', 'cite']);

const SAFE_INLINE_STYLE_PROPERTIES = new Set([
  'color','background','background-color','border','border-top','border-right','border-bottom','border-left',
  'border-color','border-width','border-style','border-radius','box-shadow','padding','padding-top',
  'padding-right','padding-bottom','padding-left','padding-inline','padding-block','margin','margin-top',
  'margin-right','margin-bottom','margin-left','margin-inline','margin-block','font-size','font-weight',
  'font-family','font-style','line-height','text-align','text-decoration','text-underline-offset','direction',
  'display','width','min-width','max-width','height','min-height','max-height','aspect-ratio','object-fit',
  'object-position','overflow','overflow-x','overflow-y','vertical-align','align-items','justify-content',
  'gap','flex','flex-basis','flex-grow','flex-shrink','transition','transform','opacity','outline',
  'outline-offset','cursor','list-style','box-sizing',
]);

function splitCssDeclarations(value: string): string[] {
  const parts: string[] = [];
  let start = 0, depth = 0, quote = '', escaped = false;
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\\\' && quote) { escaped = true; continue; }
    if (quote) { if (ch === quote) quote = ''; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (ch === ';' && depth === 0) { parts.push(value.slice(start, i)); start = i + 1; }
  }
  parts.push(value.slice(start));
  return parts;
}

function safeCssValue(property: string, rawValue: string): string | null {
  const value = rawValue.trim();
  if (!value || /url\\s*\\(|expression|javascript:|vbscript:|data:|@import|behavior|binding/i.test(value)) return null;
  if (/[{}<>\\\\]/.test(value) || !/^[a-zA-Z0-9\\s#.,%()+*/:'"!_-]+$/.test(value)) return null;
  if (property.startsWith('--')) {
    if (!/^--content-image-(?:width|height|radius|fit)$/.test(property)) return null;
    if (!/^(?:auto|cover|contain|(?:\\d+(?:\\.\\d+)?)(?:px|%|rem|em))$/.test(value)) return null;
  } else if (!SAFE_INLINE_STYLE_PROPERTIES.has(property)) return null;
  return value;
}

function sanitizeInlineStyle(rawStyle: string): string {
  const declarations: string[] = [];
  for (const declaration of splitCssDeclarations(String(rawStyle || ''))) {
    const colon = declaration.indexOf(':');
    if (colon <= 0) continue;
    const property = declaration.slice(0, colon).trim().toLowerCase();
    if (!/^(?:[a-z][a-z-]*|--[a-z][a-z0-9-]*)$/.test(property)) continue;
    const value = safeCssValue(property, declaration.slice(colon + 1));
    if (value) declarations.push(`${property}: ${value}`);
  }
  return declarations.join('; ');
}

function safeUrl(value: string): string | null {
  const raw = String(value || '').trim().replace(/&amp;/g, '&');
  if (/^\s*(javascript|vbscript|file|blob|mhtml):/i.test(raw)) return null;
  if (/^\s*data:/i.test(raw) && !/^data:image\//i.test(raw)) return null;
  return raw;
}

interface Token {
  kind: 'text' | 'open' | 'close' | 'noise';
  tag: string;
  attrs: Array<{ name: string; value: string }>;
  text?: string;
  selfClose?: boolean;
}

interface RawTag {
  type: 'open' | 'close' | null;
  name: string;
  attrs: Array<{ name: string; value: string }>;
  selfClose: boolean;
}

/* ─── خواندن یک تگ از موقعیت i (که روی «<» است) با احترام به quoteها ───
   type=null یعنی «<» تگ نیست (ناقص یا عادی) و باید متن escape شود */
function readTag(s: string, i: number): { tag: RawTag | null; next: number; rawEnd: number } {
  let j = i + 1; /* از بعد از < */
  if (s[j] === '/') {
    /* تگ بسته */
    let k = j + 1;
    let name = '';
    while (k < s.length && /[a-zA-Z0-9-]/.test(s[k])) { name += s[k]; k++; }
    while (k < s.length && s[k] !== '>') k++;
    if (k >= s.length) return { tag: null, next: s.length, rawEnd: s.length }; /* ناقص */
    return { tag: { type: 'close', name: name.toLowerCase(), attrs: [], selfClose: false }, next: k + 1, rawEnd: k + 1 };
  }
  /* نام تگ */
  let name = '';
  while (j < s.length && /[a-zA-Z0-9-]/.test(s[j])) { name += s[j]; j++; }
  if (!name) return { tag: null, next: i + 1, rawEnd: i + 1 }; /* «<» عادی */
  const attrs: Array<{ name: string; value: string }> = [];
  let selfClose = false;
  let closed = false;

  const isSpace = (c: string) => c === ' ' || c === '\t' || c === '\n' || c === '\r';
  while (j < s.length) {
    while (j < s.length && isSpace(s[j])) j++;
    if (j >= s.length) break;
    if (s[j] === '>') { closed = true; j++; break; }
    if (s[j] === '/' ) {
      if (s[j + 1] === '>') { selfClose = true; closed = true; j += 2; break; }
      j++; continue;
    }
    /* نام attribute */
    let an = '';
    while (j < s.length && !isSpace(s[j]) && s[j] !== '=' && s[j] !== '>' && s[j] !== '/') { an += s[j]; j++; }
    if (!an) { j++; continue; }
    an = an.toLowerCase();
    /* مقدار اختیاری */
    let av = '';
    let k = j;
    while (k < s.length && isSpace(s[k])) k++;
    if (s[k] === '=') {
      k++;
      while (k < s.length && isSpace(s[k])) k++;
      if (s[k] === '"' || s[k] === "'") {
        const q = s[k]; k++;
        while (k < s.length && s[k] !== q) { av += s[k]; k++; }
        k++; /* بستن quote */
      } else {
        while (k < s.length && !isSpace(s[k]) && s[k] !== '>') { av += s[k]; k++; }
      }
      j = k;
    }
    attrs.push({ name: an, value: av });
  }
  if (!closed) return { tag: null, next: i + 1, rawEnd: j }; /* «<» بدون بستن — متن عادی */
  return { tag: { type: 'open', name: name.toLowerCase(), attrs, selfClose }, next: j, rawEnd: j };
}

/* ─── Tokenize کل ورودی ─── */
function tokenize(html: string): Token[] {
  const s = String(html || '');
  const tokens: Token[] = [];
  let i = 0;
  let text = '';
  const flush = () => { if (text) { tokens.push({ kind: 'text', tag: '', attrs: [], text }); text = ''; } };

  while (i < s.length) {
    const c = s[i];
    if (c === '<') {
      /* کامنت */
      if (s.startsWith('<!--', i)) {
        flush();
        const end = s.indexOf('-->', i + 4);
        const stop = end === -1 ? s.length : end + 3;
        tokens.push({ kind: 'noise', tag: '', attrs: [], text: s.slice(i, stop) });
        i = stop;
        continue;
      }
      /* doctype / CDATA */
      if (s.startsWith('<!', i) || s.startsWith('<?', i)) {
        flush();
        const end = s.indexOf('>', i);
        const stop = end === -1 ? s.length : end + 1;
        tokens.push({ kind: 'noise', tag: '', attrs: [], text: s.slice(i, stop) });
        i = stop;
        continue;
      }
      /* تگ */
      if (/[a-zA-Z/]/.test(s[i + 1] || '')) {
        const { tag, next, rawEnd } = readTag(s, i);
        if (tag && tag.type) {
          flush();
          tokens.push({ kind: tag.type, tag: tag.name, attrs: tag.attrs, selfClose: tag.selfClose });
          i = next;
          continue;
        }
        if (!tag) {
          /* «<» ناقص یا عادی — تا نزدیک‌ترین «>» یا پایان، متن امن حساب می‌شود */
          const stop = rawEnd > i ? rawEnd : i + 1;
          text += escapeText(s.slice(i, stop));
          i = stop;
          continue;
        }
      }
      /* «<» عادی — به‌عنوان متن escape می‌شود */
      text += '&lt;';
      i++;
      continue;
    }
    text += c;
    i++;
  }
  flush();
  return tokens;
}

/* ─── فیلتر attributeهای یک تگ مجاز ─── */
function renderOpenTag(tag: string, attrs: Array<{ name: string; value: string }>, selfClose: boolean): string {
  const safe: string[] = [];
  for (const { name, value } of attrs) {
    if (name.startsWith('on')) continue;
    if (URL_ATTRS.has(name)) {
      const url = safeUrl(value);
      if (url === null) continue;
      safe.push(`${name}="${url.replace(/"/g, '&quot;')}"`);
      continue;
    }
    if (name === 'style') {
      const style = sanitizeInlineStyle(value);
      if (style) safe.push(`style="${style.replace(/"/g, '&quot;')}"`);
      continue;
    }
    if (name === 'target') {
      safe.push(`target="${value.replace(/"/g, '&quot;')}"`);
      if (!attrs.some((a) => a.name === 'rel')) safe.push('rel="noopener noreferrer"');
      continue;
    }
    if (KEEP_ATTRS.has(name)) {
      safe.push(`${name}="${value.replace(/"/g, '&quot;')}"`);
    }
  }
  const voided = selfClose || VOID_TAGS.has(tag);
  return `<${tag}${safe.length ? ' ' + safe.join(' ') : ''}${voided ? ' /' : ''}>`;
}

export interface SanitizeOptions {
  /** حداکثر طول خروجی (محافظت در برابر ورودی‌های غول‌آسا) */
  maxLength?: number;
}

function escapeText(text: string): string {
  return String(text || '')
    .replace(/&(?!(?:amp|lt|gt|quot|#39|nbsp|#x?[0-9a-fA-F]+);)/g, '&amp;')
    .replace(/</g, '&lt;');
}

/**
 * امن‌سازی HTML با پارسر واقعی:
 * متن مجاز حفظ، تگ ممنوعِ متنی unwrap، تگ اجرایی drop همراه محتوا،
 * event handler و URL خطرناک حذف، تگ ناقص به متن امن تبدیل.
 */
export function sanitizeHtmlHtml(rawHtml: string, opts: SanitizeOptions = {}): string {
  const input = String(rawHtml || '');
  if (!input.trim()) return '';

  const tokens = tokenize(input);
  const out: string[] = [];
  let dropDepth = 0;
  let dropTag = '';
  const openStack: string[] = [];

  for (const tk of tokens) {
    if (dropDepth > 0) {
      if (tk.kind === 'open' && tk.tag === dropTag && !tk.selfClose) dropDepth++;
      else if (tk.kind === 'close' && tk.tag === dropTag) { dropDepth--; if (dropDepth === 0) dropTag = ''; }
      continue;
    }
    if (tk.kind === 'noise') continue;
    if (tk.kind === 'text') { out.push(tk.text || ''); continue; }
    if (tk.kind === 'close') {
      const tag = tk.tag;
      if (DROP_TAGS.has(tag) || UNWRAP_TAGS.has(tag) || !KEEP_TAGS.has(tag)) continue;
      const idx = openStack.lastIndexOf(tag);
      if (idx === -1) continue; /* بستن بی‌جفت — نادیده */
      while (openStack.length > idx) out.push(`</${openStack.pop()}>`);
      continue;
    }
    /* open */
    const tag = tk.tag;
    if (DROP_TAGS.has(tag)) {
      if (!tk.selfClose && !VOID_TAGS.has(tag)) { dropDepth = 1; dropTag = tag; }
      continue;
    }
    if (UNWRAP_TAGS.has(tag)) continue;
    if (VOID_TAGS.has(tag)) { out.push(renderOpenTag(tag, tk.attrs, true)); continue; }
    if (!KEEP_TAGS.has(tag)) continue;
    openStack.push(tag);
    out.push(renderOpenTag(tag, tk.attrs, !!tk.selfClose));
  }
  while (openStack.length) out.push(`</${openStack.pop()}>`);

  let result = out.join('');
  if (opts.maxLength && result.length > opts.maxLength) result = result.slice(0, opts.maxLength);
  return result.trim();
}
