// دسترسی به داده‌ها: از دیتابیس Neon (در صورت اتصال) وگرنه از داده‌های محلی
// داده‌های محلی دقیقاً از آخرین وضعیت سایت کافه دانش استخراج شده‌اند.
import postsJson from '../data/content/posts.json';
import servicesJson from '../data/content/services.json';
import portfolioJson from '../data/content/portfolio.json';
import faqJson from '../data/content/faq.json';
import pagesJson from '../data/content/pages.json';
import type { Post, Service, PortfolioItem, FaqItem, PageDoc, Block } from './types';
import { getPosts as dbPosts, getPortfolio as dbPortfolio, dbAvailable } from './cms-db';
import { getVercelPortfolio, hasVercelPortfolioConfig } from './vercel-portfolio';

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

// پروژه‌های Astro از Vercel کشف می‌شوند؛ اطلاعات تصویری/توضیحی از محتوای محلی و CMS حفظ می‌شود.
const isPublicPortfolioItem = (item: PortfolioItem) =>
  !['cdanesh-galaxe', 'cdanesh-galaxy-source'].includes(item.slug) &&
  item.status === 'published' &&
  Boolean(item.liveUrl?.trim());

async function getLegacyPortfolio(): Promise<PortfolioItem[]> {
  const localItems = localPortfolio.filter(isPublicPortfolioItem);
  if (!useDb()) return localItems;

  const rows = await dbPortfolio().catch(() => null);
  if (!rows || !rows.length) return localItems;

  const merged = new Map(localItems.map((item) => [item.slug, item]));
  rows.forEach((row) => {
    const remote = row as unknown as PortfolioItem;
    const local = localPortfolio.find((item) => item.slug === remote.slug);
    const liveUrl = remote.liveUrl?.trim() || local?.liveUrl || '';

    merged.set(remote.slug, local ? {
      ...remote,
      title: local.title,
      excerpt: local.excerpt,
      description: local.description,
      category: local.category,
      tags: local.tags,
      cover: local.cover,
      preview: local.preview,
      sort: local.sort,
      liveUrl,
    } : { ...remote, liveUrl });
  });

  return [...merged.values()]
    .filter(isPublicPortfolioItem)
    .sort((a, b) => a.sort - b.sort);
}

export async function getPortfolio(): Promise<PortfolioItem[]> {
  if (hasVercelPortfolioConfig()) {
    const databaseItems = useDb()
      ? await dbPortfolio().catch(() => [])
      : [];

    try {
      return await getVercelPortfolio(
        localPortfolio as PortfolioItem[],
        databaseItems as unknown as PortfolioItem[],
      );
    } catch {
      // تا پیش از افزودن توکن یا هنگام اختلال موقت Vercel، سایت از کار نمی‌افتد.
      return getLegacyPortfolio();
    }
  }

  return getLegacyPortfolio();
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
  tagline: 'استودیو تخصصی طراحی و توسعه وب‌سایت',
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
    title: 'طراحی و توسعه وب‌سایت',
    items: [
      { href: '/services/company-website', t: 'طراحی سایت شرکتی', d: 'وب‌سایتی اختصاصی برای معرفی برند و خدمات شما' },
      { href: '/services/ecommerce', t: 'طراحی فروشگاه اینترنتی', d: 'فروش آنلاین با تجربه خرید روان و پنل مدیریت' },
      { href: '/services/custom-web', t: 'طراحی وب‌سایت اختصاصی', d: 'وب‌اپلیکیشن و سامانه‌های تحت وب با معماری قابل توسعه' },
      { href: '/services/ui-ux', t: 'طراحی رابط و تجربه کاربری', d: 'ساختار و مسیر کاربری ساده و هدفمند' },
    ],
  },
  {
    title: 'خدمات مکمل',
    items: [
      { href: '/services/seo', t: 'سئو تکنیکال و محتوایی', d: 'بهبود ساختار فنی و دیده‌شدن در جست‌وجو' },
      { href: '/services/content', t: 'تولید محتوا و مقالات تخصصی', d: 'محتوای هدفمند برای جذب مخاطب و پشتیبانی از سئو' },
      { href: '/services/content-strategy', t: 'استراتژی و تقویم محتوایی', d: 'برنامه‌ریزی موضوع و انتشار منظم محتوا' },
    ],
  },
  {
    title: 'پس از راه‌اندازی',
    items: [
      { href: '/services/support', t: 'مدیریت و پشتیبانی سایت', d: 'نگهداری، به‌روزرسانی و رفع خطاها پس از انتشار' },
      { href: '/services/speed-optimization', t: 'بهینه‌سازی سرعت سایت', d: 'بهبود سرعت و شاخص‌های تجربه کاربری' },
    ],
  },
];

