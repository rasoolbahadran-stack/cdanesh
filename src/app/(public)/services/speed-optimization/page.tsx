import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/site/breadcrumbs'
import PageFaq from '@/components/site/page-faq'

export const metadata: Metadata = {
  title: 'بهینه‌سازی سرعت سایت | Core Web Vitals و تجربه سریع',
  description:
    'بهینه‌سازی سرعت سایت با تمرکز بر Core Web Vitals: بهبود LCP و INP و CLS، بهینه‌سازی تصاویر WebP، کش و زیرساخت. بررسی اولیه رایگان.',
}

export default function ServiceSpeedOptimizationPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs
            items={[{ label: 'خدمات', href: '/services' }, { label: 'بهینه‌سازی سرعت' }]}
          />
          <span className="eyebrow">بهینه‌سازی سرعت</span>
          <h1 className="h1">
            سریع‌تر باز شود، <span className="gold">بهتر بفروشد</span>
          </h1>
          <p className="lead">
            هر ثانیه تأخیر در باز شدن صفحه، بخشی از بازدیدکننده‌ها را می‌برد. سرعت را با داده
            اندازه و به‌صورت هدفمند بهبود می‌دهیم.
          </p>
        </div>
      </section>

      <section className="section-tight" style={{ paddingTop: '10px' }}>
        <div className="wrap">
          <div className="prose" style={{ maxWidth: '860px', marginBottom: '56px' }}>
            <p>
              کاربر در چند ثانیه اول تصمیم می‌گیرد بماند یا برود — و گوگل همین حس را با سنجه‌های
              Core Web Vitals اندازه می‌گیرد: سرعت ظاهرشدن محتوای اصلی (LCP)، سرعت پاسخ به کلیک
              (INP) و ثبات عناصر صفحه (CLS). بهبود این سه، هم تجربه کاربر و هم رتبه جست‌وجو را بالا
              می‌برد.
            </p>
            <p>
              مسیر کار ما داده‌محور است: اول وضعیت فعلی اندازه‌گیری و گلوگاه‌ها دقیق مشخص می‌شوند
              (تصاویر، کد، کش، هاست)، بعد اصلاحات با اولویت اثر اجرا و نتیجه دوباره اندازه‌گیری
              می‌شود. ظاهر و محتوای سایت شما بدون تغییر می‌ماند؛ فقط سریع‌تر باز می‌شود.
            </p>
          </div>
          <div className="section-head side" style={{ marginBottom: '32px' }}>
            <h2 className="h3">در این خدمت چه چیزی تحویل می‌گیرید؟</h2>
          </div>
          <div className="feat-grid">
            <div className="feat-card reveal"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m5 19 5-5 3 3 3-3 3 3"/></svg></div><b>بهینه‌سازی کامل تصاویر</b><p>تبدیل به WebP، ابعاد متناسب با نمایش و بارگذاری هوشمند (Lazy Loading) خارج از دید.</p></div>
            <div className="feat-card reveal" data-delay="1"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 14 16 9"/><path d="M20.5 17.5a9 9 0 1 0-17 0"/><circle cx="12" cy="15" r="1.6"/></svg></div><b>بهبود Core Web Vitals</b><p>کار هدفمند روی سه سنجه اصلی با سنجش قبل و بعد از اصلاحات.</p></div>
            <div className="feat-card reveal"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18l3 3 5.7-5.7a4.5 4.5 0 0 0 6-6L14 13l-3-3 3.7-3.7Z"/></svg></div><b>بهینه‌سازی کد و اسکریپت‌ها</b><p>حذف اسکریپت‌های اضافی، فشرده‌سازی و بارگذاری کنترل‌شده منابع.</p></div>
            <div className="feat-card reveal" data-delay="1"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg></div><b>کش و CDN درست</b><p>تنظیم کش مرورگر و شبکه توزیع محتوا برای بازگشت سریع‌تر بازدیدکننده‌ها.</p></div>
            <div className="feat-card reveal"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg></div><b>سرعت واقعی موبایل</b><p>چون رتبه‌بندی و کاربران موبایل‌محورند، بهبود روی تجربه موبایل سنجیده می‌شود.</p></div>
            <div className="feat-card reveal" data-delay="1"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/></svg></div><b>گزارش مقایسه‌ای</b><p>وضعیت قبل و بعد با اعداد — بدون ادعای کلامی.</p></div>
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
            <div className="plan-row reveal"><div className="bento-ico" style={{ width: '42px', height: '42px', margin: '0' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/></svg></div><div><b>بررسی و گزارش</b><span>اندازه‌گیری وضعیت فعلی و فهرست اولویت‌دار گلوگاه‌ها با اثر هر مورد.</span></div><Link href="/request" className="plan-link">شروع گفت‌وگو ←</Link></div>
            <div className="plan-row reveal"><div className="bento-ico" style={{ width: '42px', height: '42px', margin: '0' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 14 16 9"/><path d="M20.5 17.5a9 9 0 1 0-17 0"/><circle cx="12" cy="15" r="1.6"/></svg></div><div><b>بهینه‌سازی اجرایی</b><span>اجرای اصلاحات تصاویر، کش و کد تا رسیدن به وضعیت مطلوب سنجه‌ها.</span></div><Link href="/request" className="plan-link">شروع گفت‌وگو ←</Link></div>
            <div className="plan-row reveal"><div className="bento-ico" style={{ width: '42px', height: '42px', margin: '0' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/></svg></div><div><b>پایش مستمر</b><span>بازبینی دوره‌ای سرعت پس از تغییرات جدید سایت تا کیفیت حفظ شود.</span></div><Link href="/request" className="plan-link">شروع گفت‌وگو ←</Link></div>
          </div>
        </div>
      </section>

      <PageFaq pageKey="speed-optimization" />

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
