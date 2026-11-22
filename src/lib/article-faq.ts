/* ==========================================================================
   کافه‌دانش — استخراج عمومی بخش «سؤالات متداول» از بلوک‌های مقاله
   ---------------------------------------------------------------------------
   برخی مقاله‌ها بخش FAQ را داخل خودشان دارند، اما در سه شکل متفاوت:
   ۱) بلوک‌های ساختاریافته: h2 «سؤالات متداول» + h3/h4 پرسش + p/ul پاسخ
   ۲) بلوک HTML سند کامل: تیتر FAQ + h3/h4 پرسش + پاسخ تا تیتر بعدی
   ۳) بلوک HTML با <section class="faq"> یا <div class="faq-answer">:
      متن پرسش (لخت یا در تیتر) + پاسخ داخل faq-answer — همان ساختاری که
      «طراحی سایت اختصاصی…» و «boutique-website-setup» استفاده می‌کنند و
      بدون آکاردئون، به‌صورت متن معمولی رندر می‌شد.

   خروجی این ماژول به قالب آکاردئون استاندارد مقاله (.article-faq با
   details/summary) تزریق می‌شود؛ CSS همان کامپوننت رندرکننده است، پس
   مشکل «scoped بودن CSS روی HTML ذخیره‌شده» پیش نمی‌آید.
   ========================================================================== */

export interface FaqItem { q: string; a: string }
export interface FaqExtractionResult {
  blocks: unknown[];
  items: FaqItem[];
  heading: string;
}

/** الگوی تیتر بخش سؤالات متداول */
export const FAQ_HEADING_RE = /س[ؤو]الات\s*متداول|پرسش(?:‌|\s)?های?\s*متداول/i;

const MAX_FAQ_ITEMS = 14;

/** متن ساده از HTML — برای پرسش/پاسخ‌های متنی */
export function plainFaqText(value: string): string {
  return String(value || '')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

interface BlockLike { t?: string; x?: string; items?: string[] }

/* ── یافتن پایان یک تگ متوازن (مثل </div> یا </section>) ── */
function balancedClose(html: string, openStart: number, tagName: string): number {
  const openRe = new RegExp(`<${tagName}\\b[^>]*>`, 'gi');
  const closeRe = new RegExp(`</${tagName}\\s*>`, 'gi');
  openRe.lastIndex = openStart;
  closeRe.lastIndex = openStart;
  let depth = 0;
  const events: Array<{ pos: number; kind: 'open' | 'close'; len: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = openRe.exec(html)) !== null) events.push({ pos: m.index, kind: 'open', len: m[0].length });
  while ((m = closeRe.exec(html)) !== null) events.push({ pos: m.index, kind: 'close', len: m[0].length });
  events.sort((a, b) => a.pos - b.pos);
  for (const ev of events) {
    if (ev.kind === 'open') depth++;
    else { depth--; if (depth === 0) return ev.pos + ev.len; }
  }
  return html.length;
}

/* ── الگوی ۳: استخراج جفت‌های «متن پرسش + div.faq-answer» از یک ناحیه HTML ── */
function extractAnswerPairs(region: string): FaqItem[] {
  const items: FaqItem[] = [];
  const openRe = /<(?:div|details)\b[^>]*class="[^"]*faq-answer[^"]*"[^>]*>/gi;
  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = openRe.exec(region)) !== null) {
    const questionHtml = region.slice(cursor, m.index);
    const answerStart = m.index + m[0].length;
    const answerEnd = balancedClose(region, m.index, 'div');
    const answerHtml = region.slice(answerStart, answerEnd);
    const q = plainFaqText(questionHtml);
    const a = plainFaqText(answerHtml);
    if (q && a && q.length <= 300 && a.length <= 4000) items.push({ q, a });
    cursor = answerEnd;
    openRe.lastIndex = answerEnd;
  }
  return items;
}

