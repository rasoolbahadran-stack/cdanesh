// دسترسی به داده‌ها: از دیتابیس Neon (در صورت اتصال) وگرنه از داده‌های محلی
// داده‌های محلی دقیقاً از آخرین وضعیت سایت کافه دانش استخراج شده‌اند.
import postsJson from '../data/content/posts.json';
import servicesJson from '../data/content/services.json';
import portfolioJson from '../data/content/portfolio.json';
import faqJson from '../data/content/faq.json';
import pagesJson from '../data/content/pages.json';
import type { Post, Service, PortfolioItem, FaqItem, PageDoc, Block } from './types';
import { getPosts as dbPosts, getPortfolio as dbPortfolio, dbAvailable } from './cms-db';

const localPosts = postsJson as Post[];
const localServices = servicesJson as Service[];
const localPortfolio = portfolioJson as PortfolioItem[];
const localFaq = faqJson as FaqItem[];
const localPages = pagesJson as Record<string, PageDoc>;

const useDb = () => {
  try { return dbAvailable(); } catch { return false; }
};

export async function getPosts(): Promise<Post[]> {
  if (!useDb()) return localPosts;
  const rows = await dbPosts().catch(() => null);
  if (!rows || !rows.length) return localPosts;
  const merged = new Map(localPosts.map((post) => [post.slug, post]));
  rows.forEach((post) => merged.set(post.slug, post as unknown as Post));
  return [...merged.values()].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export async function getPost(slug: string): Promise<Post | undefined> {
  if (useDb()) {
    const rows = await dbPosts().catch(() => null);
    const fromDb = rows?.find((post) => post.slug === slug);
    if (fromDb) return fromDb as unknown as Post;
  }
  return localPosts.find((post) => post.slug === slug);
}

export function getPostCategories(): string[] {
  return [...new Set(localPosts.map((p) => p.category))];
}

export function getRelatedPosts(slug: string, n = 3): Post[] {
  const cur = localPosts.find((p) => p.slug === slug);
  if (!cur) return localPosts.slice(0, n);
  const same = localPosts.filter((p) => p.slug !== slug && p.category === cur.category);
  const rest = localPosts.filter((p) => p.slug !== slug && p.category !== cur.category);
  return [...same, ...rest].slice(0, n);
}

export async function getServices(): Promise<Service[]> {
  return localServices;
}
export function getService(slug: string): Service | undefined {
  return localServices.find((s) => s.slug === slug);
}

export async function getPortfolio(): Promise<PortfolioItem[]> {
  if (!useDb()) return localPortfolio;
  const rows = await dbPortfolio().catch(() => null);
  if (!rows || !rows.length) return localPortfolio;
  const merged = new Map(localPortfolio.map((item) => [item.slug, item]));
  rows.forEach((item) => merged.set(item.slug, item as unknown as PortfolioItem));
  return [...merged.values()].sort((a, b) => a.sort - b.sort);
}
export async function getPortfolioItem(slug: string): Promise<PortfolioItem | undefined> {
  const all = await getPortfolio();
  return all.find((p) => p.slug === slug);
}

export function getFaq(): FaqItem[] {
  return localFaq;
}

export function getPage(key: string): PageDoc | undefined {
  return localPages[key];
}

export function blocksToPlain(blocks: Block[], limit = 2): string {
  return blocks
    .filter((b) => b.t === 'p')
    .slice(0, limit)
    .map((b) => (b as { x: string }).x)
    .join(' ');
}

// ─── اطلاعات ثابت برند ────────────────────────────────────────
export const SITE = {
  name: 'کافه دانش',
  nameEn: 'Cafe Danesh',
  tagline: 'استودیو دیجیتال کافه‌دانش',
  url: 'https://cdanesh.ir',
  email: 'info@cdanesh.ir',
  phoneFa: '۰۹۱۶ ۵۸۰ ۶۲۰۷',
  phoneIntl: '+989165806207',
  address: 'بوشهر، خیابان شهید رجایی',
  designer: 'Rasool Bahadoran',
  github: 'https://github.com/rasoolbahadran-stack',
  year: '۱۴۰۵',
};

export const NAV = [
  { href: '/', label: 'خانه' },
  { href: '/services', label: 'خدمات', mega: true },
  { href: '/portfolio', label: 'نمونه‌کارها' },
  { href: '/blog', label: 'مجله' },
  { href: '/pricing', label: 'تعرفه‌ها' },
  { href: '/about', label: 'درباره ما' },
  { href: '/contact', label: 'تماس' },
];

export const MEGA_GROUPS = [
  {
    title: 'طراحی و توسعه وب',
    items: [
      { href: '/services/company-website', t: 'طراحی سایت اختصاصی', d: 'سایت سفارشی متناسب با برند و اهداف شما' },
      { href: '/services/ecommerce', t: 'فروشگاه اینترنتی', d: 'تجربه خرید روان با درگاه پرداخت امن' },
      { href: '/services/ui-ux', t: 'طراحی UI/UX', d: 'تجربه کاربری مهندسی‌شده و تمیز' },
    ],
  },
  {
    title: 'سئو و تولید محتوا',
    items: [
      { href: '/services/seo', t: 'سئو تکنیکال و محتوایی', d: 'زیرساخت فنی استاندارد و رشد ارگانیک' },
      { href: '/services/content', t: 'مقالات تخصصی و سئوشده', d: 'محتوای ساختاریافته با تحقیق واقعی' },
      { href: '/services/speed-optimization', t: 'بهینه‌سازی سرعت', d: 'Core Web Vitals و تجربه سریع کاربر' },
    ],
  },
  {
    title: 'هوش مصنوعی و پشتیبانی',
    items: [
      { href: '/services/ai-automation', t: 'دستیارهای هوشمند', d: 'چت‌بات و دستیار اختصاصی کسب‌وکار شما' },
      { href: '/services/support', t: 'پشتیبانی و نگهداری سایت', d: 'امنیت، به‌روزرسانی و همراهی مداوم' },
      { href: '/services', t: 'همه خدمات', d: 'مرور کامل سرویس‌های کافه‌دانش' },
    ],
  },
];

export const FOOTER_LINKS = {
  services: [
    { href: '/services', t: 'همه خدمات' },
    { href: '/services/company-website', t: 'طراحی سایت' },
    { href: '/services/ecommerce', t: 'فروشگاه اینترنتی' },
    { href: '/services/seo', t: 'سئو و بهینه‌سازی' },
    { href: '/services/content', t: 'تولید محتوا' },
    { href: '/services/ai-automation', t: 'هوش مصنوعی و اتوماسیون' },
  ],
  quick: [
    { href: '/portfolio', t: 'نمونه‌کارها' },
    { href: '/blog', t: 'مجله مقالات' },
    { href: '/pricing', t: 'تعرفه‌ها' },
    { href: '/faq', t: 'سؤالات متداول' },
    { href: '/about', t: 'درباره ما' },
    { href: '/contact', t: 'تماس با ما' },
    { href: '/consult', t: 'ثبت درخواست خدمات' },
  ],
};

// نوار دامنه‌ها/برندها (از نمونه‌کارهای واقعی)
export const MARQUEE_ITEMS = [
  'بازارینو', 'مزون مهر', 'فروشگاه کفش', 'اسمارت گجت', 'ماه‌پوش',
  'سیمبا بیوتی', 'اسمارتو', 'پورتال کارینو', 'آژانس نوین‌رشد', 'دموی کهکشانی',
];

export const STEPS = [
  { t: 'ثبت درخواست و نیازسنجی', d: 'فرم را پر می‌کنید یا تماس می‌گیرید؛ در جلسه اول کسب‌وکارتان را می‌شنویم.' },
  { t: 'تحلیل و تعیین محدوده', d: 'دامنه کار، امکانات، زمان‌بندی و برآورد شفاف — پیش از هر تعهدی.' },
  { t: 'طراحی ساختار و رابط کاربری', d: 'معماری اطلاعات و طراحی UI/UX؛ با بازبینی و تأیید شما.' },
  { t: 'توسعه و پیاده‌سازی', d: 'کدنویسی استاندارد، پیاده‌سازی محتوا و اتصال قابلیت‌ها.' },
  { t: 'بررسی کیفیت، عملکرد و سئو', d: 'تست سرعت، ریسپانسیو و دسترس‌پذیری؛ بررسی ساختار سئو.' },
  { t: 'تحویل و پشتیبانی', d: 'انتشار، آموزش پنل مدیریت و پشتیبانی توافق‌شده پس از تحویل.' },
];

export const CAPS = [
  { t: 'طراحی سایت اختصاصی', d: 'سایت شما از صفر برای برند و اهداف خودتان طراحی می‌شود؛ نه یک قالب آماده با اسم شما. نتیجه: تمایز واقعی در بازار.' },
  { t: 'سئو تکنیکال و محتوایی', d: 'از سرعت و ساختار فنی تا انتخاب کلمه کلیدی و معماری محتوا.' },
  { t: 'تولید محتوای تخصصی', d: 'مقالات ساختاریافته با تحقیق واقعی؛ محتوایی که هم کاربر را پاسخ می‌دهد و هم موتور جست‌وجو را.' },
  { t: 'استراتژی و تقویم محتوایی', d: 'نقشه راه انتشار منظم؛ تا وبلاگ شما از «نوشته‌های پراکنده» به یک دارایی تبدیل شود.' },
  { t: 'عملکرد و تجربه کاربری', d: 'سرعت، دسترس‌پذیری و روانی تعامل؛ سنجه‌هایی که هم کاربر حس می‌کند و هم گوگل اندازه می‌گیرد.' },
  { t: 'هوش مصنوعی و اتوماسیون', d: 'دستیارهای هوشمند، ابزارهای تولید محتوا و خودکارسازی کارهای تکراری؛ با اتصال امن سمت سرور و بازبینی انسانی.' },
  { t: 'پشتیبانی و توسعه مداوم', d: 'سایت پس از انتشار «تمام‌شده» نیست؛ نگهداری امنیتی، به‌روزرسانی و توسعه قابلیت‌های جدید ادامه مسیر است.' },
];

export const PROS = [
  { t: 'طراحی متناسب با نیاز کسب‌وکار شما', d: 'قبل از هر خط کد، کسب‌وکار، مخاطب و هدف شما تحلیل می‌شود؛ نتیجه سایتی است که برای «شما» ساخته شده، نه برای همه.' },
  { t: 'تجربه کاربری و نمایش درست در موبایل', d: 'بیشتر بازدیدها از گوشی است؛ هر صفحه برای موبایل، تبلت و دسکتاپ جداگانه تست می‌شود، نه فقط «کوچک‌شده» است.' },
  { t: 'زیرساخت فنی و سئوی اصولی از روز اول', d: 'سرعت، ساختار استاندارد و آماده‌بودن برای موتور جست‌وجو جزو تحویل اولیه است؛ بعداً هزینه اضافه برای «اصلاح زیرساخت» نمی‌پردازید.' },
  { t: 'قابلیت توسعه و مدیریت محتوا', d: 'پنل مدیریتی کامل با آموزش؛ محتوای جدید خودتان منتشر کنید و قابلیت‌های جدید بدون بازسازی اضافه شوند.' },
  { t: 'استفاده هدفمند از هوش مصنوعی', d: 'جایی که واقعاً ارزش دارد: پاسخ‌گویی، تولید پیش‌نویس و خودکارسازی کار تکراری — با بازبینی انسانی، نه جایگزینی کیفیت.' },
];

export const PRICING = [
  {
    key: 'starter', badge: 'سایت معرفی', name: 'استارتر',
    desc: 'مناسب کسب‌وکارهایی که تازه حضور آنلاین می‌سازند و به سایتی منظم، سریع و مقرون‌به‌صرفه نیاز دارند.',
    price: '۱۵,۰۰۰,۰۰۰ تومان', note: 'پرداخت یک‌جا — بدون هزینه پنهان',
    features: ['دامنهٔ .IR رایگان', '۳ ماه هاست هدیه', 'تا ۶ صفحهٔ اختصاصی', 'طراحی صفحهٔ اصلی حرفه‌ای و ریسپانسیو', 'تنظیمات اولیهٔ سئو و ساختار استاندارد', 'تحویل ۷ تا ۱۰ روز کاری', '۱ ماه پشتیبانی رایگان'],
    foot: 'هر صفحه با ساختار استاندارد سئو و ریسپانسیو کامل تحویل می‌شود.',
  },
  {
    key: 'pro', badge: 'سایت شرکتی', name: 'حرفه‌ای', featured: true,
    desc: 'برای کسب‌وکارهایی که دنبال اعتبار برند و رشد ارگانیک از موتورهای جست‌وجو هستند.',
    price: '۱۹,۰۰۰,۰۰۰ تومان', note: 'پرداخت یک‌جا — بدون هزینه پنهان',
    features: ['دامنهٔ .IR رایگان + ۶ ماه هاست هدیه', 'همهٔ امکانات پکیج استارتر', 'تا ۱۲ صفحه + مجلهٔ مقالات', 'سئوی تکنیکال کامل + اتصال Search Console', 'تحویل ۲ تا ۳ هفته', '۳ ماه پشتیبانی رایگان'],
    foot: 'برجسته‌شدن این پکیج به‌معنای ادعای برتری نیست؛ تجربه نشان داده بیشترین نیازها را پوشش می‌دهد.',
  },
  {
    key: 'shop', badge: 'فروشگاه اینترنتی', name: 'فروشگاهی',
    desc: 'برای فروش آنلاین محصولات با تجربه خرید روان، سبد خرید و درگاه پرداخت امن.',
    price: '۴۰,۰۰۰,۰۰۰ تومان', note: 'پرداخت یک‌جا — بدون هزینه پنهان',
    features: ['دامنهٔ .IR رایگان + ۱ سال هاست هدیه', 'طراحی اختصاصی فروشگاه', 'مدیریت محصول، موجودی و سفارش‌ها', 'درگاه پرداخت امن + سئوی تکنیکال', 'تحویل ۳ تا ۴ هفته', '۳ ماه پشتیبانی رایگان'],
    foot: 'پنل مدیریت فروشگاه همراه با آموزش کامل تحویل داده می‌شود.',
  },
  {
    key: 'custom', badge: 'پروژه سفارشی', name: 'اختصاصی',
    desc: 'برای پروژه‌های خاص: سامانهٔ سفارشی، پلتفرم با منطق پیچیده یا قابلیت‌های منحصربه‌فرد.',
    price: 'از ۷۰,۰۰۰,۰۰۰ تومان', note: 'قیمت دقیق پس از جلسهٔ نیازسنجی رایگان',
    features: ['دامنهٔ .IR رایگان + ۱ سال هاست هدیه', 'تحلیل کامل نیازمندی‌های پروژه', 'طراحی و توسعهٔ کاملاً سفارشی', 'پنل‌ها و قابلیت‌های اختصاصی کسب‌وکار', 'معماری فنی برای مقیاس‌پذیری', 'همراهی فنی پس از انتشار'],
    foot: 'پس از تحلیل نیازها، پروپوزال مکتوب و شفاف ارائه می‌شود.',
  },
];

export const SERVICE_CARDS = [
  { slug: 'company-website', cat: 'طراحی و توسعه وب', t: 'طراحی سایت شرکتی', d: 'حضور حرفه‌ای برای معرفی خدمات، پروژه‌ها و تیم شرکت شما.' },
  { slug: 'ecommerce', cat: 'طراحی و توسعه وب', t: 'طراحی فروشگاه اینترنتی', d: 'تجربه خرید روان، درگاه پرداخت و صفحه محصول تبدیل‌محور.' },
  { slug: 'speed-optimization', cat: 'سئو و تولید محتوا', t: 'بهینه‌سازی سرعت و عملکرد', d: 'Core Web Vitals، تصاویر و زیرساخت؛ سایتی که سریع جواب می‌دهد.' },
  { slug: 'ui-ux', cat: 'طراحی و توسعه وب', t: 'طراحی رابط و تجربه کاربری', d: 'مسیر کاربر مهندسی می‌شود تا هر صفحه به هدف خودش برسد.' },
  { slug: 'seo', cat: 'سئو و تولید محتوا', t: 'سئو تکنیکال و محتوایی', d: 'زیرساخت فنی استاندارد و انتخاب هوشمندانه کلمات کلیدی.' },
  { slug: 'content', cat: 'سئو و تولید محتوا', t: 'تولید مقالات سئومحور', d: 'مقالات تخصصی با تحقیق واقعی و ساختار استاندارد انتشار.' },
  { slug: 'support', cat: 'هوش مصنوعی و پشتیبانی', t: 'پشتیبانی و نگهداری سایت', d: 'به‌روزرسانی امنیتی، پشتیبان‌گیری و توسعه مستمر پس از انتشار.' },
  { slug: 'ai-automation', cat: 'هوش مصنوعی و پشتیبانی', t: 'هوش مصنوعی و اتوماسیون', d: 'چت‌بات، دستیار اختصاصی و خودکارسازی فرایندهای تکراری.' },
];

// تصویر یکدست انسانی برای هر خدمت (WebP بهینه)
export const SVC_IMG: Record<string, string> = {
  'company-website': '/img/ai/svc-company.webp',
  'ecommerce': '/img/ai/svc-ecommerce.webp',
  'speed-optimization': '/img/ai/svc-speed.webp',
  'ui-ux': '/img/ai/svc-uiux.webp',
  'seo': '/img/ai/svc-seo.webp',
  'content': '/img/ai/svc-content.webp',
  'support': '/img/ai/svc-support.webp',
  'ai-automation': '/img/ai/svc-ai.webp',
};
export const svcImg = (slug: string): string => SVC_IMG[slug] ?? `/img/svc-${slug}.webp`;

export const HOME_FOUR = [
  {
    key: 'web', chip: 'طراحی سایت', cover: '/img/ai/svc-webdesign.webp',
    h: 'سایتی که هویت برند شما را می‌فروشد، نه قالبی که همه دارند',
    d: 'قالب آماده هزینه اولیه کمتری دارد، اما مخاطب حس «تکراری‌بودن» را حس می‌کند و توسعه بعدی گران تمام می‌شود. طراحی اختصاصی یعنی هر صفحه برای هدف مشخص آن ساخته شده باشد.',
    items: ['طراحی بر اساس پرسونای واقعی مخاطب — نه سلیقه لحظه‌ای', 'ساختار صفحه‌ها بر مبنای مسیر خرید یا تماس مشتری', 'کد تمیز و توسعه‌پذیر — قابلیت جدید بعداً بدون بازسازی اضافه می‌شود'],
    href: '/services/company-website', cta: 'صفحه خدمت طراحی سایت',
  },
  {
    key: 'seo', chip: 'سئو', cover: '/img/ai/svc-seo.webp',
    h: 'سئو یعنی ساختار درست؛ نه ترفند موقت',
    d: 'هیچ‌کس نمی‌تواند رتبه اول را تضمین کند — اما می‌توان زیرساختی ساخت که گوگل آن را دوست داشته باشد و محتوایی منتشر کرد که واقعاً سؤال مخاطب را پاسخ می‌دهد. نتیجه‌اش در طول زمان خودش را نشان می‌دهد.',
    items: ['سئوی تکنیکال: سرعت، ساختار آدرس‌ها، داده ساختاریافته', 'تحقیق کلمه کلیدی بر اساس نیت جست‌وجوی مخاطب شما', 'گزارش شفاف: می‌بینید چه کاری انجام شده و چه تغییری کرده'],
    href: '/services/seo', cta: 'صفحه خدمت سئو',
  },
  {
    key: 'content', chip: 'تولید محتوا', cover: '/img/ai/svc-content.webp',
    h: 'محتوایی که سؤال مشتری را پاسخ می‌دهد، فروش را می‌آورد',
    d: 'مقاله‌ای که فقط «کلمه کلیدی» داشته باشد خوانده نمی‌شود. محتوای خوب نیاز واقعی مخاطب را پیدا می‌کند، کامل پاسخ می‌دهد و خواننده را یک قدم به خرید نزدیک می‌کند — و همین محتواست که سئو را می‌سازد.',
    items: ['مقالات سئومحور با تحقیق واقعی — نه بازنویسی رقبا', 'لحن برند شما حفظ می‌شود؛ محتوا با شما یکدست است', 'تقویم انتشار منظم — وبلاگ از سردرگمی به دارایی تبدیل می‌شود'],
    href: '/services/content', cta: 'صفحه خدمت تولید محتوا',
  },
  {
    key: 'ai', chip: 'هوش مصنوعی', cover: '/img/ai/svc-ai.webp',
    h: 'کارهای تکراری تیم‌تان را به ابزار بسپارید',
    d: 'پاسخ‌دادن به سؤالات تکراری، پیش‌نویس محتوا و جمع‌آوری اطلاعات مشتری، ساعت‌ها از وقت تیم شما را می‌گیرد. دستیارهای هوشمند این کارها را خودکار می‌کنند تا انسان‌ها روی کارهای مهم تمرکز کنند.',
    items: ['چت‌بات آموزش‌دیده با محتوای سایت شما — پاسخ درست، نه حدس', 'اتصال امن سمت سرور — کلیدها هرگز در مرورگر قرار نمی‌گیرند', 'بازبینی انسانی روی خروجی‌ها — سرعت هوش مصنوعی، کیفیت انسانی'],
    href: '/services/ai-automation', cta: 'صفحه راهکارهای هوش مصنوعی',
  },
];
