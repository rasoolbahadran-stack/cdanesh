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
  // برخی ردیف‌های قدیمی دیتابیس بدون پسوند «-astro» ذخیره شده‌اند (bazarino در برابر bazarino-astro)؛
  // بدون این تطبیق، همان پروژه دو بار با دو تصویر متفاوت نمایش داده می‌شود.
  const findLocal = (slug: string) =>
    localPortfolio.find((item) => item.slug === slug) ??
    localPortfolio.find((item) => item.slug === `${slug}-astro`);
  rows.forEach((row) => {
    const remote = row as unknown as PortfolioItem;
    const local = findLocal(remote.slug);
    if (!local && merged.has(remote.slug)) return;
    const liveUrl = remote.liveUrl?.trim() || local?.liveUrl || '';

    // وقتی ردیف دیتابیس به آیتم محلی می‌چسبد، با کلید اسلاگ محلی جایگزین می‌شود تا پروژه تکراری ساخته نشود
    merged.set(local ? local.slug : remote.slug, local ? {
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

// ── محتوای مقاله: شمارش واژه، زمان مطالعه صادقانه و لنگر تیترها ──
const stripTags = (s: unknown) => String(s || '').replace(/<[^>]+>/g, ' ');
const countWords = (s: unknown) => stripTags(s).split(/\s+/).filter(Boolean).length;

export function postWordCount(p: Post): number {
  return (p.blocks || []).reduce((sum, b) => {
    const blk = b as unknown as { t?: string; x?: string; items?: string[] };
    if (blk.t === 'ul' || blk.t === 'ol') {
      return sum + (blk.items || []).reduce((s2, it) => s2 + countWords(it), 0);
    }
    return sum + countWords(blk.x);
  }, 0);
}

export function postReadMinutes(p: Post): number {
  return Math.max(3, Math.round(postWordCount(p) / 190));
}

/** برای بلوک‌های HTML یکپارچه (مقالات قدیمی دیتابیس) به تیترها id لنگر می‌دهد و فهرست آن‌ها را برمی‌گرداند. */
export function injectHtmlHeadingIds(
  html: string,
  blockIndex: number,
): { html: string; headings: Array<{ text: string; level: string; id: string }> } {
  const headings: Array<{ text: string; level: string; id: string }> = [];
  let k = 0;
  const out = String(html || '').replace(/<h([234])>([\s\S]*?)<\/h\1>/g, (_m, lvl: string, inner: string) => {
    k += 1;
    const id = `content-heading-${blockIndex + 1}-${k}`;
    headings.push({ text: String(inner).replace(/<[^>]+>/g, '').trim(), level: `h${lvl}`, id });
    return `<h${lvl} id="${id}">${inner}</h${lvl}>`;
  });
  return { html: out, headings };
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

// توضیح هر آیتم مگا منو حداکثر یک خط کوتاه — مگا منو باید اسکن‌پذیر باشد
export const MEGA_GROUPS = [
  {
    title: 'طراحی و توسعه وب‌سایت',
    items: [
      { href: '/services/company-website', t: 'طراحی سایت شرکتی', d: 'معرفی برند و خدمات' },
      { href: '/services/ecommerce', t: 'طراحی فروشگاه اینترنتی', d: 'فروش آنلاین محصولات' },
      { href: '/services/custom-web', t: 'طراحی وب‌سایت اختصاصی', d: 'وب‌اپلیکیشن اختصاصی' },
      { href: '/services/ui-ux', t: 'طراحی رابط کاربری', d: 'UI/UX؛ مسیر کاربری هدفمند' },
    ],
  },
  {
    title: 'خدمات مکمل',
    items: [
      { href: '/services/seo', t: 'سئو تکنیکال و محتوایی', d: 'دیده‌شدن در گوگل' },
      { href: '/services/content', t: 'تولید محتوای تخصصی', d: 'جذب مخاطب با محتوا' },
      { href: '/services/content-strategy', t: 'استراتژی و تقویم محتوایی', d: 'تقویم انتشار محتوا' },
    ],
  },
  {
    title: 'پس از راه‌اندازی',
    items: [
      { href: '/services/support', t: 'مدیریت و پشتیبانی سایت', d: 'نگهداری پس از انتشار' },
      { href: '/services/speed-optimization', t: 'بهینه‌سازی سرعت سایت', d: 'بهبود سرعت و عملکرد' },
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
  { t: 'ثبت درخواست و نیازسنجی', d: 'در گفت‌وگوی اولیه، درباره کسب‌وکار، اهداف، مخاطبان و انتظارات شما از وب‌سایت صحبت می‌کنیم.' },
  { t: 'تحلیل و تعیین محدوده پروژه', d: 'نیازمندی‌ها، امکانات، محدوده اجرا، زمان‌بندی و هزینه پروژه مشخص می‌شوند تا پیش از شروع، تصویر روشنی از مسیر همکاری داشته باشید.' },
  { t: 'طراحی ساختار و رابط کاربری', d: 'ساختار صفحات، معماری اطلاعات و تجربه کاربری طراحی می‌شود و طرح‌ها برای بررسی و تأیید در اختیار شما قرار می‌گیرد.' },
  { t: 'توسعه و پیاده‌سازی', d: 'پس از تأیید طراحی، توسعه فنی، پیاده‌سازی صفحات، ورود محتوا و اتصال امکانات موردنیاز انجام می‌شود.' },
  { t: 'بررسی کیفیت و بهینه‌سازی', d: 'نمایش صفحات در دستگاه‌های مختلف، عملکرد فنی، سرعت، فرم‌ها و ساختار پایه سئو بررسی و ایرادهای شناسایی‌شده اصلاح می‌شوند.' },
  { t: 'تحویل، آموزش و پشتیبانی', d: 'وب‌سایت منتشر می‌شود، دسترسی‌ها و آموزش‌های لازم ارائه می‌شوند و پشتیبانی مطابق توافق انجام خواهد شد.' },
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

// هر مزیت با توضیح تک‌خطی — صفحه اصلی باید اسکن‌پذیر باشد
export const PROS = [
  { t: 'طراحی متناسب با نیاز واقعی کسب‌وکار', d: 'پیش از شروع طراحی و توسعه، اهداف، مخاطبان و نیازهای کسب‌وکار شما بررسی می‌شوند تا راهکاری متناسب با شرایط و مسیر فعالیتتان شکل بگیرد.' },
  { t: 'تجربه کاربری و نمایش استاندارد در همه دستگاه‌ها', d: 'ساختار صفحات و مسیر حرکت کاربران با توجه به تجربه کاربری طراحی می‌شود و نمایش سایت در موبایل، تبلت و دسکتاپ مورد بررسی قرار می‌گیرد.' },
  { t: 'زیرساخت فنی و سئوی اصولی از ابتدا', d: 'ساختار فنی استاندارد، بهینه‌سازی‌های پایه سرعت و اصول سئو از مراحل اولیه پروژه در نظر گرفته می‌شوند تا سایت از ابتدا برای توسعه و دیده‌شدن در موتورهای جست‌وجو آماده باشد.' },
  { t: 'مدیریت آسان و امکان توسعه محتوا', d: 'متناسب با نوع پروژه، امکانات مدیریتی و آموزش لازم ارائه می‌شود تا بتوانید محتوای سایت و بخش‌های قابل مدیریت آن را بدون وابستگی دائمی به برنامه‌نویس به‌روزرسانی کنید.' },
  { t: 'پشتیبانی و توسعه پس از تحویل', d: 'ارتباط ما با تحویل سایت پایان نمی‌یابد. پس از انتشار، مطابق شرایط توافق‌شده برای پشتیبانی، نگهداری و توسعه قابلیت‌های جدید همراه شما خواهیم بود.' },
];

export const PRICING = [
  {
    key: 'company', badge: 'وب‌سایت شرکتی و معرفی', name: 'شرکتی', btn: 'درخواست پکیج شرکتی',
    desc: 'برای کسب‌وکارهایی که به یک وب‌سایت حرفه‌ای برای معرفی برند، نمایش خدمات و دریافت درخواست مشتریان نیاز دارند؛ با طراحی اختصاصی و امکانات مدیریتی موردنیاز برای حضور مؤثر در فضای آنلاین.',
    price: '۱۵,۰۰۰,۰۰۰ تومان', note: 'پرداخت یک‌جا',
    features: ['طراحی اختصاصی و بدون قالب آماده، تا ۸ صفحه', 'دامنه .IR رایگان + ۶ ماه هاست هدیه', 'صفحات اصلی شامل خانه، خدمات، درباره ما، تماس و صفحات موردنیاز', 'بخش مجله مقالات با پنل فارسی و آموزش مدیریت', 'فرم‌های تماس و درخواست مشاوره', 'سئوی پایه شامل ساختار استاندارد صفحات، تنظیم متاها و اتصال به Google Search Console', 'نمایش ریسپانسیو در موبایل، تبلت و دسکتاپ', 'زمان تحویل: ۲ تا ۳ هفته', '۳ ماه پشتیبانی رایگان'],
    foot: 'وب‌سایت با ساختار استاندارد، نمایش مناسب در دستگاه‌های مختلف و امکانات مدیریتی موردتوافق تحویل داده می‌شود.',
  },
  {
    key: 'shop', badge: 'پیشنهاد کافه دانش برای فروش آنلاین', name: 'فروشگاهی', featured: true, btn: 'درخواست پکیج فروشگاهی',
    desc: 'برای کسب‌وکارهایی که قصد دارند محصولات خود را به‌صورت آنلاین عرضه کنند؛ با امکانات مدیریت محصولات، دسته‌بندی، موجودی، سفارش‌ها و پرداخت اینترنتی.',
    price: '۳۷,۰۰۰,۰۰۰ تومان', note: 'پرداخت یک‌جا',
    features: ['شامل تمام امکانات پکیج شرکتی', 'دامنه .IR رایگان + یک سال هاست هدیه', 'مدیریت محصولات، دسته‌بندی‌ها، موجودی و سفارش‌ها', 'سبد خرید و اتصال به درگاه پرداخت آنلاین', 'صفحات محصول با ساختار مناسب تجربه کاربری و سئو', 'جست‌وجو و فیلتر هوشمند محصولات', 'کد تخفیف و امکانات اجرای کمپین‌های فروش', 'گزارش فروش و آمار مشتریان', 'آموزش کامل پنل مدیریت فروشگاه', 'زمان تحویل: ۴ تا ۶ هفته', '۳ ماه پشتیبانی رایگان'],
    foot: 'فروشگاه همراه با پنل مدیریت و آموزش لازم تحویل داده می‌شود تا مدیریت محصولات، سفارش‌ها و محتوای فروشگاه در اختیار شما باشد.',
  },
  {
    key: 'custom', badge: 'برای پروژه‌های خاص و پیشرفته', name: 'اختصاصی', btn: 'درخواست مشاوره پروژه اختصاصی',
    desc: 'برای کسب‌وکارهایی که به راهکاری فراتر از یک وب‌سایت معمولی نیاز دارند؛ از سامانه‌های مدیریتی و پنل‌های اختصاصی تا وب‌اپلیکیشن‌ها و پلتفرم‌هایی با فرایندهای سفارشی.',
    price: 'از ۶۷,۰۰۰,۰۰۰ تومان', note: 'برآورد نهایی پس از جلسه نیازسنجی رایگان و بررسی محدوده پروژه',
    features: ['تحلیل و مستندسازی نیازمندی‌ها', 'طراحی و توسعه کاملاً سفارشی', 'طراحی پنل‌ها و ماژول‌های اختصاصی کسب‌وکار', 'معماری فنی متناسب با نیاز و قابلیت توسعه پروژه', 'تحویل مرحله‌ای همراه با جلسات هماهنگی', 'انتخاب دامنه و زیرساخت میزبانی متناسب با نیاز پروژه', 'همراهی و پشتیبانی فنی پس از انتشار مطابق توافق'],
    foot: 'پس از بررسی نیازها، پروپوزال مکتوب شامل محدوده اجرا، امکانات، زمان‌بندی و برآورد هزینه ارائه می‌شود.',
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
