import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/site/breadcrumbs'
import PageFaq from '@/components/site/page-faq'

export const metadata: Metadata = {
  title: 'پشتیبانی و نگهداری سایت | امنیت، به‌روزرسانی و آرامش',
  description:
    'قرارداد پشتیبانی سایت با به‌روزرسانی امنیتی، پشتیبان‌گیری منظم، رفع ایراد و تغییرات محتوایی. سایت شما همیشه به‌روز و امن می‌ماند.',
}

export default function ServiceSupportPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs
            items={[{ label: 'خدمات', href: '/services' }, { label: 'پشتیبانی و نگهداری' }]}
          />
          <span className="eyebrow">پشتیبانی و نگهداری</span>
          <h1 className="h1">
            سایت بعد از انتشار، <span className="gold">شروع می‌شود</span>؛ تمام نمی‌شود
          </h1>
          <p className="lead">
            به‌روزرسانی‌های امنیتی، پشتیبان‌گیری منظم و رفع سریع ایرادها — تا سایت شما همیشه در
            حالت آماده‌باش باشد.
          </p>
        </div>
      </section>

      <section className="section-tight" style={{ paddingTop: '10px' }}>
        <div className="wrap">
          <div className="prose" style={{ maxWidth: '860px', marginBottom: '56px' }}>
            <p>
              سایتی که منتشر می‌شود اما نگهداری نمی‌شود، به‌آرامی هزینه می‌سازد: به‌روزرسانی‌های
              امنیتی جا می‌ماند، یک افزونه قدیمی حفره می‌شود، پشتیبانی نبود و یک خرابی کوچک روزها
              فروش را می‌بندد. قرارداد پشتیبانی یعنی این ریسک‌ها قبل از شدنِ مشکل، مدیریت می‌شوند.
            </p>
            <p>
              پشتیبانی ما سه لایه دارد: نگهداری فنی (به‌روزرسانی و امنیت)، داده (پشتیبان‌گیری و
              آزمون بازیابی) و محتوا (تغییرات کوچک منظم). سطح هر لایه در قرارداد شفاف مشخص می‌شود
              تا انتظار هر دو طرف روشن باشد.
            </p>
          </div>
          <div className="section-head side" style={{ marginBottom: '32px' }}>
            <h2 className="h3">در این خدمت چه چیزی تحویل می‌گیرید؟</h2>
          </div>
          <div className="feat-grid">
            <div className="feat-card reveal"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2 3 7v6c0 5 3.8 8.4 9 10 5.2-1.6 9-5 9-10V7l-9-5Z"/><path d="m9 12 2 2 4-4"/></svg></div><b>به‌روزرسانی امنیتی منظم</b><p>هسته، افزونه‌ها و زیرساخت به‌موقع به‌روز می‌شوند و آسیب‌پذیری‌ها بررسی می‌گردند.</p></div>
            <div className="feat-card reveal" data-delay="1"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg></div><b>پشتیبان‌گیری خودکار</b><p>نسخه‌های پشتیبان دوره‌ای با نگهداری برنامه‌ریزی‌شده و آزمون دوره‌ای بازیابی.</p></div>
            <div className="feat-card reveal"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg></div><b>پاسخ سریع به ایرادها</b><p>زمان پاسخ طبق سطح قرارداد مشخص است؛ خرابی‌ها اولویت دارند.</p></div>
            <div className="feat-card reveal" data-delay="1"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg></div><b>تغییرات کوچک محتوایی</b><p>به‌روزرسانی متن‌ها، تصاویر و بخش‌های خبری بدون نگرانی فنی.</p></div>
            <div className="feat-card reveal"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/></svg></div><b>گزارش دوره‌ای وضعیت</b><p>گزارش ماهانه از کارهای انجام‌شده، وضعیت امنیت و سلامت سایت.</p></div>
            <div className="feat-card reveal" data-delay="1"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18l3 3 5.7-5.7a4.5 4.5 0 0 0 6-6L14 13l-3-3 3.7-3.7Z"/></svg></div><b>توسعه‌های کوچک بعدی</b><p>افزودن قابلیت‌های کوچک جدید با برآورد مستقل و شفاف.</p></div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: '30px' }}>
        <div className="wrap">
          <div className="section-head">
            <span className="eyebrow">مسیر شروع</span>
            <h2 className="h2">از کجا شروع کنیم؟</h2>
            <p className="lead">
              هر همکاری از یک گفت‌وگوی هدفمند برای شناخت نیازها و تعیین مسیر مناسب شروع می‌شود؛
              جلسه اول مشاوره رایگان است.
            </p>
          </div>
          <div className="plan-list" style={{ maxWidth: '860px', marginInline: 'auto' }}>
            <div className="plan-row reveal"><div className="bento-ico" style={{ width: '42px', height: '42px', margin: '0' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg></div><div><b>پشتیبانی پایه</b><span>به‌روزرسانی و پشتیبان‌گیری منظم برای سایتی که تغییرات کم دارد.</span></div><Link href="/request" className="plan-link">شروع گفت‌وگو ←</Link></div>
            <div className="plan-row reveal"><div className="bento-ico" style={{ width: '42px', height: '42px', margin: '0' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2 3 7v6c0 5 3.8 8.4 9 10 5.2-1.6 9-5 9-10V7l-9-5Z"/><path d="m9 12 2 2 4-4"/></svg></div><div><b>پشتیبانی حرفه‌ای</b><span>پایش امنیت، اولویت پاسخ بالا و تغییرات محتوایی ماهانه.</span></div><Link href="/request" className="plan-link">شروع گفت‌وگو ←</Link></div>
            <div className="plan-row reveal"><div className="bento-ico" style={{ width: '42px', height: '42px', margin: '0' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18l3 3 5.7-5.7a4.5 4.5 0 0 0 6-6L14 13l-3-3 3.7-3.7Z"/></svg></div><div><b>همراهی توسعه‌ای</b><span>برای سایتهای در حال رشد: پشتیبانی + توسعه مستمر قابلیت‌های جدید.</span></div><Link href="/request" className="plan-link">شروع گفت‌وگو ←</Link></div>
          </div>
        </div>
      </section>

      <PageFaq pageKey="support" />

      <section className="section-tight">
        <div className="wrap">
          <div className="cta-banner reveal">
            <div>
              <h2>گام بعدی: یک گفت‌وگوی هدفمند</h2>
              <p>
                در جلسه اول، نیازهای شما شنیده می‌شود، مسیر پیشنهادی چیده می‌شود و برآورد مکتوب
                شفاف ارائه می‌گردد.
              </p>
            </div>
            <div className="cta-actions">
              <Link href="/request" className="btn btn-dark btn-lg">درخواست مشاوره رایگان</Link>
              <Link
                href="/portfolio"
                className="btn btn-ghost btn-lg"
                style={{ borderColor: 'rgba(34,25,3,.3)', color: '#171208' }}
              >
                مشاهده نمونه‌کارها
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
