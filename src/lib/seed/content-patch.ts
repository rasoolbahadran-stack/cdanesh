/* ==========================================================================
   کافه‌دانش — پچ محتوایی نسخه‌دار برای مقالات دیتابیس
   بذرپاشی اصلی (seed/index.ts) از ON CONFLICT DO NOTHING استفاده می‌کند؛
   یعنی رکوردهای موجود را به‌روز نمی‌کند. این ماژول تغییرات محتوایی
   شناخته‌شده را یک‌باره و idempotent روی همان مقالاتِ seed اعمال می‌کند
   (اصلاح لینک‌های داخلی، تصویر میانه، متن‌های هماهنگ با پکیج‌های جدید).
   نکته: مقالاتی که مدیر در پنل ساخته باشد (slug خارج از فهرست seed)
   هرگز دست نمی‌خورد.
   ========================================================================== */
import { q, q1 } from '../db';
import { POST_COVERS } from './index';
import articlesA from './articles-a.json';
import articlesB from './articles-b.json';
import articlesC from './articles-c.json';
import articlesD from './articles-d.json';

interface ArticleJson {
  slug: string;
  excerpt: string;
  readingTime: number;
  seoTitle: string;
  seoDescription: string;
  contentHtml: string;
}

const ARTICLES: ArticleJson[] = [
  ...(articlesA as ArticleJson[]),
  ...(articlesB as ArticleJson[]),
  ...(articlesC as ArticleJson[]),
  ...(articlesD as ArticleJson[]),
];

const PATCH_KEY = 'content_patch';
const PATCH_VERSION = 3;

interface PatchVersion { v?: number }

async function readPatchVersion(): Promise<number> {
  const row = await q1<{ value: unknown }>('SELECT value FROM settings WHERE key = $1', [PATCH_KEY]);
  if (!row) return 0;
  let parsed: unknown = row.value;
  if (typeof parsed === 'string') {
    try { parsed = JSON.parse(parsed); } catch { parsed = null; }
  }
  return Number((parsed as PatchVersion | null)?.v) || 0;
}

