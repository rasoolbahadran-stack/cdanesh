import Link from 'next/link'
import { getSiteSettings } from '@/lib/settings'

export default async function SiteFooter() {
  const s = await getSiteSettings()
  const phoneHref = s.phone ? `tel:${s.phoneIntl || s.phone}` : null

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link className="brand" href="/">
              <span className="brand-mark" aria-hidden="true"><img src="/img/logo.svg" alt="" /></span>
              <span className="brand-name">{s.siteName}<small>CDANESH STUDIO</small></span>
            </Link>
            <p>{s.siteTagline}.</p>
            <Link className="btn btn-gold" href="/request">درخواست مشاوره رایگان</Link>
          </div>

          <div className="footer-col">
            <b>خدمات</b>
            <ul>
              <li><Link href="/services/web-design">طراحی سایت</Link></li>
              <li><Link href="/services/seo">سئو و بهینه‌سازی</Link></li>
              <li><Link href="/services/content-production">تولید محتوا</Link></li>
              <li><Link href="/services/ai-solutions">هوش مصنوعی و اتوماسیون</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <b>دسترسی سریع</b>
            <ul>
              <li><Link href="/portfolio">نمونه‌کارها</Link></li>
              <li><Link href="/blog">مجله مقالات</Link></li>
              <li><Link href="/faq">سؤالات متداول</Link></li>
              <li><Link href="/about">درباره ما</Link></li>
              <li><Link href="/contact">تماس با ما</Link></li>
              <li><Link href="/request">ثبت درخواست خدمات</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <b>راه‌های ارتباطی</b>
            <ul>
              <li><Link href="/contact">فرم تماس و اطلاعات تماس</Link></li>
              <li><Link href="/request">درخواست مشاوره رایگان</Link></li>
              {phoneHref && (
                <li>
                  <a href={phoneHref} dir="ltr">{s.phoneDisplay}</a>
                </li>
              )}
              {s.ownerName && (
                <li>
                  {s.ownerName}
                  {s.ownerTitle ? <span className="muted"> — {s.ownerTitle}</span> : null}
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="footer-contact">
          <div className="fc-links">
            <Link href="/privacy">حریم خصوصی</Link>
            <Link href="/terms">شرایط استفاده</Link>
          </div>
          {s.email ? <a href={`mailto:${s.email}`} dir="ltr">{s.email}</a> : null}
          {phoneHref ? <a href={phoneHref} dir="ltr">{s.phoneDisplay}</a> : null}
        </div>

        <div className="footer-copy">
          © کافه‌دانش — تمامی حقوق محفوظ است.
          {s.ownerName ? <span className="muted"> مدیریت: {s.ownerName}</span> : null}
        </div>
      </div>
      <div className="footer-mark" aria-hidden="true">کافه‌دانش</div>
    </footer>
  )
}
