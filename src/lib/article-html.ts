/* ==========================================================================
   کافه‌دانش — پردازش امن و مقاوم HTML مقاله‌ها
   ---------------------------------------------------------------------------
   برخی مقاله‌های قدیمی (مانند «boutique-website-setup» در دیتابیس تولیدی)
   به‌جای بلوک ساختاریافته، یک «سند کامل HTML» (با doctype/head/title/style)
   در ستون content دارند؛ برخی حتی ساختار ناقص/خراب. پردازشگر قدیمی در دو لایه
   (sanitize هنگام خواندن + حذف تگ‌به‌تگ هنگام رندر) بدنه را نابود می‌کرد و
   صفحه مقاله خالی رندر می‌شد.

   خط لولهٔ یکپارچهٔ فعلی:
   ۱) استخراج بدنه از سند کامل (</head> یا <body> تا </body>)
   ۲) پاک‌سازی پوستهٔ head (عنوان/متا/لینک باقی‌مانده)
   ۳) امن‌سازی «پارسرمحور» با src/lib/html-sanitize.ts — تگ اجرایی (script/
      style/iframe/…) همراه محتوا حذف، فرم/دکمه باز می‌شوند و متن می‌ماند،
      event handler و URL خطرناک حذف
   ۴) حذف h1 تکراری با عنوان مقاله و تصویر شاخص تکراری از بدنه
   ۵) «فالت‌بک محافظه‌کار»: اگر خروجی تقریباً خالی ولی ورودی پرمحتوا باشد،
      نسخهٔ حداقلی و امنِ کل سند رندر می‌شود تا صفحه خالی نماند
   ========================================================================== */
import { sanitizeHtmlHtml } from './html-sanitize';

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

/* ── پاک‌سازی پوستهٔ head: فقط ساختار سند، نه امن‌سازی (آن کار پارسر است) ──
   دقت: تگ‌های اجرایی (script/style/iframe/…) اینجا دست نمی‌خورند؛ حذف تگ
   پایانی‌شان در گذشته تگ بازِ یتیم باقی می‌گذاشت و sanitizeHtmlHtml از آن
   نقطه «کل بدنه همراه محتوا» را حذف می‌کرد — علت اصلی خالی‌ماندن مقاله‌های
   legacy مانند boutique-website-setup. حذف کامل script/style با خودِ پارسر
   انجام می‌شود که جفت‌بودن تگ‌ها را درست ردیابی می‌کند. */
function stripHeadShell(html: string): string {
  return String(html || '')
    .replace(/<!doctype\b[^>]*>/gi, '')
    .replace(/<title\b[^>]*>[\s\S]*?<\/title\s*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<\/?(?:html|head|body)\b[^>]*>/gi, '')
    .replace(/<\/title\s*>/gi, '');
}

/* ── استخراج بدنهٔ سند کامل ── */
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

  /* ۴) محافظت در برابر سندهای ناقص: اگر محتوای واقعی مقاله قبل از </head>
     مانده باشد (سند بدون <body> یا با تودرتویی خراب)، برش بعد از </head>
     بدنهٔ خالی می‌دهد و مقاله خالی رندر می‌شد. در این حالت کل سند به
     خط پاک‌سازی سپرده می‌شود؛ stripHeadShell پوسته را می‌زُداید. */
  if (visibleTextLength(out) < 200 && visibleTextLength(String(html || '')) > 800) {
    return String(html || '');
  }

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
    /* حذف «کاور تکراری» فقط برای تصویر لخت (بدون کپشن) — تصویری که بلافاصله
       بعد از آن figcaption پر محتوا آمده، تصویر محتوایی واقعی مقاله است حتی
       اگر فایلش با کاور یکی باشد (مانند figure مقالهٔ مزون/بوتیک) و باید حفظ شود. */
    out = out.replace(/<img\b[^>]*>/gi, (image: string, offset: number, full: string) => {
      const src = image.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] || '';
      if (normalizeImgUrl(src, site) !== cover) return image;
      const after = full.slice(offset + image.length, offset + image.length + 400);
      if (/<figcaption\b[^>]*>\s*\S/i.test(after)) return image;
      return '';
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

  /* مسیر اصلی: بدنهٔ سند کامل → پاک‌سازی پوسته → امن‌سازی پارسرمحور */
  const body = looksLikeDocument ? extractDocumentBody(input) : input;
  const shelled = stripHeadShell(body);
  let cleaned = sanitizeHtmlHtml(shelled);
  cleaned = dedupeTitleAndCover(cleaned, opts, site);

  /* فالت‌بک محافظه‌کار: اگر پردازش محتوا را تقریباً کامل حذف کرده ولی سند
     اصلی پر‌متن بوده، نسخهٔ حداقلی و امنِ کل سند رندر می‌شود.
     متن ورودی «قبل از امن‌سازی» هم سنجیده می‌شود؛ وگرنه سندی که
     امن‌ساز همهٔ متنش را داخل تگ‌های اجرایی می‌یابد، فالت‌بک را از دست می‌داد. */
  const shellStripped = stripHeadShell(input);
  const inputText = Math.max(
    visibleTextLength(shellStripped),
    visibleTextLength(sanitizeHtmlHtml(shellStripped)),
  );
  const outputText = visibleTextLength(cleaned);
  if (outputText < 200 && inputText > 800) {
    const fallback = dedupeTitleAndCover(sanitizeHtmlHtml(shellStripped), opts, site);
    return fallback.trim();
  }

  return cleaned.trim();
}

/* سازگاری با نام قبلی */
export const normalizeLegacyArticleHtml = renderArticleHtml;
