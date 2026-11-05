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
import articlesC from './articles-c.json';
import articlesD from './articles-d.json';

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
  ...(articlesC as ArticleJson[]),
  ...(articlesD as ArticleJson[]),
];

/* نقشهٔ تصویر شاخص مقالات — تصاویر واقعی وب (WebP) از منابع آزاد */
const POST_COVERS: Record<string, string> = {
  'guide-choosing-web-design-company': '/img/blog/guide-choosing-web-design-company.webp',
  'web-design-cost-iran': '/img/blog/web-design-cost-iran.webp',
  'custom-vs-template': '/img/blog/custom-vs-template.webp',
  'ecommerce-design-principles': '/img/blog/ecommerce-design-principles.webp',
  'technical-seo-guide': '/img/blog/technical-seo-guide.webp',
  'site-speed-optimization': '/img/blog/site-speed-optimization.webp',
  'seo-content-guide': '/img/blog/seo-content-guide.webp',
  'uiux-increase-sales': '/img/blog/uiux-increase-sales.webp',
  'ai-for-iranian-business': '/img/blog/ai-for-iranian-business.webp',
  'business-automation': '/img/blog/business-automation.webp',
  'start-online-business': '/img/blog/start-online-business.webp',
  'local-business-website': '/img/blog/local-business-website.webp',
  'core-web-vitals-guide': '/img/blog/core-web-vitals-guide.webp',
  'keyword-research-persian': '/img/blog/keyword-research-persian.webp',
  'google-business-profile-local-seo': '/img/blog/google-business-profile-local-seo.webp',
  'backlink-strategy-white-hat': '/img/blog/backlink-strategy-white-hat.webp',
  'cro-increase-conversion': '/img/blog/cro-increase-conversion.webp',
  'google-analytics-4-tutorial': '/img/blog/google-analytics-4-tutorial.webp',
  'website-security-ssl-guide': '/img/blog/website-security-ssl-guide.webp',
  'email-marketing-newsletter': '/img/blog/email-marketing-newsletter.webp',
  'schema-markup-rich-snippets': '/img/blog/schema-markup-rich-snippets.webp',
  'instagram-to-website-funnel': '/img/blog/instagram-to-website-funnel.webp',
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
const FEATURED_SLUGS = ['core-web-vitals-guide', 'cro-increase-conversion', 'keyword-research-persian'];

export async function runSeed(): Promise<void> {
  /* ---------- تنظیمات ---------- */
  const settingsRow = await q1('SELECT value FROM settings WHERE key = $1', [SETTINGS_KEY]);
  if (!settingsRow) {
    await q('INSERT INTO settings (key, value) VALUES ($1, $2)', [SETTINGS_KEY, JSON.stringify(SETTINGS_SEED)]);
  } else {
    // Safe one-time brand migration: update only untouched legacy seed values.
    let parsedSettings: unknown = settingsRow.value;
    if (typeof parsedSettings === 'string') {
      try {
        parsedSettings = JSON.parse(parsedSettings);
      } catch {
        parsedSettings = null;
      }
    }

    if (parsedSettings && typeof parsedSettings === 'object' && !Array.isArray(parsedSettings)) {
      const stored = parsedSettings as Record<string, unknown>;
      const nextSettings: Record<string, unknown> = { ...stored };
      for (const sectionName of ['identity', 'seo', 'footer', 'menu', 'homepage']) {
        const section = stored[sectionName];
        nextSettings[sectionName] =
          section && typeof section === 'object' && !Array.isArray(section)
            ? { ...(section as Record<string, unknown>) }
            : {};
      }

      let changed = false;
      const replaceExact = (sectionName: string, key: string, oldValue: string, newValue: string) => {
        const section = nextSettings[sectionName] as Record<string, unknown>;
        if (section[key] === oldValue) {
          section[key] = newValue;
          changed = true;
        }
      };
      const stableJson = (value: unknown): string => {
        if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
        if (value && typeof value === 'object') {
          const record = value as Record<string, unknown>;
          return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(',')}}`;
        }
        return JSON.stringify(value) ?? 'undefined';
      };
      const replaceArrayExact = (sectionName: string, key: string, oldValue: unknown[], newValue: unknown[]) => {
        const section = nextSettings[sectionName] as Record<string, unknown>;
        if (stableJson(section[key]) === stableJson(oldValue)) {
          section[key] = newValue;
          changed = true;
        }
      };

      // یکسان‌سازی هویت قدیمی برند با نام رسمی «کافه دانش / Cafe Danesh».
      // فقط مقادیر پیش‌فرض شناخته‌شده عوض می‌شوند؛ تنظیمات سفارشی مدیر حفظ می‌شوند.
      replaceExact('identity', 'brandFa', 'کافه‌دانش', SETTINGS_SEED.identity.brandFa);
      replaceExact('identity', 'brandEn', 'CDANESH STUDIO', SETTINGS_SEED.identity.brandEn);
      replaceExact('identity', 'tagline', 'استودیو دیجیتال CDANESH STUDIO', SETTINGS_SEED.identity.tagline);
      replaceExact('identity', 'tagline', 'استودیو دیجیتال کافه‌دانش', SETTINGS_SEED.identity.tagline);
      replaceExact('seo', 'defaultTitle', 'طراحی سایت اختصاصی و سئو در بوشهر | CDANESH STUDIO', SETTINGS_SEED.seo.defaultTitle);
      replaceExact('seo', 'defaultTitle', 'طراحی سایت اختصاصی و سئو در بوشهر | کافه‌دانش', SETTINGS_SEED.seo.defaultTitle);
      replaceExact('seo', 'titlePattern', '%s | CDANESH STUDIO', SETTINGS_SEED.seo.titlePattern);
      replaceExact('seo', 'titlePattern', '%s | کافه‌دانش', SETTINGS_SEED.seo.titlePattern);
      replaceExact('seo', 'defaultDescription', 'CDANESH STUDIO (کافه‌دانش): طراحی سایت اختصاصی، سئو تکنیکال و محتوایی، تولید مقالات تخصصی و راهکارهای هوش مصنوعی — همه در یک تیم.', SETTINGS_SEED.seo.defaultDescription);
      replaceExact('seo', 'defaultDescription', 'استودیو دیجیتال کافه‌دانش: طراحی سایت اختصاصی، سئو تکنیکال و محتوایی، تولید مقالات تخصصی و راهکارهای هوش مصنوعی — همه در یک تیم.', SETTINGS_SEED.seo.defaultDescription);
      replaceExact('footer', 'aboutText', 'CDANESH STUDIO (کافه‌دانش)؛ طراحی سایت، سئو و راهکارهای هوشمند برای رشد واقعی کسب‌وکار شما.', SETTINGS_SEED.footer.aboutText);
      replaceExact('footer', 'aboutText', 'استودیو دیجیتال کافه‌دانش؛ طراحی سایت، سئو و راهکارهای هوشمند برای رشد واقعی کسب‌وکار شما.', SETTINGS_SEED.footer.aboutText);
      replaceExact('footer', 'copyright', '© ۱۴۰۵ CDANESH STUDIO — تمامی حقوق محفوظ است.', SETTINGS_SEED.footer.copyright);
      replaceExact('footer', 'copyright', '© ۱۴۰۵ کافه‌دانش — تمامی حقوق محفوظ است.', SETTINGS_SEED.footer.copyright);

      // تغییر ساختار خدمات فقط در صورتی اعمال می‌شود که تنظیمات هنوز همان پیش‌فرض قدیمی باشند.
      // سفارشی‌سازی‌هایی که مدیر قبلاً در پنل ذخیره کرده، بدون تغییر باقی می‌مانند.
      const legacyMegaGroups = [
        {
          title: 'طراحی و توسعه وب',
          items: [
            { label: 'طراحی سایت اختصاصی', href: '/services/company-website', desc: 'سایت سفارشی متناسب با برند و اهداف شما' },
            { label: 'فروشگاه اینترنتی', href: '/services/ecommerce', desc: 'تجربه خرید روان با درگاه پرداخت امن' },
            { label: 'طراحی UI/UX', href: '/services/ui-ux', desc: 'تجربه کاربری مهندسی‌شده و تمیز' },
          ],
        },
        {
          title: 'سئو و تولید محتوا',
          items: [
            { label: 'سئو تکنیکال و محتوایی', href: '/services/seo', desc: 'زیرساخت فنی استاندارد و رشد ارگانیک' },
            { label: 'مقالات تخصصی و سئوشده', href: '/services/content', desc: 'محتوای ساختاریافته با تحقیق واقعی' },
            { label: 'بهینه‌سازی سرعت', href: '/services/speed-optimization', desc: 'Core Web Vitals و تجربه سریع کاربر' },
          ],
        },
        {
          title: 'هوش مصنوعی و پشتیبانی',
          items: [
            { label: 'دستیارهای هوشمند', href: '/services/ai-automation', desc: 'چت‌بات و دستیار اختصاصی کسب‌وکار شما' },
            { label: 'پشتیبانی و نگهداری سایت', href: '/services/support', desc: 'امنیت، به‌روزرسانی و همراهی مداوم' },
            { label: 'همه خدمات', href: '/services', desc: 'مرور کامل سرویس‌های کافه دانش' },
          ],
        },
      ];
      const legacyFooterServices = [
        { label: 'همه خدمات', href: '/services' },
        { label: 'طراحی سایت', href: '/services/company-website' },
        { label: 'فروشگاه اینترنتی', href: '/services/ecommerce' },
        { label: 'سئو و بهینه‌سازی', href: '/services/seo' },
        { label: 'تولید محتوا', href: '/services/content' },
        { label: 'هوش مصنوعی و اتوماسیون', href: '/services/ai-automation' },
      ];
      const legacyHomepageCapabilities = [
        { no: '۰۱', title: 'طراحی سایت اختصاصی', text: 'سایت شما از صفر برای برند و اهداف خودتان طراحی می‌شود؛ نه یک قالب آماده با اسم شما. نتیجه: تمایز واقعی در بازار.' },
        { no: '۰۲', title: 'سئو تکنیکال و محتوایی', text: 'از سرعت و ساختار فنی تا انتخاب کلمه کلیدی و معماری محتوا.' },
        { no: '۰۳', title: 'تولید محتوای تخصصی', text: 'مقالات ساختاریافته با تحقیق واقعی؛ محتوایی که هم کاربر را پاسخ می‌دهد و هم موتور جست‌وجو را.' },
        { no: '۰۴', title: 'استراتژی و تقویم محتوایی', text: 'نقشه راه انتشار منظم؛ تا وبلاگ شما از «نوشته‌های پراکنده» به یک دارایی تبدیل شود.' },
        { no: '۰۵', title: 'عملکرد و تجربه کاربری', text: 'سرعت، دسترس‌پذیری و روانی تعامل؛ سنجه‌هایی که هم کاربر حس می‌کند و هم گوگل اندازه می‌گیرد.' },
        { no: '۰۶', title: 'هوش مصنوعی و اتوماسیون', text: 'دستیارهای هوشمند، ابزارهای تولید محتوا و خودکارسازی کارهای تکراری؛ با اتصال امن سمت سرور و بازبینی انسانی.' },
        { no: '۰۷', title: 'پشتیبانی و توسعه مداوم', text: 'سایت پس از انتشار «تمام‌شده» نیست؛ نگهداری امنیتی، به‌روزرسانی و توسعه قابلیت‌های جدید ادامه مسیر.' },
      ];
      replaceArrayExact('menu', 'megaGroups', legacyMegaGroups, SETTINGS_SEED.menu.megaGroups);
      replaceArrayExact('footer', 'colServices', legacyFooterServices, SETTINGS_SEED.footer.colServices);
      replaceArrayExact('homepage', 'capabilities', legacyHomepageCapabilities, SETTINGS_SEED.homepage.capabilities);
      const legacyHomepageStats = [
        { value: '۸', label: 'خدمت تخصصی در یک تیم واحد' },
        { value: '۷', label: 'توانمندی اصلی تیم' },
        { value: '۶', label: 'مرحلهٔ شروع همکاری' },
      ];
      replaceArrayExact('homepage', 'stats', legacyHomepageStats, SETTINGS_SEED.homepage.stats);
      replaceExact('identity', 'tagline', 'کافه دانش؛ طراحی سایت، سئو و راهکارهای هوشمند برای رشد کسب‌وکارها.', SETTINGS_SEED.identity.tagline);
      replaceExact('seo', 'defaultTitle', 'طراحی سایت اختصاصی و سئو در بوشهر | کافه دانش', SETTINGS_SEED.seo.defaultTitle);
      replaceExact('seo', 'defaultDescription', 'کافه دانش (Cafe Danesh): طراحی سایت اختصاصی، سئو تکنیکال و محتوایی، تولید مقالات تخصصی و راهکارهای هوش مصنوعی — همه در یک تیم.', SETTINGS_SEED.seo.defaultDescription);
      replaceExact('footer', 'aboutText', 'کافه دانش (Cafe Danesh)؛ طراحی سایت، سئو و راهکارهای هوشمند برای رشد واقعی کسب‌وکار شما.', SETTINGS_SEED.footer.aboutText);
      replaceExact('homepage', 'introTitle', 'سایت، محتوا و هوش مصنوعی؛ سه موتور رشد کسب‌وکار شما', SETTINGS_SEED.homepage.introTitle);
      replaceExact('homepage', 'introText', 'سایتی که برند شما را معرفی می‌کند، محتوایی که مخاطب را می‌آورد و ابزارهایی که کارهای تکراری را حذف می‌کنند — همه را یک تیم، با یک نقشه راه و تحویل مرحله‌به‌مرحله انجام می‌دهد.', SETTINGS_SEED.homepage.introText);
      replaceExact('homepage', 'ctaTitle', 'برای شروع دیجیتال کسب‌وکارتان آماده‌اید؟', SETTINGS_SEED.homepage.ctaTitle);
      replaceExact('homepage', 'ctaText', 'جلسه اول مشاوره رایگان است: اهداف‌تان را می‌شنویم، نیازها را مشخص می‌کنیم و مسیر پیشنهادی را برای شروع همکاری با هم می‌چینیم.', SETTINGS_SEED.homepage.ctaText);


      if (changed) {
        await q(
          'UPDATE settings SET value = $1::jsonb, updated_at = now() WHERE key = $2',
          [JSON.stringify(nextSettings), SETTINGS_KEY],
        );
      }
    }
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
      `INSERT INTO projects (title, slug, category, summary, content, cover_image, tags, note, sort_order, status, seo_title, seo_description)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,'published',$10,$11)
       ON CONFLICT (slug) DO NOTHING`,
      [p.title, p.slug, p.category, p.summary, p.content, p.cover_image, JSON.stringify(p.tags), p.note, p.sort_order, p.seo_title, p.seo_description],
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
