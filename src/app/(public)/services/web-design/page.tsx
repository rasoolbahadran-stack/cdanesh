import type { Metadata } from 'next'
import Breadcrumbs from '@/components/site/breadcrumbs'
import PageFaq from '@/components/site/page-faq'
import CtaBanner from '@/components/site/cta-banner'

export const metadata: Metadata = {
  title: 'طراحی سایت حرفه‌ای و اختصاصی',
  description:
    'طراحی سایت اختصاصی، شرکتی، خدماتی و فروشگاهی با UI/UX مهندسی‌شده، کد تمیز و سئو از روز اول — استودیو دیجیتال کافه‌دانش.',
}

export default function ServiceWebDesignPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs
            items={[{ label: 'خدمات', href: '/services' }, { label: 'طراحی سایت' }]}
          />
          <span className="eyebrow">خدمت طراحی و توسعه وب</span>
          <h1 className="h1">
            سایتی که از صفر <span className="gold">مال شماست</span>
          </h1>
          <p className="lead">
            قالب آماده نمی‌فروشیم؛ سایت شما را متناسب با برند، مخاطب و اهداف تجاری‌تان طراحی و
            کدنویسی می‌کنیم — از سایت معرفی تا فروشگاه و سامانه سفارشی.
          </p>
          <div className="page-hero-pills">
            <span className="chip">طراحی اختصاصی</span>
            <span className="chip">کد تمیز و استاندارد</span>
            <span className="chip">واکنش‌گرا در همه اندازه‌ها</span>
            <span className="chip">آماده سئو</span>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="wrap">
          <div className="split">
            <div className="prose">
              <h2 id="custom">طراحی سایت حرفه‌ای و اختصاصی</h2>
              <p>
                سایت اختصاصی یعنی طراحی و کد از صفر بر اساس هویت برند شما، رفتار مخاطب شما و اهداف
                تجاری شما. هیچ طرح آماده‌ای این تطابق را ندارد؛ به همین دلیل در پروژه‌های اختصاصی،
                قبل از هر کدنویسی، معماری اطلاعات و رابط کاربری با شما بازبینی می‌شود تا مطمئن شویم
                مسیر درست را می‌سازیم.
              </p>
              <p>
                خروجی این خدمت یک وب‌سایت کامل است: طراحی ریسپانسیو، پنل مدیریت محتوا، ساختار آماده
                سئو و مستندات کوتاه برای مدیریت سایت. در تمام مراحل، پیشرفت پروژه مرحله‌به‌مرحله
                قابل مشاهده است.
              </p>
              <h2 id="corporate">سایت شرکتی، خدماتی و فروشگاهی</h2>
              <p>
                هر کسب‌وکار نیاز متفاوتی دارد؛ شرکت‌ها به معرفی حرفه‌ای خدمات و پروژه‌ها نیاز دارند،
                کسب‌وکارهای خدماتی به صفحات فرود نتیجه‌محور و فروشگاه‌ها به تجربه خرید روان با فرایند
                پرداخت امن. ما این سه مسیر را با الگوهای آزموده اما شخصی‌سازی‌شده می‌سازیم.
              </p>
              <div className="feat-grid">
                <div className="feat-card">
                  <div className="bento-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3h18l-1.5 9h-15Z"/><path d="M3 3H1m4 17h2m8 0h2"/><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/></svg>
                  </div>
                  <b>فروشگاه اینترنتی</b>
                  <p>سبد خرید، درگاه پرداخت، مدیریت موجودی و صفحه محصول بهینه‌شده برای تبدیل.</p>
                </div>
                <div className="feat-card">
                  <div className="bento-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"/></svg>
                  </div>
                  <b>سایت شرکتی و سازمانی</b>
                  <p>معرفی خدمات، نمونه‌کارها، تیم و اخبار؛ با ساختار حرفه‌ای و مگامنوی دسته‌بندی‌شده.</p>
                </div>
                <div className="feat-card">
                  <div className="bento-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v18M5 8c0 4 3 7 7 7s7-3 7-7"/></svg>
                  </div>
                  <b>سایت خدماتی و صفحات فرود</b>
                  <p>صفحات نتیجه‌محور با دکمه‌های اقدام واضح و فرم‌های تمیز برای گرفتن سرنخ.</p>
                </div>
                <div className="feat-card">
                  <div className="bento-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M16 18 22 12 16 6M8 6 2 12l6 6"/></svg>
                  </div>
                  <b>وب‌اپلیکیشن و سامانه</b>
                  <p>سامانه‌های سفارشی: داشبورد، رزرو، عضویت و هر منطق تجاری خاص شما.</p>
                </div>
              </div>
              <h2 id="development">برنامه‌نویسی و توسعه وب‌سایت</h2>
              <p>
                گاهی نیاز شما فقط «یک سایت» نیست: یک ماژول سفارشی، اتصال به سیستم داخلی، یا توسعه
                قابلیت جدید روی سایت فعلی. در این حالت کد موجود بررسی می‌شود و توسعه به‌صورت تمیز و
                مستند انجام می‌گیرد — بدون خراب‌کردن بقیه سیستم.
              </p>
              <h2 id="uiux">طراحی UI/UX</h2>
              <p>
                طراحی رابط کاربری فقط «زیبایی» نیست؛ مسیر کاربر تا هدفش را مهندسی می‌کند. در
                پروژه‌های ما، طراحی UI/UX شامل نقشه‌راه صفحات، سلسله‌مراتب بصری، دسترس‌پذیری و تست
                رفتار واقعی کاربر است. اگر سایت فعلی بازدید دارد اما تبدیل نمی‌کند، معمولاً مشکل
                همین‌جاست.
              </p>
              <blockquote>
                قبل از شروع هر پروژه، جلسه کشف رایگان برگزار می‌شود تا دقیقاً روشن شود چه می‌سازیم،
                برای چه کسی و با چه معیار موفقیتی.
              </blockquote>
            </div>
            <aside>
              <div className="aside-card">
                <b>در این صفحه</b>
                <nav className="toc" aria-label="فهرست مطالب">
                  <a href="#custom">طراحی سایت اختصاصی</a>
                  <a href="#corporate">شرکتی، خدماتی و فروشگاهی</a>
                  <a href="#development">برنامه‌نویسی و توسعه</a>
                  <a href="#uiux">طراحی UI/UX</a>
                </nav>
              </div>
              <div className="aside-card">
                <b>سایر خدمات</b>
                <div className="plan-list">
                  <a className="plan-row" href="/services/seo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
                    <span><b>سئو تکنیکال و محتوایی</b><span>زیرساخت و رشد جست‌وجو</span></span>
                    <span className="plan-link">مشاهده ←</span>
                  </a>
                  <a className="plan-row" href="/services/content-production">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    <span><b>تولید محتوای تخصصی</b><span>مقالات سئوشده و تقویم محتوا</span></span>
                    <span className="plan-link">مشاهده ←</span>
                  </a>
                  <a className="plan-row" href="/services/ai-solutions">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M2 14h2m16 0h2M15 13v2m-6-2v2"/></svg>
                    <span><b>هوش مصنوعی و اتوماسیون</b><span>دستیارها و ابزارهای هوشمند</span></span>
                    <span className="plan-link">مشاهده ←</span>
                  </a>
                </div>
              </div>
              <div
                className="aside-card"
                style={{
                  background:
                    'linear-gradient(150deg,rgba(227,185,83,.14),rgba(227,185,83,.04))',
                  borderColor: 'rgba(227,185,83,.35)',
                }}
              >
                <b>پروژه‌تان را شروع کنیم؟</b>
                <p className="muted" style={{ fontSize: '13.5px', marginBottom: '14px' }}>
                  جلسه اول مشاوره رایگان است؛ نیاز شما را می‌شنویم و پیشنهاد شفاف می‌دهیم.
                </p>
                <a className="btn btn-gold btn-block" href="/request">درخواست مشاوره</a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <PageFaq pageKey="web-design" />

      <CtaBanner />
    </>
  )
}
