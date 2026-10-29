import type { Metadata } from 'next'
import Breadcrumbs from '@/components/site/breadcrumbs'
import PageFaq from '@/components/site/page-faq'
import CtaBanner from '@/components/site/cta-banner'

export const metadata: Metadata = {
  title: 'خدمات سئو تکنیکال و سئوی محتوا',
  description:
    'سئو تکنیکال، استراتژی کلمات کلیدی و بهینه‌سازی محتوا — بدون وعده غیرواقعی، با کار اصولی و قابل اندازه‌گیری.',
}

export default function ServiceSeoPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs items={[{ label: 'خدمات', href: '/services' }, { label: 'سئو' }]} />
          <span className="eyebrow">خدمت سئو</span>
          <h1 className="h1">سئویی که <span className="gold">کار می‌کند</span>، نه شعاری که تضمین دارد</h1>
          <p className="lead">
            سئو نتیجه کارهای درست و پیوسته است: زیرساخت فنی سالم، محتوای واقعاً مفید و بهینه‌سازی
            مداوم. ما همین کارها را انجام می‌دهیم و گزارشش را شفاف می‌دهیم — بدون وعده رتبه اول.
          </p>
          <div className="page-hero-pills">
            <span className="chip">سئو تکنیکال</span>
            <span className="chip">سئوی محتوا</span>
            <span className="chip">گزارش شفاف</span>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="wrap">
          <div className="split">
            <div className="prose">
              <h2 id="technical">سئو تکنیکال: زیرساختی که موتور جست‌وجو می‌فهمد</h2>
              <p>
                قبل از هر کلمه کلیدی، سایت باید از نظر فنی سالم باشد: سرعت بارگذاری، ساختار
                هدینگ‌ها، نسخه موبایل، داده‌های ساختاریافته، نقشه سایت و مدیریت خطاهای خزنده. در
                بررسی تکنیکال، همه این موارد اندازه‌گیری می‌شوند و اولویت‌بندی اصلاحات با اثر واقعی
                ارائه می‌شود.
              </p>
              <ul className="check-list">
                <li>بررسی Core Web Vitals و بهینه‌سازی سرعت</li>
                <li>اصلاح ساختار هدینگ‌ها، متا و canonical</li>
                <li>داده‌های ساختاریافته و breadcrumb</li>
                <li>sitemap و robots استاندارد + رفع خطاهای ایندکس</li>
                <li>جلوگیری از محتوای تکراری و صفحات بی‌ارزش</li>
              </ul>
              <h2 id="content-seo">سئوی محتوا و استراتژی کلمات کلیدی</h2>
              <p>
                کلمه کلیدی درست، همان چیزی است که مخاطب واقعاً جست‌وجو می‌کند و شما می‌توانید در آن
                رقابت کنید. با تحلیل موضوعات، بررسی رقبا و قصد جست‌وجوی کاربر، نقشه محتوایی ساخته
                می‌شود که هر مقاله یک هدف روشن دارد و به صفحات خدمت شما لینک می‌خورد.
              </p>
              <blockquote>
                سئو یک پروژه یک‌باره نیست؛ یک روند است. تفاوت سایت‌هایی که بعد از شش ماه نتیجه
                می‌گیرند در پیوستگی کار است، نه یک اکشن جادویی.
              </blockquote>
              <h2 id="measurement">اندازه‌گیری و گزارش</h2>
              <p>
                هر دوره گزارش شفاف شامل: وضعیت ایندکس، رشد جست‌وجوهای نمایشی، کلیک‌ها و جایگاه
                کلمات هدف، و کارهای انجام‌شده. اگر کاری نتیجه نداده، صادقانه گفته می‌شود و مسیر
                اصلاح می‌شود. ادعای عدد دلخواه در گزارش‌های ما جای ندارد.
              </p>
              <h3>مثال خروجی گزارش دوره‌ای</h3>
              <table>
                <tbody>
                  <tr><th>سنجه</th><th>وضعیت</th><th>اقدام بعدی</th></tr>
                  <tr><td>صفحات ایندکس‌شده</td><td>رشد نسبت به دوره قبل</td><td>تقویت لینک‌سازی داخلی</td></tr>
                  <tr><td>کلمات در صفحه اول</td><td>گزارش دقیق فهرست</td><td>به‌روزرسانی محتوا</td></tr>
                  <tr><td>سرعت صفحات (LCP)</td><td>بهینه / نیازمند اصلاح</td><td>فشرده‌سازی تصاویر</td></tr>
                </tbody>
              </table>
            </div>
            <aside>
              <div className="aside-card">
                <b>در این صفحه</b>
                <nav className="toc" aria-label="فهرست مطالب">
                  <a href="#technical">سئو تکنیکال</a>
                  <a href="#content-seo">سئوی محتوا</a>
                  <a href="#measurement">اندازه‌گیری و گزارش</a>
                </nav>
              </div>
              <div
                className="aside-card"
                style={{
                  background:
                    'linear-gradient(150deg,rgba(227,185,83,.14),rgba(227,185,83,.04))',
                  borderColor: 'rgba(227,185,83,.35)',
                }}
              >
                <b>بررسی اولیه رایگان</b>
                <p className="muted" style={{ fontSize: '13.5px', marginBottom: '14px' }}>
                  وضعیت فنی فعلی سایت شما را بررسی و فهرست اولویت‌دار اصلاحات را ارائه می‌کنیم.
                </p>
                <a className="btn btn-gold btn-block" href="/request">درخواست بررسی</a>
              </div>
              <div className="aside-card">
                <b>سایر خدمات</b>
                <div className="plan-list">
                  <a className="plan-row" href="/services/content-production">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    <span><b>تولید محتوای تخصصی</b><span>مقالات سئوشده</span></span>
                    <span className="plan-link">مشاهده ←</span>
                  </a>
                  <a className="plan-row" href="/services/web-design">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M8 21V9"/></svg>
                    <span><b>طراحی سایت</b><span>اختصاصی و استاندارد</span></span>
                    <span className="plan-link">مشاهده ←</span>
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <PageFaq pageKey="seo" />

      <CtaBanner />
    </>
  )
}
