/* ==========================================================================
   کافه‌دانش — بذرپاشی اولیه (idempotent)
   فقط داده‌های گم‌شده را می‌سازد؛ روی دادهٔ موجود بازنویسی نمی‌کند.
   مهاجرت از داده‌های واقعی سایت فعلی cdanesh.ir انجام شده است.
   ========================================================================== */
import { q, q1 } from '../db';
import { SETTINGS_SEED, SETTINGS_KEY, SEED_VERSION } from './settings-data';
import { SERVICES_SEED } from './services-data';
import { PLANS_SEED } from './plans-data';
import { PROJECTS_SEED, FAQS_SEED } from './portfolio-data';
import { PAGES_SEED } from './pages-data';
import articlesA from './articles-a.json';
import articlesB from './articles-b.json';

interface ArticleJson {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  readingTime: number;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  coverAlt: string;
  contentHtml: string;
}

const ARTICLES: ArticleJson[] = [
  ...(articlesA as ArticleJson[]),
  ...(articlesB as ArticleJson[]),
];

/* نقشهٔ تصویر شاخص مقالات (تصاویر سه‌بعدی اختصاصی) */
const POST_COVERS: Record<string, string> = {
  'guide-choosing-web-design-company': '/img/svc-company.webp',
  'web-design-cost-iran': '/img/post-cost.webp',
  'custom-vs-template': '/img/post-custom.webp',
  'ecommerce-design-principles': '/img/svc-ecommerce.webp',
  'technical-seo-guide': '/img/svc-seo.webp',
  'site-speed-optimization': '/img/svc-speed.webp',
  'seo-content-guide': '/img/svc-content.webp',
  'uiux-increase-sales': '/img/svc-uiux.webp',
  'ai-for-iranian-business': '/img/svc-ai.webp',
  'business-automation': '/img/svc-ai.webp',
  'start-online-business': '/img/pf-rosa.webp',
  'local-business-website': '/img/post-local.webp',
};

const CATEGORIES: { name: string; slug: string; description: string }[] = [
  { name: 'راهنمای خرید', slug: 'buying-guide', description: 'راهنماهای تصمیم‌گیری قبل از سفارش پروژه' },
  { name: 'تعرفه و هزینه', slug: 'pricing-cost', description: 'تحلیل هزینه‌های طراحی سایت و سئو' },
  { name: 'طراحی سایت', slug: 'web-design', description: 'مقالات حوزه طراحی و توسعه وب' },
  { name: 'فروشگاه اینترنتی', slug: 'ecommerce', description: 'راهکارهای فروش آنلاین و تجربه خرید' },
  { name: 'سئو', slug: 'seo', description: 'سئوی تکنیکال، سرعت و بهینه‌سازی' },
  { name: 'تولید محتوا', slug: 'content', description: 'محتوای سئومحور و استراتژی وبلاگ' },
  { name: 'طراحی UI/UX', slug: 'uiux', description: 'تجربه کاربری و رابط کاربری' },
  { name: 'هوش مصنوعی', slug: 'ai', description: 'کاربردهای واقعی هوش مصنوعی و اتوماسیون' },
  { name: 'کسب‌وکار آنلاین', slug: 'online-business', description: 'راه‌اندازی و رشد کسب‌وکار اینترنتی' },
  { name: 'کسب‌وکار محلی', slug: 'local-business', description: 'بازار شهرستان‌ها و مشاغل محلی' },
];

/* سه مقالهٔ تازه‌ترین، شاخص */
const FEATURED_SLUGS = ['seo-content-guide', 'uiux-increase-sales', 'ai-for-iranian-business'];