export const FOOTER_LINKS = {
  services: [
    { href: '/services', t: 'همه خدمات' },
    { href: '/services/company-website', t: 'طراحی سایت شرکتی' },
    { href: '/services/ecommerce', t: 'طراحی فروشگاه اینترنتی' },
    { href: '/services/custom-web', t: 'طراحی وب‌سایت اختصاصی' },
    { href: '/services/ui-ux', t: 'طراحی رابط و تجربه کاربری' },
    { href: '/services/seo', t: 'خدمات سئو سایت' },
    { href: '/services/content', t: 'تولید محتوای سایت' },
    { href: '/services/support', t: 'مدیریت و پشتیبانی سایت' },
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
  { t: 'طراحی سایت شرکتی', d: 'وب‌سایتی اختصاصی برای معرفی حرفه‌ای کسب‌وکار، خدمات و پروژه‌های شما.' },
  { t: 'طراحی فروشگاه اینترنتی', d: 'فروش آنلاین با دسته‌بندی دقیق، صفحه محصول استاندارد و مسیر خرید ساده.' },
  { t: 'طراحی رابط و تجربه کاربری', d: 'معماری اطلاعات و طراحی رابط کاربری متناسب با مخاطب و هدف هر صفحه.' },
  { t: 'سئوی تکنیکال', d: 'بهبود ساختار فنی، ایندکس‌پذیری، داده‌های ساختاریافته و سلامت سایت.' },
  { t: 'سئوی محتوایی و تحقیق کلمات کلیدی', d: 'شناخت نیت جست‌وجو و ساختاردهی محتوا برای پاسخ‌گویی بهتر به مخاطب.' },
  { t: 'تولید مقالات تخصصی سایت', d: 'مقالات دقیق و کاربردی با تحقیق، تیترگذاری استاندارد و لینک‌سازی داخلی.' },
  { t: 'بهینه‌سازی سرعت و عملکرد', d: 'بهبود Core Web Vitals، تصاویر، فونت‌ها و تجربه سایت در موبایل.' },
  { t: 'پشتیبانی و نگهداری سایت', d: 'به‌روزرسانی، پشتیبان‌گیری و رسیدگی فنی پس از انتشار سایت.' },
];

export const PROS = [
  { t: 'طراحی متناسب با نیاز کسب‌وکار شما', d: 'قبل از هر خط کد، کسب‌وکار، مخاطب و هدف شما تحلیل می‌شود؛ نتیجه سایتی است که برای «شما» ساخته شده، نه برای همه.' },
  { t: 'تجربه کاربری و نمایش درست در موبایل', d: 'بیشتر بازدیدها از گوشی است؛ هر صفحه برای موبایل، تبلت و دسکتاپ جداگانه تست می‌شود، نه فقط «کوچک‌شده» است.' },
  { t: 'زیرساخت فنی و سئوی اصولی از روز اول', d: 'سرعت، ساختار استاندارد و آماده‌بودن برای موتور جست‌وجو جزو تحویل اولیه است؛ بعداً هزینه اضافه برای «اصلاح زیرساخت» نمی‌پردازید.' },
  { t: 'قابلیت توسعه و مدیریت محتوا', d: 'پنل مدیریتی کامل با آموزش؛ محتوای جدید خودتان منتشر کنید و قابلیت‌های جدید بدون بازسازی اضافه شوند.' },
  { t: 'پشتیبانی و توسعه پس از تحویل', d: 'پس از انتشار نیز برای نگهداری، به‌روزرسانی و توسعه قابلیت‌های موردنیاز همراه شما می‌مانیم.' },
];

export const PRICING = [
  {
    key: 'starter', badge: 'سایت معرفی', name: 'استارتر',
    desc: 'مناسب کسب‌وکارهایی که تازه حضور آنلاین می‌سازند و به سایتی منظم، سریع و مقرون‌به‌صرفه نیاز دارند.',
    price: '۱۵,۰۰۰,۰۰۰ تومان', note: 'پرداخت یک‌جا — بدون هزینه پنهان',
    features: ['دامنهٔ .IR رایگان', '۶ ماه هاست هدیه', 'تا ۶ صفحهٔ اختصاصی', 'بخش مجلهٔ مقالات با امکان انتشار و مدیریت مقاله', 'طراحی صفحهٔ اصلی حرفه‌ای و ریسپانسیو', 'تنظیمات اولیهٔ سئو و ساختار استاندارد', 'تحویل ۷ تا ۱۰ روز کاری', '۱ ماه پشتیبانی رایگان'],
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
  { slug: 'company-website', cat: 'سایت شرکتی', t: 'طراحی سایت شرکتی', d: 'حضور حرفه‌ای برای معرفی خدمات، پروژه‌ها و تیم شرکت شما.' },
  { slug: 'ecommerce', cat: 'فروشگاه اینترنتی', t: 'طراحی فروشگاه اینترنتی', d: 'تجربه خرید روان، درگاه پرداخت و صفحه محصول تبدیل‌محور.' },
  { slug: 'custom-web', cat: 'وب‌سایت اختصاصی', t: 'طراحی وب‌سایت اختصاصی', d: 'وب‌اپلیکیشن و سامانه‌های تحت وب با معماری فنی قابل توسعه.' },
  { slug: 'ui-ux', cat: 'تخصص UI/UX', t: 'طراحی رابط و تجربه کاربری', d: 'مسیر کاربر مهندسی می‌شود تا هر صفحه به هدف خودش برسد.' },
  { slug: 'seo', cat: 'خدمت مکمل', t: 'سئو تکنیکال و محتوایی', d: 'زیرساخت فنی استاندارد و انتخاب هوشمندانه کلمات کلیدی.' },
  { slug: 'content', cat: 'خدمت مکمل', t: 'تولید محتوای سایت و مقالات تخصصی', d: 'محتوای هدفمند برای جذب مخاطب و پشتیبانی از استراتژی سئو.' },
  { slug: 'content-strategy', cat: 'خدمت مکمل', t: 'استراتژی و تقویم محتوایی', d: 'برنامه‌ریزی موضوع‌ها و انتشار منظم مقالات متناسب با نیاز مخاطب.' },
  { slug: 'support', cat: 'پس از راه‌اندازی', t: 'مدیریت و پشتیبانی سایت', d: 'به‌روزرسانی امنیتی، پشتیبان‌گیری و توسعه مستمر پس از انتشار.' },
  { slug: 'speed-optimization', cat: 'پس از راه‌اندازی', t: 'بهینه‌سازی سرعت و عملکرد', d: 'Core Web Vitals، تصاویر و زیرساخت؛ سایتی که سریع جواب می‌دهد.' },
];

// تصویر یکدست انسانی برای هر خدمت (WebP بهینه)
export const SVC_IMG: Record<string, string> = {
  'company-website': '/img/ai/svc-company.webp',
  'ecommerce': '/img/ai/svc-ecommerce.webp',
  'custom-web': '/img/ai/svc-webdesign.webp',
  'speed-optimization': '/img/ai/svc-speed.webp',
  'ui-ux': '/img/ai/svc-uiux.webp',
  'seo': '/img/ai/svc-seo.webp',
  'content': '/img/ai/svc-content.webp',
  'content-strategy': '/img/ai/svc-content.webp',
  'support': '/img/ai/svc-support.webp',
};

export const svcImg = (slug: string): string => SVC_IMG[slug] ?? `/img/svc-${slug}.webp`;

export const HOME_FOUR = [
  {
    key: 'company', chip: 'طراحی سایت شرکتی', cover: '/img/ai/svc-company.webp',
    h: 'وب‌سایتی که اعتبار شرکت شما را می‌سازد',
    d: 'از معرفی خدمات و پروژه‌ها تا فرم تماس؛ ساختار سایت بر اساس مخاطب و هدف کسب‌وکار شما طراحی می‌شود تا هر صفحه مشتری را یک قدم به تماس نزدیک کند.',
    items: ['طراحی اختصاصی بر اساس هویت و نیاز کسب‌وکار', 'ساختار مشتری‌محور: مسیر «آشنایی → اعتماد → تماس»', 'کدنویسی تمیز، ریسپانسیو و آماده توسعه'],
    href: '/services/company-website', cta: 'جزئیات طراحی سایت شرکتی',
  },
  {
    key: 'ecommerce', chip: 'طراحی فروشگاه اینترنتی', cover: '/img/ai/svc-ecommerce.webp',
    h: 'فروشگاهی که مسیر خرید را کوتاه می‌کند',
    d: 'از صفحه محصول تا پرداخت، تجربه خرید بدون اصطکاک با پنل مدیریت ساده فارسی؛ ساختار سئوی فروشگاه هم از روز اول درست چیده می‌شود.',
    items: ['صفحه محصول بهینه برای تبدیل و درگاه پرداخت امن', 'مدیریت محصول، موجودی و سفارش‌ها از پنل فارسی', 'آموزش کامل پنل همراه با تحویل'],
    href: '/services/ecommerce', cta: 'جزئیات طراحی فروشگاه اینترنتی',
  },
  {
    key: 'custom', chip: 'وب‌سایت اختصاصی و UI/UX', cover: '/img/ai/svc-webdesign.webp',
    h: 'وقتی نیاز شما فراتر از قالب‌های آماده است',
    d: 'وب‌اپلیکیشن و سامانه‌های تحت وب با معماری فنی برای مقیاس‌پذیری؛ طراحی رابط و تجربه کاربری نیز جزء جدایی‌ناپذیر همه پروژه‌های ماست.',
    items: ['تحلیل نیازها و معماری فنی برای مقیاس‌پذیری', 'پنل‌ها و قابلیت‌های اختصاصی کسب‌وکار شما', 'طراحی UI/UX و توسعه فنی در یک تیم'],
    href: '/services/custom-web', cta: 'جزئیات پروژه‌های اختصاصی',
  },
];
