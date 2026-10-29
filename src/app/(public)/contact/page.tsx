import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/site/breadcrumbs'
import RequestForm from '@/components/site/request-form'
import { getSiteSettings } from '@/lib/settings'

export const metadata: Metadata = {
  title: 'تماس با ما',
  description: 'راه‌های ارتباط با استودیو دیجیتال کافه‌دانش — ایمیل، تلفن و فرم پیام.',
  alternates: { canonical: '/contact' },
  openGraph: { title: 'تماس با ما | کافه‌دانش', url: '/contact' },
}

export default async function ContactPage() {
  const s = await getSiteSettings()

  return (
    <>
      {/* ═══ هیرو تماس ═══ */}
      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs items={[{ label: 'تماس با ما' }]} />
          <span className="eyebrow reveal in">تماس با ما</span>
          <h1 className="h1 reveal in">
            خوشحال می‌شویم <span className="gold">شنیدیم</span>
          </h1>
          <p className="lead reveal in" data-delay="1">
            برای سؤال، پیشنهاد همکاری یا سفارش پروژه — از هر مسیری که راحت‌ترید پیام بدهید.
            پاسخ‌گویی در ساعات کاری معمولاً حداکثر یک روز کاری است.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="wrap">
          <div className="contact-grid">
            <div className="contact-info">
              {/* ایمیل فقط در صورت ثبت در تنظیمات نمایش داده می‌شود */}
              {s.email && (
                <div className="contact-item">
                  <div className="bento-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="4" width="20" height="16" rx="3" />
                      <path d="m22 7-10 6L2 7" />
                    </svg>
                  </div>
                  <div>
                    <b>ایمیل</b>
                    <a href={`mailto:${s.email}`} dir="ltr">
                      {s.email}
                    </a>
                    <p className="small muted">برای مکاتبات رسمی و درخواست‌ها</p>
                  </div>
                </div>
              )}
              {s.phone && (
                <div className="contact-item">
                  <div className="bento-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3A19.5 19.5 0 0 1 5.2 13 19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
                    </svg>
                  </div>
                  <div>
                    <b>تلفن</b>
                    <a href={`tel:${s.phoneIntl}`} dir="ltr">
                      {s.phoneDisplay}
                    </a>
                    <p className="small muted">پاسخ‌گویی تلفنی در ساعات کاری</p>
                  </div>
                </div>
              )}
              <div className="contact-item">
                <div className="bento-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <b>ارتباط آنلاین</b>
                  <p>
                    ترجیح می‌دهید همه‌چیز کتبی باشد؟{' '}
                    <Link href="/request" style={{ color: 'var(--gold)' }}>
                      فرم درخواست خدمات
                    </Link>{' '}
                    دقیق‌ترین راه است؛ همه جزئیات را یک‌جا می‌گیرد.
                  </p>
                </div>
              </div>
              <div className="contact-item">
                <div className="bento-ico">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                </div>
                <div>
                  <b>زمان پاسخ</b>
                  <p className="muted" style={{ fontSize: '13px' }}>
                    ایمیل و فرم‌ها: حداکثر ۱ روز کاری — پیام‌های عاجل را در موضوع مشخص کنید.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <div className="form-card">
                <h2 className="h3" style={{ marginBottom: '6px' }}>
                  پیام مستقیم
                </h2>
                <p className="muted small" style={{ marginBottom: '26px' }}>
                  پیام شما ثبت می‌شود و در ساعات کاری حداکثر یک روز کاری پاسخ می‌گیرید.
                </p>
                <RequestForm defaultService="other" submitLabel="ارسال پیام" />
                <p className="form-note">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="4" y="10" width="16" height="11" rx="2.5" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                  <span>
                    اطلاعات شما فقط برای پاسخ به همین پیام استفاده می‌شود و مطابق{' '}
                    <Link href="/privacy" style={{ color: 'var(--gold)' }}>
                      سیاست حریم خصوصی
                    </Link>{' '}
                    نگهداری می‌شود.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
