import type { Metadata } from 'next'
import Breadcrumbs from '@/components/site/breadcrumbs'
import PageFaq from '@/components/site/page-faq'
import CtaBanner from '@/components/site/cta-banner'

export const metadata: Metadata = {
  title: 'تولید محتوای تخصصی و سئوشده',
  description:
    'مقالات تخصصی ساختاریافته، استراتژی محتوا و تقویم انتشار منظم برای رشد ارگانیک کسب‌وکار شما.',
}

export default function ServiceContentProductionPage() {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs
            items={[{ label: 'خدمات', href: '/services' }, { label: 'تولید محتوا' }]}
          />
          <span className="eyebrow">خدمت تولید محتوا</span>
          <h1 className="h1">
            محتوایی که هم <span className="gold">خوانده می‌شود</span>، هم نتیجه می‌سازد
          </h1>
          <p className="lead">
            مقالات تخصصی ساختاریافته با تحقیق واقعی، به‌همراه استراتژی و تقویم محتوایی؛ تا وبلاگ شما
            به یک دارایی پایدار برای جذب مخاطب تبدیل شود.
          </p>
          <div className="page-hero-pills">
            <span className="chip">مقالات تخصصی</span>
            <span className="chip">ساختار استاندارد سئو</span>
            <span className="chip">تقویم انتشار منظم</span>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="wrap">
          <div className="split">
            <div className="prose">
              <h2 id="articles">تولید مقالات تخصصی و سئوشده</h2>
              <p>
                مقاله خوب سه ویژگی دارد: به یک سؤال واقعی مخاطب پاسخ می‌دهد، ساختار خوانا و
                استاندارد دارد و با کلمات کلیدی درست نوشته شده است. فرایند تولید ما شامل تحقیق
                موضوع، انتخاب کلمه کلیدی هدف، نوشتن با ساختار H1–H3، فهرست مطالب، لینک‌سازی داخلی و
                متادیتای کامل است.
              </p>
              <div className="feat-grid">
                <div className="feat-card">
                  <div className="bento-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
                  </div>
                  <b>تحقیق و انتخاب موضوع</b>
                  <p>موضوعات بر اساس جست‌وجوی واقعی مخاطب و قصد جست‌وجو انتخاب می‌شوند، نه سلیقه.</p>
                </div>
                <div className="feat-card">
                  <div className="bento-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg>
                  </div>
                  <b>ساختار استاندارد</b>
                  <p>هدینگ‌های سلسله‌مراتبی، فهرست مطالب خودکار، پاراگراف‌های کوتاه و لینک داخلی هدفمند.</p>
                </div>
                <div className="feat-card">
                  <div className="bento-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="m9 16 2-4 2 2 2-4 2 4" /><path d="M8 2v4m8-4v4"/></svg>
                  </div>
                  <b>متادیتای کامل</b>
                  <p>عنوان و توضیحات متا، slug استاندارد و Alt تصاویر برای هر مقاله.</p>
                </div>
                <div className="feat-card">
                  <div className="bento-ico">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9"/><path d="M21 3v6h-6"/></svg>
                  </div>
                  <b>به‌روزرسانی دوره‌ای</b>
                  <p>محتوای قدیمی ارزش خود را از دست می‌دهد؛ مقالات کلیدی دوره‌به‌دوره به‌روز می‌شوند.</p>
                </div>
              </div>
              <h2 id="strategy">استراتژی محتوا و تقویم محتوایی</h2>
              <p>
                انتشار پراکنده و بدون نقشه، نتیجه‌ای جز وبلاگی شلوغ و بی‌اثر ندارد. در استراتژی
                محتوا، مخاطب هدف، موضوعات ستونی، کلمات کلیدی هدف هر مقاله و زمان‌بندی انتشار مشخص
                می‌شود. خروجی، یک تقویم محتوایی عملی است که می‌دانید هر ماه چه چیزی، چرا و برای چه
                کسی منتشر می‌شود.
              </p>
              <h3>نمونه تقویم محتوایی سه‌ماهه</h3>
              <table>
                <tbody>
                  <tr><th>ماه</th><th>موضوعات</th><th>هدف</th></tr>
                  <tr><td>ماه اول</td><td>۲ مقاله موضوع ستونی + ۲ مقاله پشتیبان</td><td>پایه‌گذاری خوشه محتوایی اصلی</td></tr>
                  <tr><td>ماه دوم</td><td>۳ مقاله پشتیبان + به‌روزرسانی مقالات ماه اول</td><td>تقویت لینک‌سازی داخلی</td></tr>
                  <tr><td>ماه سوم</td><td>۲ مقاله مقایسه‌ای + ۱ راهنمای جامع</td><td>پوشش قصد جست‌وجوی خرید</td></tr>
                </tbody>
              </table>
              <blockquote>
                محتوای باکیفیت × انتشار منظم × زمان = رشد ارگانیک پایدار. هیچ‌کدام از سه ضلع را
                نمی‌شود حذف کرد.
              </blockquote>
              <h2 id="process">فرایند همکاری</h2>
              <p>
                پس از جلسه شناخت، فهرست موضوعات دوره اول با شما نهایی می‌شود. هر مقاله پیش از
                انتشار برای بازبینی شما ارسال می‌شود و ویرایش‌های اعمال می‌گردد. انتشار در وبلاگ
                سایت شما با تصاویر بهینه و ساختار استاندارد انجام می‌گیرد.
              </p>
            </div>
            <aside>
              <div className="aside-card">
                <b>در این صفحه</b>
                <nav className="toc" aria-label="فهرست مطالب">
                  <a href="#articles">مقالات تخصصی</a>
                  <a href="#strategy">استراتژی و تقویم</a>
                  <a href="#process">فرایند همکاری</a>
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
                <b>نمونه‌کار محتوایی داریم؟</b>
                <p className="muted" style={{ fontSize: '13.5px', marginBottom: '14px' }}>
                  چند مقاله نمونه با ساختار استاندارد در مجله کافه‌دانش منتشر شده — کیفیت را
                  همین‌جا ببینید.
                </p>
                <a className="btn btn-gold btn-block" href="/blog">مشاهده مجله</a>
              </div>
              <div className="aside-card">
                <b>سایر خدمات</b>
                <div className="plan-list">
                  <a className="plan-row" href="/services/seo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
                    <span><b>سئو تکنیکال و محتوایی</b><span>زیرساخت و رشد</span></span>
                    <span className="plan-link">مشاهده ←</span>
                  </a>
                  <a className="plan-row" href="/services/ai-solutions">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M2 14h2m16 0h2M15 13v2m-6-2v2"/></svg>
                    <span><b>تولید محتوا با AI</b><span>پیش‌نویس سریع + بازبینی</span></span>
                    <span className="plan-link">مشاهده ←</span>
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <PageFaq pageKey="content-production" />

      <CtaBanner />
    </>
  )
}
