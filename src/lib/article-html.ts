/* ==========================================================================
   کافه‌دانش — پردازش امن و مقاوم HTML مقاله‌ها
   ---------------------------------------------------------------------------
   برخی مقاله‌های قدیمی (مانند «boutique-website-setup» در دیتابیس تولیدی)
   به‌جای بلوک ساختاریافته، یک «سند کامل HTML» (با doctype/head/title/style)
   در ستون content دارند؛ برخی حتی ساختار ناقص/خراب. پردازشگر قبلی در دو لایه
   (sanitize هنگام خواندن + حذف تگ‌به‌تگ هنگام رندر) بدنه را نابود می‌کرد و
   صفحه مقاله خالی رندر می‌شد.

   این ماژول یک خط لوله یکپارچه می‌دهد:
   ۱) حذف جفت‌تگ‌های غیرنمایشی (script/style/iframe/object/embed) با محتوا
   ۲) استخراج بدنه از سند کامل (</head> یا <body> تا </body>)
   ۳) بازکردن (unwrap) فرم‌ها و دکمه‌ها — متن داخل آن‌ها می‌ماند، خودشان حذف
      می‌شوند؛ برخلاف sanitize قبلی که «کل محتوای داخل فرم» را حذف می‌کرد
   ۴) فیلتر attributeها (رویدادها، javascript:، …) روی تگ‌های مجاز ویرایشگر
   ۵) حذف h1 تکراری با عنوان مقاله و تصویر شاخص تکراری از بدنه
   ۶) «فالت‌بک محافظه‌کار»: اگر خروجی تقریباً خالی ولی ورودی پرمحتوا باشد،
      نسخهٔ حداقلی و امنِ کل سند رندر می‌شود تا صفحه خالی نماند
   ========================================================================== */

/* تگ‌های مجاز محتوای مقاله — همان لیست ویرایشگر پنل */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'strong', 'em', 'b', 'i', 'u', 'ul', 'ol', 'li', 'a', 'img',
  'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span', 'figure', 'figcaption',
  'section', 'article', 'main', 'aside', 'header', 'footer', 'nav', 'h5', 'h6', 'small', 'sub', 'sup', 'pre', 'code',
]);

const URL_ATTRS = new Set(['href', 'src']);
const KEEP_ATTRS = new Set(['alt', 'title', 'class', 'id', 'target', 'rel', 'loading', 'decoding', 'width', 'height', 'colspan', 'rowspan', 'dir', 'lang']);

/* متن قابل مشاهدهٔ یک تکه HTML برای سنجش پر‌محتوا بودن */
export function visibleTextLength(html: string): number {
  return String(html || '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .length;
}

/* ── گام ۱: حذف کامنت‌ها، doctype، تگ‌های تکی head و جفت‌تگ‌های غیرنمایشی ── */
function stripNonVisibleTags(html: string): string {
  return String(html || '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!doctype\b[^>]*>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi, '')
    .replace(/<object\b[^>]*>[\s\S]*?<\/object\s*>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<input\b[^>]*>/gi, '')
    .replace(/<\/?(?:html|head|body|title)\b[^>]*>/gi, '')
    .replace(/<\/(?:title|script|style|iframe|object|embed)>/gi, '');
}

/* ── گام ۳: بازکردن فرم/دکمه/جدول‌های رفتاری — متن داخل حفظ می‌شود ── */
function unwrapFormTags(html: string): string {
  return String(html || '')
    .replace(/<\/?(form|button|select|option|textarea|label|fieldset|legend|datalist)\b[^>]*>/gi, '');
}

/* ── گام ۴: فیلتر امن attributeها و تگ‌ها ── */
function sanitizeAttributes(html: string): string {
  return String(html || '').replace(/<([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^<>]*?)?)\/?>/g, (m, tag: string, attrs: string) => {
    const t = tag.toLowerCase();
    /* تگ‌های ممنوع باقی‌مانده حذف می‌شوند (متن داخلشان حفظ شده است) */
    if (!ALLOWED_TAGS.has(t)) return '';
    const safeAttrs: string[] = [];
    const attrRe = /([a-zA-Z-]+)\s*=\s*"([^"]*)"|([a-zA-Z-]+)\s*=\s*'([^']*)'/g;
    let am: RegExpExecArray | null;
    while ((am = attrRe.exec(attrs)) !== null) {
      const name = (am[1] || am[3] || '').toLowerCase();
      const value = am[2] ?? am[4] ?? '';
      if (name.startsWith('on')) continue;
      if (name === 'style') {
        if (/expression|javascript:/i.test(value)) continue;
        safeAttrs.push(`style="${value.replace(/"/g, '&quot;')}"`);
        continue;
      }
      if (URL_ATTRS.has(name)) {
        if (/^\s*(javascript|vbscript):/i.test(value)) continue;
        safeAttrs.push(`${name}="${value.replace(/"/g, '&quot;')}"`);
        continue;
      }
      if (KEEP_ATTRS.has(name)) {
        safeAttrs.push(`${name}="${value.replace(/"/g, '&quot;')}"`);
      }
    }
    void m;
    return `<${t}${safeAttrs.length ? ' ' + safeAttrs.join(' ') : ''}>`;
  });
}