export async function runSeed(): Promise<void> {
  /* ---------- تنظیمات ---------- */
  const settingsRow = await q1('SELECT value FROM settings WHERE key = $1', [SETTINGS_KEY]);
  if (!settingsRow) {
    await q('INSERT INTO settings (key, value) VALUES ($1, $2)', [SETTINGS_KEY, JSON.stringify(SETTINGS_SEED)]);
  }

  /* ---------- کاربر ادمین (پروفایل) ---------- */
  const username = process.env.ADMIN_USERNAME || 'admin';
  const userRow = await q1('SELECT id FROM users WHERE username = $1', [username]);
  if (!userRow) {
    await q("INSERT INTO users (username, display_name, role) VALUES ($1, 'مدیر کافه‌دانش', 'admin')", [username]);
  }

  /* ---------- صفحات ---------- */
  for (const p of PAGES_SEED) {
    await q(
      `INSERT INTO pages (title, slug, excerpt, content, featured_image, status, seo_title, seo_description, system_key, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (slug) DO NOTHING`,
      [p.title, p.slug, p.excerpt, p.content, p.featured_image, p.status, p.seo_title, p.seo_description, p.system_key, p.sort_order],
    );
  }

  /* ---------- خدمات ---------- */
  for (const s of SERVICES_SEED) {
    await q(
      `INSERT INTO services (title, slug, icon, short_desc, content, features, image, sort_order, status, seo_title, seo_description)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,'published',$9,$10)
       ON CONFLICT (slug) DO NOTHING`,
      [s.title, s.slug, s.icon, s.short_desc, s.content, JSON.stringify(s.features), s.image, s.sort_order, s.seo_title, s.seo_description],
    );
  }

  /* ---------- پلن‌های تعرفه ---------- */
  const plansCount = await q1('SELECT count(*)::int AS c FROM plans');
  if (!plansCount || plansCount.c === 0) {
    for (const p of PLANS_SEED) {
      await q(
        `INSERT INTO plans (title, badge, price, price_note, description, features, highlighted, cta_text, sort_order, status)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,'published')`,
        [p.title, p.badge, p.price, p.price_note, p.description, JSON.stringify(p.features), p.highlighted, p.cta_text, p.sort_order],
      );
    }
  }

  /* ---------- نمونه‌کارها ---------- */
  for (const p of PROJECTS_SEED) {
    await q(
      `INSERT INTO projects (title, slug, category, summary, content, cover_image, tags, url, note, sort_order, status, seo_title, seo_description)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,'published',$11,$12)
       ON CONFLICT (slug) DO UPDATE SET url=EXCLUDED.url, title=EXCLUDED.title, category=EXCLUDED.category, summary=EXCLUDED.summary, note=EXCLUDED.note, sort_order=EXCLUDED.sort_order, updated_at=now()`,
      [p.title, p.slug, p.category, p.summary, p.content, p.cover_image, JSON.stringify(p.tags), p.url || '', p.note, p.sort_order, p.seo_title, p.seo_description],
    );
  }

  /* ---------- سؤالات متداول ---------- */
  const faqCount = await q1('SELECT count(*)::int AS c FROM faqs');
  if (!faqCount || faqCount.c === 0) {
    for (const f of FAQS_SEED) {
      await q("INSERT INTO faqs (question, answer, sort_order, status) VALUES ($1,$2,$3,'published')", [f.question, f.answer, f.sort_order]);
    }
  }

  /* ---------- دسته‌بندی‌ها ---------- */
  for (const c of CATEGORIES) {
    await q(
      `INSERT INTO categories (name, slug, description, sort_order) VALUES ($1,$2,$3,$4)
       ON CONFLICT (slug) DO NOTHING`,
      [c.name, c.slug, c.description, CATEGORIES.indexOf(c) + 1],
    );
  }

  /* ---------- مقالات ---------- */
  const catRows = await q<{ id: number; slug: string }>('SELECT id, slug FROM categories');
  const catMap = new Map(catRows.map((c) => [c.slug, c.id]));
  const catSlugByFa = new Map(CATEGORIES.map((c) => [c.name, c.slug]));

  for (const a of ARTICLES) {
    const catSlug = catSlugByFa.get(a.category);
    const categoryId = catSlug ? catMap.get(catSlug) ?? null : null;
    const cover = POST_COVERS[a.slug] || '/img/post-default.webp';
    await q(
      `INSERT INTO posts (title, slug, excerpt, content, cover_image, category_id, tags, author, status, featured, reading_time, seo_title, seo_description, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'published',$9,$10,$11,$12,$13)
       ON CONFLICT (slug) DO NOTHING`,
      [
        a.title,
        a.slug,
        a.excerpt,
        a.contentHtml,
        cover,
        categoryId,
        a.tags,
        'تیم کافه‌دانش',
        FEATURED_SLUGS.includes(a.slug),
        a.readingTime,
        a.seoTitle,
        a.seoDescription,
        new Date(a.publishedAt + 'T09:00:00Z'),
      ],
    );
  }

  /* ---------- نسخهٔ seed در تنظیمات ---------- */
  const verRow = await q1('SELECT value FROM settings WHERE key = $1', ['seed_version']);
  if (!verRow || (verRow.value as { v?: number }).v !== SEED_VERSION) {
    await q(
      `INSERT INTO settings (key, value) VALUES ($1, $2::jsonb)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      ['seed_version', JSON.stringify({ v: SEED_VERSION })],
    );
  }
}

/* ---------- خواندن تنظیمات با مقدار پیش‌فرض ---------- */
export async function getSiteSettings(): Promise<typeof SETTINGS_SEED> {
  const row = await q1<{ value: unknown }>('SELECT value FROM settings WHERE key = $1', [SETTINGS_KEY]);
  if (!row) return SETTINGS_SEED;
  /* ادغام امن: کلیدهای جدید seed بدون حذف تنظیمات کاربر اضافه می‌شوند */
  const stored = row.value as typeof SETTINGS_SEED;
  const merged: typeof SETTINGS_SEED = {
    ...SETTINGS_SEED,
    ...stored,
    identity: { ...SETTINGS_SEED.identity, ...(stored.identity || {}) },
    contact: { ...SETTINGS_SEED.contact, ...(stored.contact || {}) },
    seo: { ...SETTINGS_SEED.seo, ...(stored.seo || {}) },
    menu: { ...SETTINGS_SEED.menu, ...(stored.menu || {}) },
    footer: { ...SETTINGS_SEED.footer, ...(stored.footer || {}) },
    homepage: { ...SETTINGS_SEED.homepage, ...(stored.homepage || {}) },
  };
  return merged;
}

export async function saveSiteSettings(value: unknown): Promise<void> {
  await q(
    `INSERT INTO settings (key, value) VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [SETTINGS_KEY, JSON.stringify(value)],
  );
}

export async function logActivity(type: string, entity: string, entityId: number | null, title: string): Promise<void> {
  await q('INSERT INTO activity (type, entity, entity_id, title) VALUES ($1,$2,$3,$4)', [type, entity, entityId, title]);
}