/* ── حذف ناحیه FAQ از بلوک HTML + استخراج پرسش‌ها ── */
function extractFromHtmlBlock(x: string): { items: FaqItem[]; heading: string; html: string } | null {
  const headings = [...x.matchAll(/<h([23])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi)];
  let headingMatch: RegExpMatchArray | null = null;
  for (const h of headings) {
    if (FAQ_HEADING_RE.test(plainFaqText(h[2]))) { headingMatch = h; break; }
  }

  let regionStart = -1;
  let regionEnd = -1;
  let headingText = '';

  /* الگوی ۳ الف: <section class="faq">…</section> مستقل از تیتر */
  const secMatch = x.match(/<section\b[^>]*class="[^"]*\bfaq\b[^"]*"[^>]*>/i);
  if (secMatch && secMatch.index != null) {
    regionStart = secMatch.index;
    regionEnd = balancedClose(x, secMatch.index, 'section');
    headingText = headingMatch ? plainFaqText(headingMatch[2]) : 'سؤالات متداول';
  } else if (headingMatch && headingMatch.index != null) {
    /* الگوی ۲: تیتر FAQ + محتوا تا تیتر h2 بعدی */
    headingText = plainFaqText(headingMatch[2]);
    const afterHeading = headingMatch.index + headingMatch[0].length;
    const nextH2 = x.slice(afterHeading).search(/<h2\b/i);
    regionStart = headingMatch.index;
    regionEnd = nextH2 >= 0 ? afterHeading + nextH2 : x.length;
  } else {
    return null;
  }

  const region = x.slice(regionStart, regionEnd);
  const items = extractAnswerPairs(region);
  if (!items.length) {
    /* الگوی ۱ داخل HTML: پرسش‌های h3/h4 + پاسخ تا پرسش بعدی */
    const qRe = /<h[34]\b[^>]*>([\s\S]*?)<\/h[34]\s*>([\s\S]*?)(?=<h[34]\b|<h2\b|<\/section>|$)/gi;
    let qm: RegExpExecArray | null;
    while ((qm = qRe.exec(region)) !== null) {
      const q = plainFaqText(qm[1]);
      const a = plainFaqText(qm[2]);
      if (q && a && q.length <= 300 && a.length <= 4000) items.push({ q, a });
    }
  }
  if (!items.length) return null;
  return { items: items.slice(0, MAX_FAQ_ITEMS), heading: headingText, html: x.slice(0, regionStart) + x.slice(regionEnd) };
}

/* ── الگوی ۱: بلوک‌های ساختاریافته (h2 + h3/h4 + p/…) ── */
function extractFromStructuredBlocks(blocks: unknown[]): { items: FaqItem[]; heading: string; rest: unknown[]; start: number; end: number } | null {
  const start = blocks.findIndex((block) => {
    const b = block as BlockLike;
    return b.t === 'h2' && FAQ_HEADING_RE.test(b.x || '');
  });
  if (start < 0) return null;
  const heading = plainFaqText((blocks[start] as BlockLike).x || '');
  let end = blocks.findIndex((block, index) => {
    const b = block as BlockLike;
    return index > start && b.t === 'h2';
  });
  if (end < 0) end = blocks.length;

  const items: FaqItem[] = [];
  let current: FaqItem | null = null;
  const flush = () => {
    if (current?.q && current.a.trim()) items.push({ q: current.q, a: current.a.trim() });
    current = null;
  };
  for (const block of blocks.slice(start + 1, end)) {
    const b = block as BlockLike;
    if (b.t === 'h3' || b.t === 'h4') {
      flush();
      current = { q: plainFaqText(b.x || ''), a: '' };
    } else if (current && (b.t === 'p' || b.t === 'blockquote')) {
      current.a += (current.a ? ' ' : '') + plainFaqText(b.x || '');
    } else if (current && (b.t === 'ul' || b.t === 'ol')) {
      current.a += (current.a ? ' ' : '') + (b.items || []).map(plainFaqText).join('؛ ');
    } else if (current && b.t === 'html') {
      current.a += (current.a ? ' ' : '') + plainFaqText(b.x || '');
    }
  }
  flush();
  if (!items.length) return null;
  return { items: items.slice(0, MAX_FAQ_ITEMS), heading, rest: blocks.slice(0, start).concat(blocks.slice(end)), start, end };
}

/**
 * استخراج عمومی FAQ از بلوک‌های مقاله.
 * هر بلوک html و بخش ساختاریافته بررسی می‌شود؛ اولین بخش FAQ یافته‌شده
 * جداسازی می‌شود تا در قالب آکاردئون استاندارد رندر شود.
 */
export function extractArticleFaq(blocks: unknown[]): FaqExtractionResult {
  const out: FaqExtractionResult = { blocks, items: [], heading: '' };
  if (!Array.isArray(blocks) || blocks.length === 0) return out;

  /* اول بلوک‌های HTML (سندهای legacy و مقاله‌های پنل) */
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i] as BlockLike;
    if (b.t !== 'html' || !b.x) continue;
    const result = extractFromHtmlBlock(b.x);
    if (result) {
      out.items = result.items;
      out.heading = result.heading;
      out.blocks = [...blocks.slice(0, i), { ...b, x: result.html } as unknown, ...blocks.slice(i + 1)];
      return out;
    }
  }

  /* سپس بلوک‌های ساختاریافته */
  const structured = extractFromStructuredBlocks(blocks);
  if (structured) {
    out.items = structured.items;
    out.heading = structured.heading;
    out.blocks = structured.rest;
  }
  return out;
}
