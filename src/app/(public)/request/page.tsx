import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import Breadcrumbs from '@/components/site/breadcrumbs'
import RequestForm from '@/components/site/request-form'
import FaqAccordion from '@/components/site/faq-accordion'
import { getFaqForPage } from '@/lib/content'

export const metadata: Metadata = {
  title: 'ثبت درخواست خدمات',
  description:
    'فرم درخواست مشاوره و سفارش خدمات طراحی سایت، سئو، تولید محتوا و راهکارهای هوش مصنوعی.',
  alternates: { canonical: '/request' },
  openGraph: { title: 'ثبت درخواست خدمات | کافه‌دانش', url: '/request' },
}

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ pkg?: string }>
}) {
  const faq = await getFaqForPage('services')

  // پیش‌انتخاب خدمت از لینک پکیج‌ها (?pkg=design-pro)
  const { pkg } = await searchParams
  let defaultService: string | undefined
  if (pkg) {
    const selected = await db.package.findUnique({ where: { slug: pkg } })
    if (selected?.isPublished) defaultService = selected.serviceType
  }

  return (
    <>
      {/* ═══ هیرو درخواست ═══ */}
      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs items={[{ label: 'ثبت درخواست' }]} />
          <span className="eyebrow reveal in">ثبت درخواست خدمات</span>
          <h1 className="h1 reveal in">
            پروژه‌تان را <span className="gold">دقیق</span> بگویید تا دقیق جواب بگیرید
          </h1>
          <p className="lead reveal in" data-delay="1">
            این فرم کمک می‌کند قبل از جلسه مشاوره، تصویر روشنی از نیاز شما داشته باشیم. همه فیلدها
            محرمانه‌اند و فقط برای آماده‌کردن پیشنهاد استفاده می‌شوند.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="wrap" style={{ maxWidth: '880px' }}>
          <div className="form-card reveal">
            <RequestForm defaultService={defaultService} submitLabel="ثبت درخواست" />
            <p className="form-note">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="10" width="16" height="11" rx="2.5" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              <span>
                اطلاعات شما فقط برای پاسخ به همین درخواست استفاده می‌شود —{' '}
                <Link href="/privacy" style={{ color: 'var(--gold)' }}>
                  سیاست حریم خصوصی
                </Link>
                .
              </span>
            </p>
          </div>
          <div className="feat-grid" style={{ marginTop: '40px' }}>
            <div className="feat-card reveal">
              <div className="bento-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20l1-4.9a8.4 8.4 0 1 1 17-3.6Z" />
                </svg>
              </div>
              <b>بعد از ارسال چه می‌شود؟</b>
              <p>درخواست شما در پنل ثبت می‌شود؛ حداکثر ۱ روز کاری بعد برای هماهنگی جلسه تماس می‌گیریم.</p>
            </div>
            <div className="feat-card reveal" data-delay="1">
              <div className="bento-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14.5 4 20 9.5 9.5 20 4 20 4 14.5Z" />
                </svg>
              </div>
              <b>در جلسه مشاوره چه می‌گذرد؟</b>
              <p>اهداف، مخاطب و بودجه واقعی بررسی می‌شود و مسیر پیشنهادی با گزینه‌های مختلف ارائه می‌گردد.</p>
            </div>
            <div className="feat-card reveal" data-delay="2">
              <div className="bento-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <b>پیشنهاد شفاف</b>
              <p>دامنه کار، زمان‌بندی و هزینه در قالب یک پیشنهاد مکتوب و قابل مقایسه تحویل می‌شود.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ سؤالات متداول همکاری و سفارش ═══ */}
      {faq.length > 0 && (
        <section className="section-tight">
          <div className="wrap" style={{ maxWidth: '880px' }}>
            <div className="faq-group">
              <b>سؤالات متداول</b>
              <FaqAccordion items={faq} schema={false} />
            </div>
          </div>
        </section>
      )}
    </>
  )
}
