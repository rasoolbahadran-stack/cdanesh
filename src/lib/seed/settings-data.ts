/* ==========================================================================
   کافه‌دانش — دادهٔ اولیهٔ تنظیمات سایت (از سایت فعلی cdanesh.ir)
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
    brandFa: 'کافه‌دانش',
    brandEn: 'CDANESH STUDIO',
    tagline: 'استودیو دیجیتال CDANESH STUDIO',
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
    defaultTitle: 'طراحی سایت اختصاصی و سئو در بوشهر | CDANESH STUDIO',
    titlePattern: '%s | CDANESH STUDIO',
    defaultDescription:
      'CDANESH STUDIO (کافه‌دانش): طراحی سایت اختصاصی، سئو تکنیکال و محتوایی، تولید مقالات تخصصی و راهکارهای هوش مصنوعی — همه در یک تیم.',
    ogImage: '/img/og-default.webp',
    keywords: [
      'طراحی سایت بوشهر',
      'طراحی سایت اختصاصی',
      'سئو بوشهر',
      'طراحی فروشگاه اینترنتی',
      'CDANESH STUDIO',
      'کافه‌دانش',
      'طراحی سایت شرکتی',
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
          { label: 'همه خدمات', href: '/services', desc: 'مرور کامل سرویس‌های کافه‌دانش' },
        ],
      },
    ],
    ctaLabel: 'درخواست مشاوره',
    ctaHref: '/consult',
  },
  footer: {
    aboutText:
      'CDANESH STUDIO (کافه‌دانش)؛ طراحی سایت، سئو و راهکارهای هوشمند برای رشد واقعی کسب‌وکار شما.',
    colServices: [
      { label: 'همه خدمات', href: '/services' },
      { label: 'طراحی سایت', href: '/services/company-website' },
      { label: 'فروشگاه اینترنتی', href: '/services/ecommerce' },
      { label: 'سئو و بهینه‌سازی', href: '/services/seo' },
      { label: 'تولید محتوا', href: '/services/content' },
      { label: 'هوش مصنوعی و اتوماسیون', href: '/services/ai-automation' },
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
    copyright: '© ۱۴۰۵ CDANESH STUDIO — تمامی حقوق محفوظ است.',
  },
  homepage: {
    introTitle: 'سایت، محتوا و هوش مصنوعی؛ سه موتور رشد کسب‌وکار شما',
    introText:
      'سایتی که برند شما را معرفی می‌کند، محتوایی که مخاطب را می‌آورد و ابزارهایی که کارهای تکراری را حذف می‌کنند — همه را یک تیم، با یک نقشه راه و تحویل مرحله‌به‌مرحله انجام می‌دهد.',
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
      { no: '۰۱', title: 'طراحی سایت اختصاصی', text: 'سایت شما از صفر برای برند و اهداف خودتان طراحی می‌شود؛ نه یک قالب آماده با اسم شما. نتیجه: تمایز واقعی در بازار.' },
      { no: '۰۲', title: 'سئو تکنیکال و محتوایی', text: 'از سرعت و ساختار فنی تا انتخاب کلمه کلیدی و معماری محتوا.' },
      { no: '۰۳', title: 'تولید محتوای تخصصی', text: 'مقالات ساختاریافته با تحقیق واقعی؛ محتوایی که هم کاربر را پاسخ می‌دهد و هم موتور جست‌وجو را.' },
      { no: '۰۴', title: 'استراتژی و تقویم محتوایی', text: 'نقشه راه انتشار منظم؛ تا وبلاگ شما از «نوشته‌های پراکنده» به یک دارایی تبدیل شود.' },
      { no: '۰۵', title: 'عملکرد و تجربه کاربری', text: 'سرعت، دسترس‌پذیری و روانی تعامل؛ سنجه‌هایی که هم کاربر حس می‌کند و هم گوگل اندازه می‌گیرد.' },
      { no: '۰۶', title: 'هوش مصنوعی و اتوماسیون', text: 'دستیارهای هوشمند، ابزارهای تولید محتوا و خودکارسازی کارهای تکراری؛ با اتصال امن سمت سرور و بازبینی انسانی.' },
      { no: '۰۷', title: 'پشتیبانی و توسعه مداوم', text: 'سایت پس از انتشار «تمام‌شده» نیست؛ نگهداری امنیتی، به‌روزرسانی و توسعه قابلیت‌های جدید ادامه مسیر است.' },
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
      { value: '۸', label: 'خدمت تخصصی در یک تیم واحد' },
      { value: '۷', label: 'توانمندی اصلی تیم' },
      { value: '۶', label: 'مرحلهٔ شروع همکاری' },
    ],
    ctaTitle: 'برای شروع دیجیتال کسب‌وکارتان آماده‌اید؟',
    ctaText:
      'جلسه اول مشاوره رایگان است: اهداف‌تان را می‌شنویم، نیازها را مشخص می‌کنیم و مسیر پیشنهادی را برای شروع همکاری با هم می‌چینیم.',
  },
};

export const SETTINGS_KEY = 'site';
export const SEED_VERSION = 2;
