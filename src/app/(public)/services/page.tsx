import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/site/breadcrumbs'
import PageFaq from '@/components/site/page-faq'

export const metadata: Metadata = {
  title: 'خدمات | طراحی سایت، سئو، محتوا و هوش مصنوعی',
  description:
    'مرور کامل خدمات کافه‌دانش: طراحی سایت و فروشگاه، UI/UX، سئو، تولید محتوا، بهینه‌سازی سرعت، هوش مصنوعی و پشتیبانی — هر خدمت با صفحه اختصاصی.',
}

export default function ServicesIndexPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs items={[{ label: 'خدمات' }]} />
          <span className="eyebrow">خدمات کافه‌دانش</span>
          <h1 className="h1">
            کل زنجیره دیجیتال شما، <span className="gold">در یک تیم</span>
          </h1>
          <p className="lead">
            از طراحی سایت تا سئو، محتوا، سرعت و هوش مصنوعی — هر خدمت صفحه اختصاصی و فرایند شفاف
            خودش را دارد.
          </p>
        </div>
      </section>

      <section className="section-tight" style={{ paddingTop: '10px' }}>
        <div className="wrap">
          <div className="prose" style={{ maxWidth: '860px', marginBottom: '56px' }}>
            <p>
              هر خدمت را می‌توانید مستقل سفارش دهید؛ اما وقتی همه حلقه‌ها یک تیم انجام دهد، زبان
              مشترک و هماهنگی طراحی تا سئو، نتیجه‌ای می‌دهد که پیمانکارهای جدا نمی‌دهند. در زیر هر
              خدمت را با خلاصه‌ای از تمرکز اصلی‌اش ببینید و برای جزئیات، صفحه اختصاصی‌اش را باز
              کنید.
            </p>
          </div>
          <div className="section-head side" style={{ marginBottom: '32px' }}>
            <h2 className="h3">هشت خدمت، یک استاندارد کیفیت</h2>
          </div>
          <div className="feat-grid">
            <div className="feat-card reveal"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg></div><b>طراحی سایت اختصاصی</b><p>سایت سفارشی برای برند و اهداف شما؛ شرکتی، خدماتی و توسعه‌پذیر.</p></div>
            <div className="feat-card reveal" data-delay="1"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.6"/><circle cx="17" cy="20" r="1.6"/><path d="M3 3h2l2.6 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6"/></svg></div><b>فروشگاه اینترنتی</b><p>تجربه خرید روان، درگاه پرداخت و صفحه محصول تبدیل‌محور.</p></div>
            <div className="feat-card reveal"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/></svg></div><b>طراحی UI/UX</b><p>معماری اطلاعات و رابط کاربری بر اساس رفتار واقعی مخاطب.</p></div>
            <div className="feat-card reveal" data-delay="1"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/></svg></div><b>سئو تکنیکال و محتوایی</b><p>آدیت فنی، تحقیق کلمات کلیدی و رشد ارگانیک با گزارش شفاف.</p></div>
            <div className="feat-card reveal"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg></div><b>تولید محتوا و مقالات سئومحور</b><p>محتوای ساختاریافته با تحقیق واقعی و تقویم انتشار منظم.</p></div>
            <div className="feat-card reveal" data-delay="1"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 14 16 9"/><path d="M20.5 17.5a9 9 0 1 0-17 0"/><circle cx="12" cy="15" r="1.6"/></svg></div><b>بهینه‌سازی سرعت</b><p>Core Web Vitals، تصاویر و زیرساخت — با سنجش قبل و بعد.</p></div>
            <div className="feat-card reveal"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7m2 8.5a6.5 6.5 0 0 0-3.5-5.7"/></svg></div><b>هوش مصنوعی و اتوماسیون</b><p>چت‌بات آموزش‌دیده، دستیار اختصاصی و خودکارسازی فرایندها.</p></div>
            <div className="feat-card reveal" data-delay="1"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2 3 7v6c0 5 3.8 8.4 9 10 5.2-1.6 9-5 9-10V7l-9-5Z"/><path d="m9 12 2 2 4-4"/></svg></div><b>پشتیبانی و نگهداری</b><p>امنیت، به‌روزرسانی، پشتیبان‌گیری و همراهی پس از انتشار.</p></div>
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
            <div className="plan-row reveal"><div className="bento-ico" style={{ width: '42px', height: '42px', margin: '0' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/></svg></div><div><b>نمی‌دانید از کجا شروع کنید؟</b><span>در جلسه مشاوره رایگان، وضعیت فعلی و اهداف شما بررسی و مسیر پیشنهادی ارائه می‌شود.</span></div><Link href="/request" className="plan-link">شروع گفت‌وگو ←</Link></div>
            <div className="plan-row reveal"><div className="bento-ico" style={{ width: '42px', height: '42px', margin: '0' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg></div><div><b>سایت دارید، مشکل دارید؟</b><span>بررسی رایگان وضعیت فنی و تجربه کاربری سایت فعلی و فهرست اولویت‌دار اصلاحات.</span></div><Link href="/request" className="plan-link">شروع گفت‌وگو ←</Link></div>
            <div className="plan-row reveal"><div className="bento-ico" style={{ width: '42px', height: '42px', margin: '0' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/></svg></div><div><b>برای پروژه‌های ترکیبی</b><span>چند خدمت با یک نقشه راه و زمان‌بندی یکپارچه اجرا می‌شود.</span></div><Link href="/request" className="plan-link">شروع گفت‌وگو ←</Link></div>
          </div>
        </div>
      </section>

      <PageFaq pageKey="services" />

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
