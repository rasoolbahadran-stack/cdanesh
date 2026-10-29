import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/site/breadcrumbs'
import PageFaq from '@/components/site/page-faq'

export const metadata: Metadata = {
  title: 'طراحی UI/UX | تجربه کاربری مهندسی‌شده',
  description:
    'طراحی رابط و تجربه کاربری بر اساس رفتار واقعی کاربران: معماری اطلاعات، وایرفریم، تست طرح و تحویل راهنمای کامل به تیم توسعه.',
}

export default function ServiceUiuxPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs
            items={[{ label: 'خدمات', href: '/services' }, { label: 'طراحی UI/UX' }]}
          />
          <span className="eyebrow">طراحی UI/UX</span>
          <h1 className="h1">
            تجربه کاربری، تفاوت بین <span className="gold">دیدن و خریدن</span> است
          </h1>
          <p className="lead">
            رابط زیبا فقط نصف راه است؛ رابط خوب، کاربر را بدون سردرگمی به هدف صفحه می‌رساند.
          </p>
        </div>
      </section>

      <section className="section-tight" style={{ paddingTop: '10px' }}>
        <div className="wrap">
          <div className="prose" style={{ maxWidth: '860px', marginBottom: '56px' }}>
            <p>
              UI/UX یعنی پاسخ به یک سؤال ساده: کاربر وقتی وارد این صفحه می‌شود، چه می‌خواهد و کجا
              گیر می‌کند؟ طراحی تجربه کاربری، این پاسخ را با بررسی مسیر فعلی کاربران، اهداف
              کسب‌وکار و تست طرح‌ها پیدا می‌کند — نه با سلیقه. نتیجه، صفحه‌ای است که هم کاربر
              راحت‌تر تصمیم می‌گیرد و هم کسب‌وکار به هدف خودش می‌رسد.
            </p>
            <p>
              خروجی کار ما فقط طرح گرافیکی نیست: معماری اطلاعات، وایرفریم صفحه‌ها، طرح نهایی با
              هویت برند و راهنمای پیاده‌سازی برای تیم توسعه — تا آنچه طراحی شده، دقیقاً همان‌طور
              اجرا شود.
            </p>
          </div>
          <div className="section-head side" style={{ marginBottom: '32px' }}>
            <h2 className="h3">در این خدمت چه چیزی تحویل می‌گیرید؟</h2>
          </div>
          <div className="feat-grid">
            <div className="feat-card reveal"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M10 6.5h7v7"/></svg></div><b>معماری اطلاعات روشن</b><p>هر صفحه یک مأمور مشخص دارد؛ ساختار ناوبری بر اساس ذهنیت مخاطب چیده می‌شود.</p></div>
            <div className="feat-card reveal" data-delay="1"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg></div><b>طراحی موبایل‌محور</b><p>چون بیشتر کاربران با گوشی می‌آیند، تجربه موبایل اول طراحی و بعد برای دسکتاپ کامل می‌شود.</p></div>
            <div className="feat-card reveal"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/></svg></div><b>مسیرهای اقدام شفاف</b><p>دعوت‌های به اقدام کم اما روشن؛ کاربر همیشه می‌داند قدم بعدی چیست.</p></div>
            <div className="feat-card reveal" data-delay="1"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7m2 8.5a6.5 6.5 0 0 0-3.5-5.7"/></svg></div><b>تست با کاربر واقعی</b><p>طرح‌ها پیش از توسعه با مخاطبان واقعی بررسی و بر اساس بازخورد اصلاح می‌شوند.</p></div>
            <div className="feat-card reveal"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg></div><b>راهنمای پیاده‌سازی</b><p>کامپوننت‌ها، حالت‌ها و جزئیات مستند می‌شود تا تیم فنی بدون حدس اجرا کند.</p></div>
            <div className="feat-card reveal" data-delay="1"><div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 5-6"/></svg></div><b>بهبود بر اساس داده</b><p>پس از انتشار، مسیر کاربر پایش می‌شود و گلوگاه‌ها اصلاح می‌گردند.</p></div>
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
            <div className="plan-row reveal"><div className="bento-ico" style={{ width: '42px', height: '42px', margin: '0' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/></svg></div><div><b>آدیت تجربه کاربری</b><span>بررسی سایت فعلی و فهرست گلوگاه‌ها با اولویت اصلاح.</span></div><Link href="/request" className="plan-link">شروع گفت‌وگو ←</Link></div>
            <div className="plan-row reveal"><div className="bento-ico" style={{ width: '42px', height: '42px', margin: '0' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg></div><div><b>بازطراحی صفحات کلیدی</b><span>طراحی مجدد صفحات پرترافیک بر اساس داده و تست.</span></div><Link href="/request" className="plan-link">شروع گفت‌وگو ←</Link></div>
            <div className="plan-row reveal"><div className="bento-ico" style={{ width: '42px', height: '42px', margin: '0' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M10 6.5h7v7"/></svg></div><div><b>طراحی محصول جدید</b><span>از معماری اطلاعات تا طرح نهایی برای محصول یا سامانه جدید.</span></div><Link href="/request" className="plan-link">شروع گفت‌وگو ←</Link></div>
          </div>
        </div>
      </section>

      <PageFaq pageKey="uiux" />

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
