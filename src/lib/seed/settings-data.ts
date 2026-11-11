/* ==========================================================================
   کافه دانش — دادهٔ اولیهٔ تنظیمات سایت (از سایت فعلی cdanesh.ir)
   همهٔ مقادیر از پنل مدیریت قابل ویرایش هستند.
   ========================================================================== */

export interface SiteSettings {
  identity: {
    brandFa: string;
    brandEn: string;
    tagline: string;
    logoImage: string;
    designer: string;
  };
  contact: {
    email: string;
    phone: string;
    phoneDisplay: string;
    address: string;
    hours: string;
    github: string;
    mapEmbed: string;
  };
  seo: {
    defaultTitle: string;
    titlePattern: string;
    defaultDescription: string;
    ogImage: string;
    keywords: string[];
  };
  menu: {
    main: { label: string; href: string }[];
    megaGroups: { title: string; items: { label: string; href: string; desc: string }[] }[];
    ctaLabel: string;
    ctaHref: string;
  };
  footer: {
    aboutText: string;
    colServices: { label: string; href: string }[];
    colQuick: { label: string; href: string }[];
    colContact: { label: string; href: string }[];
    copyright: string;
  };
  homepage: {
    introTitle: string;
    introText: string;
    advantagesTitle: string;
    advantages: { title: string; text: string }[];
    capabilities: { no: string; title: string; text: string }[];
    stepsTitle: string;
    steps: { title: string; text: string }[];
    stats: { value: string; label: string }[];
    ctaTitle: string;
    ctaText: string;
  };
}