/* ── گام ۲: استخراج بدنهٔ سند کامل ── */
function extractDocumentBody(html: string): string {
  let out = String(html || '');

  /* ۱) اگر </head> دارد: هرچه بعد از آن است بدنهٔ واقعی است */
  const headCloseMatch = out.match(/<\/head\s*>/i);
  if (headCloseMatch && headCloseMatch.index != null) {
    out = out.slice(headCloseMatch.index + headCloseMatch[0].length);
  } else {
    /* ۲) اگر <body> دارد: بین اولین <body> و آخرین </body> */
    const bodyOpen = out.match(/<body\b[^>]*>/i);
    if (bodyOpen && bodyOpen.index != null) {
      const start = bodyOpen.index + bodyOpen[0].length;
      const lastBodyClose = out.toLowerCase().lastIndexOf('</body>');
      out = lastBodyClose > start ? out.slice(start, lastBodyClose) : out.slice(start);
    }
  }

  /* ۳) برش تا پایان سند */
  const htmlClose = out.toLowerCase().lastIndexOf('</html>');
  if (htmlClose >= 0) out = out.slice(0, htmlClose);

  return out;
}

const textOf = (html: string) =>
  String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const sameText = (a: string, b: string) => textOf(a) === textOf(b);

export interface ArticleHtmlOptions {
  postTitle?: string;
  articleCoverUrl?: string;
}

const normalizeImgUrl = (value: string, site?: string): string => {
  const raw = String(value || '').trim().replace(/&amp;/g, '&');
  try {
    const url = new URL(raw, site || 'https://cdanesh.ir');
    return (url.origin + url.pathname).replace(/\/+$/, '').toLowerCase();
  } catch {
    return raw.split(/[?#]/)[0].replace(/\/+$/, '').toLowerCase();
  }
};

/* حذف h1 تکراری با عنوان مقاله و تصویر شاخص تکراری */
function dedupeTitleAndCover(html: string, opts: ArticleHtmlOptions, site?: string): string {
  let out = html;
  if (opts.postTitle) {
    out = out.replace(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/i, (heading) => {
      return sameText(opts.postTitle || '', heading) ? '' : heading;
    });
  }
  const cover = opts.articleCoverUrl ? normalizeImgUrl(opts.articleCoverUrl, site) : '';
  if (cover) {
    out = out.replace(/<img\b[^>]*>/gi, (image) => {
      const src = image.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] || '';
      return normalizeImgUrl(src, site) === cover ? '' : image;
    });
  }
  return out;
}

/**
 * رندر امن و مقاوم HTML مقاله — برای بلوک‌های html و محتوای legacy.
 * هرگز صفحهٔ خالی از سند پرمحتوا تولید نمی‌کند؛ تگ‌های خطرناک هم باقی نمی‌مانند.
 */
export function renderArticleHtml(rawHtml: string, opts: ArticleHtmlOptions = {}, site?: string): string {
  const input = String(rawHtml || '');
  if (!input.trim()) return '';

  const looksLikeDocument = /<!doctype\s*html|<html[\s>]|<head[\s>]|<body[\s>]|<\/head>|<\/body>/i.test(input);

  /* مسیر اصلی: بدنهٔ سند کامل → پاک‌سازی → فیلتر امن */
  const body = looksLikeDocument ? extractDocumentBody(input) : input;
  let cleaned = sanitizeAttributes(unwrapFormTags(stripNonVisibleTags(body)));
  cleaned = dedupeTitleAndCover(cleaned, opts, site);

  /* فالت‌بک محافظه‌کار: اگر پردازش محتوا را تقریباً کامل حذف کرده ولی سند
     اصلی پر‌متن بوده، نسخهٔ حداقلی و امنِ کل سند رندر می‌شود. */
  const inputText = visibleTextLength(sanitizeAttributes(unwrapFormTags(stripNonVisibleTags(input))));
  const outputText = visibleTextLength(cleaned);
  if (outputText < 200 && inputText > 800) {
    let fallback = sanitizeAttributes(unwrapFormTags(stripNonVisibleTags(input)));
    fallback = dedupeTitleAndCover(fallback, opts, site);
    return fallback.trim();
  }

  return cleaned.trim();
}

/* سازگاری با نام قبلی داخل blog/[slug] */
export const normalizeLegacyArticleHtml = renderArticleHtml;
