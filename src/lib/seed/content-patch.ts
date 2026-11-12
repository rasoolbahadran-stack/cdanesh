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
const PATCH_VERSION = 1;

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

  await writePatchVersion(PATCH_VERSION);
}
