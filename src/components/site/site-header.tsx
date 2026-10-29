import Link from 'next/link'
import { getSiteSettings } from '@/lib/settings'
import SiteChrome from './chrome'

/** مسیرهای منو — در صورت تغییر ساختار سایت فقط همین‌جا به‌روزرسانی می‌شود */
const SERVICES_MEGA = [
  {
    title: 'طراحی و توسعه وب',
    icon: 'M3 4h18v16H3zM3 9h18M8 21V9',
    items: [
      { href: '/services/web-design', b: 'طراحی سایت اختصاصی', s: 'سایت سفارشی متناسب با برند و اهداف شما' },
      { href: '/services/e-commerce', b: 'فروشگاه اینترنتی', s: 'تجربه خرید روان با درگاه پرداخت امن' },
      { href: '/services/uiux', b: 'طراحی UI/UX', s: 'تجربه کاربری مهندسی‌شده و تمیز' },
    ],
  },
  {
    title: 'سئو و تولید محتوا',
    icon: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm10 17-4.3-4.3M11 8v6M8 11h6',
    items: [
      { href: '/services/seo', b: 'سئو تکنیکال و محتوایی', s: 'زیرساخت فنی استاندارد و رشد ارگانیک' },
      { href: '/services/content-production', b: 'مقالات تخصصی و سئوشده', s: 'محتوای ساختاریافته با تحقیق واقعی' },
      { href: '/services/speed-optimization', b: 'بهینه‌سازی سرعت', s: 'Core Web Vitals و تجربه سریع کاربر' },
    ],
  },
  {
    title: 'هوش مصنوعی و پشتیبانی',
    icon: 'M12 2v4m0 12v4M2 12h4m12 0h4M5 5l2.5 2.5m9 9L19 19M19 5l-2.5 2.5m-9 9L5 19',
    items: [
      { href: '/services/ai-solutions', b: 'دستیارهای هوشمند', s: 'چت‌بات و دستیار اختصاصی کسب‌وکار شما' },
      { href: '/services/support', b: 'پشتیبانی و نگهداری سایت', s: 'امنیت، به‌روزرسانی و همراهی مداوم' },
      { href: '/services', b: 'همه خدمات', s: 'مرور کامل سرویس‌های کافه‌دانش' },
    ],
  },
]

export default async function SiteHeader() {
  const s = await getSiteSettings()
  const phoneHref = s.phone ? `tel:${s.phoneIntl || s.phone}` : null

  return (
    <>
      <SiteChrome />
      <header className="site-header">
        <div className="nav-pill">
          <Link className="brand" href="/" aria-label="کافه‌دانش — صفحه اصلی">
            <span className="brand-mark" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/logo.svg" alt="" />
            </span>
            <span className="brand-name">
              {s.siteName}
              <small>CDANESH STUDIO</small>
            </span>
          </Link>

          <nav aria-label="ناوبری اصلی">
            <ul className="main-nav">
              <li className="has-mega">
                <Link href="/services" aria-haspopup="true">
                  خدمات
                  <svg className="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                </Link>
                <div className="mega" role="menu" aria-label="فهرست خدمات">
                  {SERVICES_MEGA.map((col) => (
                    <div className="mega-col" key={col.title}>
                      <b>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d={col.icon} /></svg>
                        {col.title}
                      </b>
                      {col.items.map((it) => (
                        <Link className="mega-item" href={it.href} key={it.href + it.b} role="menuitem">
                          <b>{it.b}</b>
                          <span>{it.s}</span>
                        </Link>
                      ))}
                    </div>
                  ))}
                  <div className="mega-rail">
                    <b>دسترسی سریع</b>
                    <Link href="/portfolio">نمونه‌کارها <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg></Link>
                    <Link href="/blog">مجله مقالات <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg></Link>
                    <Link href="/about">درباره ما <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg></Link>
                    <Link href="/contact">تماس با ما <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg></Link>
                    <div className="mega-card">
                      <b>مشاوره اولیه رایگان</b>
                      <p>در یک جلسه کوتاه، مسیر رشد دیجیتال کسب‌وکارتان را بررسی می‌کنیم.</p>
                      <Link className="btn btn-gold btn-sm" href="/request">شروع پروژه</Link>
                    </div>
                  </div>
                </div>
              </li>
              <li><Link href="/portfolio">نمونه‌کارها</Link></li>
              <li><Link href="/blog">مجله</Link></li>
              <li><Link href="/#process">فرایند همکاری</Link></li>
              <li><Link href="/about">درباره ما</Link></li>
              <li><Link href="/contact">تماس</Link></li>
            </ul>
          </nav>

          <div className="nav-actions">
            <Link className="btn btn-gold btn-sm" href="/request">درخواست مشاوره</Link>
            <button className="menu-toggle" aria-label="باز کردن منو" aria-expanded="false" aria-controls="drawer" type="button"><span /></button>
          </div>
        </div>
      </header>

      {/* منوی موبایل */}
      <div className="drawer-veil" aria-hidden="true" />
      <aside className="drawer" id="drawer" aria-label="منوی موبایل">
        <div className="drawer-head">
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true"><img src="/img/logo.svg" alt="" /></span>
            <span className="brand-name">{s.siteName}</span>
          </Link>
          <button className="drawer-close" aria-label="بستن منو" type="button">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="drawer-group">
          <b>خدمات</b>
          <Link href="/services">همه خدمات</Link>
          <Link href="/services/web-design">طراحی سایت</Link>
          <Link href="/services/e-commerce">فروشگاه اینترنتی</Link>
          <Link href="/services/seo">سئو و بهینه‌سازی</Link>
          <Link href="/services/content-production">تولید محتوا</Link>
          <Link href="/services/ai-solutions">هوش مصنوعی و اتوماسیون</Link>
        </div>
        <div className="drawer-group">
          <b>سایت</b>
          <Link href="/portfolio">نمونه‌کارها</Link>
          <Link href="/blog">مجله مقالات</Link>
          <Link href="/faq">سؤالات متداول</Link>
          <Link href="/about">درباره ما</Link>
          <Link href="/contact">تماس با ما</Link>
        </div>
        {phoneHref && (
          <a className="drawer-phone" href={phoneHref} dir="ltr">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2Z" /></svg>
            {s.phoneDisplay}
          </a>
        )}
        <Link className="btn btn-gold btn-block" href="/request">درخواست مشاوره رایگان</Link>
      </aside>
    </>
  )
}