export const SETTINGS_SEED: SiteSettings = {
  identity: {
    brandFa: 'کافه دانش',
    brandEn: 'Cafe Danesh',
    tagline: 'کافه دانش؛ طراحی سایت و تولید محتوای حرفه‌ای، با سئوی اصولی برای رشد کسب‌وکار.',
    logoImage: '/img/logo.svg',
    designer: 'Rasool Bahadoran',
  },
  contact: {
    email: 'info@cdanesh.ir',
    phone: '09165806207',
    phoneDisplay: '۰۹۱۶ ۵۸۰ ۶۲۰۷',
    address: 'بوشهر، خیابان شهید رجایی',
    hours: 'شنبه تا پنجشنبه ۹:۰۰ صبح تا ۶:۰۰ عصر',
    github: '',
    mapEmbed: '',
  },
  seo: {
    defaultTitle: 'طراحی سایت و تولید محتوا در بوشهر | کافه دانش',
    titlePattern: '%s | کافه دانش',
    defaultDescription:
      'کافه دانش (Cafe Danesh) با تمرکز بر طراحی سایت اختصاصی و تولید محتوای تخصصی فعالیت می‌کند؛ خدمات سئو نیز برای بهبود دیده‌شدن سایت ارائه می‌شود.',
    ogImage: '/img/og-default.webp',
    keywords: [
      'طراحی سایت بوشهر',
      'طراحی سایت اختصاصی',
      'طراحی فروشگاه اینترنتی',
      'تولید محتوای سایت',
      'مقالات تخصصی سایت',
      'سئو بوشهر',
      'Cafe Danesh',
      'کافه دانش',
    ],
  },
  menu: {
    main: [
      { label: 'نمونه‌کارها', href: '/portfolio' },
      { label: 'مجله', href: '/blog' },
      { label: 'تعرفه‌ها', href: '/pricing' },
      { label: 'درباره ما', href: '/about' },
      { label: 'تماس', href: '/contact' },
    ],
    megaGroups: [
      {
        title: 'طراحی سایت',
        items: [
          { label: 'طراحی سایت اختصاصی', href: '/services/company-website', desc: 'طراحی سایت شرکتی و فروشگاهی متناسب با نیاز کسب‌وکار' },
          { label: 'طراحی فروشگاه اینترنتی', href: '/services/ecommerce', desc: 'ساخت مسیر خرید ساده و قابل مدیریت' },
          { label: 'رابط و تجربه کاربری', href: '/services/ui-ux', desc: 'ساختار و تجربه کاربری روشن در موبایل و دسکتاپ' },
        ],
      },
      {
        title: 'تولید محتوا',
        items: [
          { label: 'تولید محتوای سایت', href: '/services/content', desc: 'مقالات و محتوای تخصصی متناسب با مخاطب برند' },
        ],
      },
      {
        title: 'سئو',
        items: [
          { label: 'خدمات سئو', href: '/services/seo', desc: 'بهینه‌سازی فنی و محتوایی برای دیده‌شدن در گوگل' },
          { label: 'بهینه‌سازی سرعت سایت', href: '/services/speed-optimization', desc: 'بهبود عملکرد فنی و تجربه کاربری' },
        ],
      },
    ],
    ctaLabel: 'درخواست مشاوره',
    ctaHref: '/consult',
  },
  footer: {
    aboutText:
      'کافه دانش (Cafe Danesh) با تمرکز بر طراحی سایت و تولید محتوای تخصصی؛ خدمات سئو نیز برای رشد و دیده‌شدن بهتر کسب‌وکار ارائه می‌شود.',
    colServices: [
      { label: 'طراحی سایت', href: '/services/company-website' },
      { label: 'تولید محتوا', href: '/services/content' },
      { label: 'سئو', href: '/services/seo' },
    ],
    colQuick: [
      { label: 'نمونه‌کارها', href: '/portfolio' },
      { label: 'مجله مقالات', href: '/blog' },
      { label: 'تعرفه‌ها', href: '/pricing' },
      { label: 'سؤالات متداول', href: '/faq' },
      { label: 'درباره ما', href: '/about' },
      { label: 'تماس با ما', href: '/contact' },
      { label: 'ثبت درخواست خدمات', href: '/consult' },
    ],
    colContact: [
      { label: 'فرم تماس و اطلاعات تماس', href: '/contact' },
      { label: 'درخواست مشاوره رایگان', href: '/consult' },
      { label: 'info@cdanesh.ir', href: 'mailto:info@cdanesh.ir' },
      { label: '۰۹۱۶ ۵۸۰ ۶۲۰۷', href: 'tel:+989165806207' },
    ],
    copyright: '© ۱۴۰۵ کافه دانش — تمامی حقوق محفوظ است.',
  },
  homepage: {
    introTitle: 'طراحی و توسعه وب‌سایت‌های شرکتی، فروشگاهی و اختصاصی؛ زیرساخت حرفه‌ای رشد کسب‌وکار شما',
    introText:
      'با طراحی سایت حرفه‌ای و تولید محتوای هدفمند، حضور آنلاین کسب‌وکارتان را می‌سازیم و توسعه می‌دهیم؛ سئو نیز در صورت نیاز به دیده‌شدن بهتر شما در گوگل کمک می‌کند.',
    advantagesTitle: 'پنج دلیل که نتیجه کار را متمایز می‌کند',
    advantages: [
      {
        title: 'طراحی متناسب با نیاز کسب‌وکار شما',
        text: 'قبل از هر خط کد، کسب‌وکار، مخاطب و هدف شما تحلیل می‌شود؛ نتیجه سایتی است که برای «شما» ساخته شده، نه برای همه.',
      },
      {
        title: 'تجربه کاربری و نمایش درست در موبایل',
        text: 'بیشتر بازدیدها از گوشی است؛ هر صفحه برای موبایل، تبلت و دسکتاپ جداگانه تست می‌شود، نه اینکه فقط «کوچک‌شده» باشد.',
      },
      {
        title: 'زیرساخت فنی و سئوی اصولی از روز اول',
        text: 'سرعت، ساختار استاندارد و آماده‌بودن برای موتور جست‌وجو جزو تحویل اولیه است؛ بعداً هزینه اضافه برای «اصلاح زیرساخت» نمی‌پردازید.',
      },
      {
        title: 'قابلیت توسعه و مدیریت محتوا',
        text: 'پنل مدیریتی کامل با آموزش؛ محتوای جدید خودتان منتشر کنید و قابلیت‌های جدید بدون بازسازی اضافه شوند.',
      },
      {
        title: 'استفاده هدفمند از هوش مصنوعی',
        text: 'جایی که واقعاً ارزش دارد: پاسخ‌گویی، تولید پیش‌نویس و خودکارسازی کار تکراری — با بازبینی انسانی، نه جایگزینی کیفیت.',
      },
    ],
    capabilities: [
      { no: '۰۱', title: 'طراحی سایت', text: 'طراحی سایت شرکتی و فروشگاهی متناسب با هویت برند، نیاز مخاطب و هدف کسب‌وکار.' },
      { no: '۰۲', title: 'تولید محتوا', text: 'تولید مقالات تخصصی و محتوای صفحات سایت با تحقیق، ساختار روشن و تقویم انتشار.' },
      { no: '۰۳', title: 'سئو', text: 'بهینه‌سازی فنی و محتوایی برای کمک به دیده‌شدن سایت در جست‌وجوهای مرتبط.' },
    ],
    stepsTitle: 'شش مرحله شفاف، از درخواست تا تحویل',
    steps: [
      { title: 'ثبت درخواست و نیازسنجی', text: 'فرم را پر می‌کنید یا تماس می‌گیرید؛ در جلسه اول کسب‌وکارتان را می‌شنویم.' },
      { title: 'تحلیل و تعیین محدوده', text: 'دامنه کار، امکانات، زمان‌بندی و برآورد شفاف — پیش از هر تعهدی.' },
      { title: 'طراحی ساختار و رابط کاربری', text: 'معماری اطلاعات و طراحی UI/UX؛ با بازبینی و تأیید شما.' },
      { title: 'توسعه و پیاده‌سازی', text: 'کدنویسی استاندارد، پیاده‌سازی محتوا و اتصال قابلیت‌ها.' },
      { title: 'بررسی کیفیت، عملکرد و سئو', text: 'تست سرعت، ریسپانسیو و دسترس‌پذیری؛ بررسی ساختار سئو.' },
      { title: 'تحویل و پشتیبانی', text: 'انتشار، آموزش پنل مدیریت و پشتیبانی توافق‌شده پس از تحویل.' },
    ],
    stats: [
      { value: '۳', label: 'حوزهٔ اصلی خدمات' },
      { value: '۲', label: 'محور اصلی تمرکز' },
      { value: '۶', label: 'مرحلهٔ شروع همکاری' },
    ],
    ctaTitle: 'برای طراحی سایت یا تولید محتوای کسب‌وکارتان آماده‌اید؟',
    ctaText:
      'در جلسه مشاوره، نیاز شما به طراحی سایت یا تولید محتوا را بررسی می‌کنیم و در صورت نیاز، مسیر سئو را هم پیشنهاد می‌دهیم.',
  },
};

export const SETTINGS_KEY = 'site';
export const SEED_VERSION = 2;
