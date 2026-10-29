// ─── پیکربندی ایستای سایت (اطلاعات حساس از دیتابیس/تنظیمات می‌آید) ──

export const SITE = {
  name: 'کافه‌دانش',
  latinName: 'CDANESH STUDIO',
  domain: 'cdanesh.ir',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cdanesh.ir',
}

/** انواع خدمت قابل انتخاب در فرم درخواست */
export const REQUEST_SERVICE_TYPES = [
  'web-design',
  'e-commerce',
  'uiux',
  'seo',
  'content-production',
  'speed-optimization',
  'ai-solutions',
  'support',
  'other',
] as const

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  'web-design': 'طراحی سایت',
  'e-commerce': 'فروشگاه اینترنتی',
  uiux: 'طراحی UI/UX',
  seo: 'سئو',
  'content-production': 'تولید محتوا',
  'speed-optimization': 'بهینه‌سازی سرعت',
  'ai-solutions': 'هوش مصنوعی و اتوماسیون',
  support: 'پشتیبانی و نگهداری',
  other: 'سایر',
}

/** محدوده بودجه (اختیاری) */
export const BUDGET_RANGES = [
  'کمتر از ۱۰ میلیون تومان',
  '۱۰ تا ۳۰ میلیون تومان',
  '۳۰ تا ۶۰ میلیون تومان',
  'بیش از ۶۰ میلیون تومان',
  'هنوز مطمئن نیستم',
] as const