async function writePatchVersion(v: number): Promise<void> {
  await q(
    `INSERT INTO settings (key, value) VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [PATCH_KEY, JSON.stringify({ v })],
  );
}

export async function runContentPatch(): Promise<void> {
  const current = await readPatchVersion();
  if (current >= PATCH_VERSION) return;

  /* ---- نسخهٔ ۱: همگام‌سازی کامل محتوای ۲۲ مقالهٔ seed ----
     محتوا (contentHtml) شامل لینک‌های داخلی اصلاح‌شده، تصویر میانه و
     جملات هماهنگ با پکیج‌های سه‌گانهٔ جدید است. فقط همین slugها به‌روز
     می‌شوند؛ مقالات ادمین دست‌نخورده می‌مانند. */
  if (current < 1) {
    for (const a of ARTICLES) {
      const cover = POST_COVERS[a.slug] || '/img/post-default.webp';
      await q(
        `UPDATE posts
         SET content = $1, cover_image = $2, excerpt = $3, reading_time = $4,
             seo_title = $5, seo_description = $6, updated_at = now()
         WHERE slug = $7`,
        [a.contentHtml, cover, a.excerpt, a.readingTime, a.seoTitle, a.seoDescription, a.slug],
      );
    }
    console.log(`[cdanesh] content patch v1 applied to ${ARTICLES.length} seeded articles`);
  }

  /* ---- نسخهٔ ۲: اصلاح قیمت پکیج شرکتی در متن مقالات (۱۵ → ۱۷ میلیون) ----
     جایگزینی هدفمند فقط روی سه مقالهٔ seed که به قیمت پکیج شرکتی ارجاع
     دارند؛ بقیهٔ متن و ویرایش‌های احتمالی ادمین دست‌نخورده می‌مانند. */
  if (current < 2) {
    const priceTargets = [
      'guide-choosing-web-design-company',
      'web-design-cost-iran',
      'local-business-website',
    ];
    for (const slug of priceTargets) {
      await q(
        `UPDATE posts
         SET content = replace(replace(content, '۱۵,۰۰۰,۰۰۰ تومان', '۱۷,۰۰۰,۰۰۰ تومان'),
                               '۱۵ میلیون تومان', '۱۷ میلیون تومان'),
             updated_at = now()
         WHERE slug = $1`,
        [slug],
      );
    }
    console.log('[cdanesh] content patch v2 applied (قیمت شرکتی ۱۵ → ۱۷ میلیون در ۳ مقاله)');
  }

  /* ---- نسخهٔ ۳: بازنویسی کامل ۲۲ مقالهٔ seed برای ارتقای سئو و تجربه خواننده ----
     محتوای جدید (contentHtml از seed به‌روزشده): ساختار H2/H3، پنج تصویر بدنه با
     figcaption، لینک‌سازی داخلی هدفمند، بخش سؤالات متداول و جمع‌بندی؛ به‌همراه
     متاهای جدید (seo_title/seo_description/excerpt) و زمان مطالعه بازمحاسبه‌شده.
     تاریخ انتشار (published_at) و عنوان و دستهٔ مقالات دست نمی‌خورد.
     مقالهٔ ادمینی «website-security-checklist» فقط تصاویر بدنه و لینک‌های مرتبط می‌گیرد
     و متن اصلی آن محفوظ می‌ماند. */
  if (current < 3) {
    for (const a of ARTICLES) {
      const cover = POST_COVERS[a.slug] || '/img/post-default.webp';
      await q(
        `UPDATE posts
         SET content = $1, cover_image = $2, excerpt = $3, reading_time = $4,
             seo_title = $5, seo_description = $6, updated_at = now()
         WHERE slug = $7`,
        [a.contentHtml, cover, a.excerpt, a.readingTime, a.seoTitle, a.seoDescription, a.slug],
      );
    }

    /* اصلاح سبک مقالهٔ چک‌لیست امنیت (مقالهٔ ادمین — فقط تصویر و لینک، متن دست‌نخورده) */
    const checklist = await q1<{ content: string }>('SELECT content FROM posts WHERE slug = $1', ['website-security-checklist']);
    if (checklist?.content) {
      const figs = [
        '/img/blog/website-security-checklist-b1.webp',
        '/img/blog/website-security-checklist-b2.webp',
        '/img/blog/website-security-checklist-b3.webp',
      ];
      const FIG_ALT = [
        'داشبورد پایش امنیت سایت با هشدارها و وضعیت دسترس‌پذیری',
        'اسکن امنیتی فایل‌ها و بررسی نتیجه تمیز مرور نهایی',
        'کنترل دسترسی مدیران با ماتریس نقش‌ها و کلیدهای محدود',
      ];
      let content = checklist.content;
      if (!content.includes('website-security-checklist-b1')) {
        /* تصاویر پس از اولین، سومین و پنجمین <h2> درج می‌شوند (نه داخل FAQ) */
        const h2Re = /<h2[^>]*>[\s\S]*?<\/h2>/g;
        const marks: number[] = [];
        let m: RegExpExecArray | null;
        while ((m = h2Re.exec(content)) !== null) marks.push(m.index + m[0].length);
        const insertAt = [marks[0], marks[2], marks[4]].filter((x) => typeof x === 'number');
        let offset = 0;
        insertAt.forEach((pos, i) => {
          if (i >= figs.length) return;
          const fig = `<figure style="margin:1.6em 0"><img src="${figs[i]}" alt="${FIG_ALT[i]}" width="1200" height="675" loading="lazy"><figcaption>${FIG_ALT[i]}</figcaption></figure>`;
          const at = pos + offset;
          content = content.slice(0, at) + fig + content.slice(at);
          offset += fig.length;
        });
        /* بلوک مطالب مرتبط پیش از بخش سؤالات متداول (یا انتهای سند) */
        const related = '<h2>مطالب مرتبط</h2><p>برای عمق بیشتر، راهنمای <a href="/blog/website-security-ssl-guide">امنیت سایت و SSL</a> و چارچوب فنی <a href="/blog/technical-seo-guide">سئو تکنیکال</a> مکمل این چک‌لیست‌اند؛ و اگر سایتی که محافظت می‌کنید فروشگاهی است، اصول <a href="/blog/ecommerce-design-principles">طراحی فروشگاه اینترنتی</a> را هم در کنار همین موارد اجرا کنید.</p>';
        const faqIdx = content.search(/<h2[^>]*>[^<]*سؤالات متداول/);
        if (faqIdx !== -1) content = content.slice(0, faqIdx) + related + content.slice(faqIdx);
        else content += related;
      }
      await q(
        `UPDATE posts SET content = $1, updated_at = now() WHERE slug = $2`,
        [content, 'website-security-checklist'],
      );
    }

    console.log('[cdanesh] content patch v3 applied (بازنویسی سئومحور ۲۲ مقاله + تصاویر چک‌لیست امنیت)');
  }

  await writePatchVersion(PATCH_VERSION);
}
