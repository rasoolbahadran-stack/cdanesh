import Link from 'next/link'
import { getPortfolioItems, getLatestArticles, getFaqForPage } from '@/lib/content'
import PortfolioCard from '@/components/site/portfolio-card'
import PostCard from '@/components/site/post-card'
import FaqAccordion from '@/components/site/faq-accordion'
import PackagesSection from '@/components/site/packages-section'

export default async function HomePage() {
  const [homePortfolio, latestPosts, homeFaq] = await Promise.all([
    getPortfolioItems({ onlyHome: true, limit: 2 }),
    getLatestArticles(3),
    getFaqForPage('home'),
  ])
  return (
    <>


<section className="hero">
  <div className="wrap">
    <div className="hero-grid">
      <div className="hero-copy">
        <span className="eyebrow reveal in">استودیو دیجیتال کافه‌دانش</span>
        <h1 className="h1 reveal in">سایت، محتوا و هوش مصنوعی؛<br />سه موتور <span className="gold">رشد کسب‌وکار</span> شما</h1>
        <p className="lead reveal in" data-delay="1">سایتی که برند شما را معرفی می‌کند، محتوایی که مخاطب را می‌آورد و ابزارهایی که کارهای تکراری را حذف می‌کنند — همه را یک تیم، با یک نقشه راه و تحویل مرحله‌به‌مرحله انجام می‌دهد.</p>
        <div className="hero-ctas reveal in" data-delay="2">
          <Link href="/request" className="btn btn-gold btn-lg" >درخواست مشاوره رایگان
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
          </Link>
          <Link href="/portfolio" className="btn btn-ghost btn-lg" >مشاهده نمونه‌کارها</Link>
        </div>
        <div className="hero-pills reveal in" data-delay="3">
          <span className="chip">طراحی اختصاصی، نه قالب آماده</span>
          <span className="chip">سئوی اصولی و قابل توضیح</span>
          <span className="chip">پشتیبانی واقعی پس از تحویل</span>
        </div>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="hero-orbit"></div>
        <span className="orbit-tag" style={{'top': '2%', 'insetInlineStart': '38%'}}>طراحی <b>UI/UX</b></span>
        <span className="orbit-tag" style={{'top': '26%', 'insetInlineStart': '-2%'}}>سئو <b>تکنیکال</b></span>
        <span className="orbit-tag" style={{'top': '26%', 'insetInlineEnd': '0%'}}>محتوای <b>تخصصی</b></span>
        <span className="orbit-tag" style={{'bottom': '4%', 'insetInlineStart': '30%'}}>هوش مصنوعی <b>کاربردی</b></span>
        <div className="hero-frame">
          <div className="frame-bar"><i /><i /><i /><span className="frame-url">cdanesh.ir — نمونه طراحی</span></div>
          <div className="mock">
            <div className="mock-nav"><span className="mock-logo"></span><i /><i /><i /><span className="mock-btn"></span></div>
            <div className="mock-hero"><b></b><b></b><i /><i /><i style={{'width': '60%'}} /><span className="mock-cta"></span></div>
            <div className="mock-cards"><i /><i /><i /></div>
          </div>
        </div>
        <div className="float-chip fc-1">
          <span className="fc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.5 4 20 9.5 9.5 20 4 20 4 14.5Z"/></svg></span>
          <span><b>تحویل مرحله‌ای</b><span>پیشرفت پروژه شفاف و قابل پیگیری</span></span>
        </div>
        <div className="float-chip fc-2">
          <span className="fc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4m-10 10L5.6 18.4"/><circle cx="12" cy="12" r="3.5"/></svg></span>
          <span><b>ابزارهای هوشمند</b><span>اتوماسیون و دستیارهای اختصاصی</span></span>
        </div>
      </div>
    </div>

    
    <div className="trustbar reveal">
      <div className="trust-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        <div><b>طراحی اختصاصی</b><span>سایت شما کپی هیچ قالبی نیست</span></div>
      </div>
      <div className="trust-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2 3 7v6c0 5 3.8 8.4 9 10 5.2-1.6 9-5 9-10V7l-9-5Z"/><path d="m9 12 2 2 4-4"/></svg>
        <div><b>شفافیت کامل</b><span>محدوده کار و زمان‌بندی از روز اول مشخص است</span></div>
      </div>
      <div className="trust-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
        <div><b>تحویل مرحله‌ای</b><span>هر مرحله با تأیید شما جلو می‌رود</span></div>
      </div>
      <div className="trust-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.5 4 20 9.5 9.5 20 4 20 4 14.5Z"/></svg>
        <div><b>مالکیت کامل</b><span>کد، محتوا و دسترسی‌ها متعلق به شماست</span></div>
      </div>
    </div>
  </div>
</section>


<section className="section">
  <div className="wrap">
    <div className="section-head reveal">
      <span className="eyebrow">توانمندی‌ها</span>
      <h2 className="h2">تمام حلقه‌های حضور دیجیتال، در یک تیم</h2>
      <p className="lead">به‌جای هماهنگ‌کردن چند پیمانکار جدا، کل زنجیره از طراحی تا محتوا و اتوماسیون را یک تیم و با یک زبان مشترک پیش می‌برد.</p>
    </div>
    <div className="bento">
      <article className="bento-card b-wide b-gold reveal">
        <span className="bento-num">۰۱</span>
        <div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M8 21V9"/></svg></div>
        <h3>طراحی سایت اختصاصی</h3>
        <p>سایت شما از صفر برای برند و اهداف خودتان طراحی می‌شود؛ نه یک قالب آماده با اسم شما. نتیجه: تمایز واقعی در بازار.</p>
        <div className="mini-bars" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      </article>
      <article className="bento-card b-slim b-deep reveal" data-delay="1">
        <span className="bento-num">۰۲</span>
        <div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg></div>
        <h3>سئو تکنیکال و محتوایی</h3>
        <p>از سرعت و ساختار فنی تا انتخاب کلمه کلیدی و معماری محتوا.</p>
        <div className="mini-type" aria-hidden="true"><b>Aa</b><span className="dots"><i /><i /><i /><i /></span></div>
      </article>
      <article className="bento-card b-third reveal">
        <span className="bento-num">۰۳</span>
        <div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></div>
        <h3>تولید محتوای تخصصی</h3>
        <p>مقالات ساختاریافته با تحقیق واقعی؛ محتوایی که هم کاربر را پاسخ می‌دهد و هم موتور جست‌وجو را.</p>
      </article>
      <article className="bento-card b-third reveal" data-delay="1">
        <span className="bento-num">۰۴</span>
        <div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4m8-4v4M3 10h18M8 15h3"/></svg></div>
        <h3>استراتژی و تقویم محتوایی</h3>
        <p>نقشه راه انتشار منظم؛ تا وبلاگ شما از «نوشته‌های پراکنده» به یک دارایی تبدیل شود.</p>
      </article>
      <article className="bento-card b-third reveal" data-delay="2">
        <span className="bento-num">۰۵</span>
        <div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z"/></svg></div>
        <h3>عملکرد و تجربه کاربری</h3>
        <p>سرعت، دسترس‌پذیری و روانی تعامل؛ سنجه‌هایی که هم کاربر حس می‌کند و هم گوگل اندازه می‌گیرد.</p>
      </article>
      <article className="bento-card b-half b-deep reveal">
        <span className="bento-num">۰۶</span>
        <div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M2 14h2m16 0h2M15 13v2m-6-2v2"/></svg></div>
        <h3>هوش مصنوعی و اتوماسیون</h3>
        <p>دستیارهای هوشمند، ابزارهای تولید محتوا و خودکارسازی کارهای تکراری؛ با اتصال امن سمت سرور و بازبینی انسانی.</p>
        <div className="mini-orbit" aria-hidden="true"></div>
      </article>
      <article className="bento-card b-half reveal" data-delay="1">
        <span className="bento-num">۰۷</span>
        <div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-9-9"/><path d="M21 3v6h-6"/><path d="M12 7v5l3 3"/></svg></div>
        <h3>پشتیبانی و توسعه مداوم</h3>
        <p>سایت پس از انتشار «تمام‌شده» نیست؛ نگهداری امنیتی، به‌روزرسانی و توسعه قابلیت‌های جدید ادامه مسیر است.</p>
      </article>
    </div>
  </div>
</section>


<section className="section" id="why" style={{'paddingTop': '30px'}}>
  <div className="wrap">
    <div className="why-grid">
      <div className="reveal">
        <span className="eyebrow">مزیت‌های همکاری با ما</span>
        <h2 className="h2" style={{'marginBottom': '26px'}}>پنج دلیل که نتیجه کار را <span className="gold">متمایز می‌کند</span></h2>
        <div className="why-rows">
          <div className="why-row">
            <span className="why-num">۰۱</span>
            <div><b>طراحی متناسب با نیاز کسب‌وکار شما</b><p>قبل از هر خط کد، کسب‌وکار، مخاطب و هدف شما تحلیل می‌شود؛ نتیجه سایتی است که برای «شما» ساخته شده، نه برای همه.</p></div>
          </div>
          <div className="why-row">
            <span className="why-num">۰۲</span>
            <div><b>تجربه کاربری و نمایش درست در موبایل</b><p>بیشتر بازدیدها از گوشی است؛ هر صفحه برای موبایل، تبلت و دسکتاپ جداگانه تست می‌شود، نه فقط «کوچک‌شده» است.</p></div>
          </div>
          <div className="why-row">
            <span className="why-num">۰۳</span>
            <div><b>زیرساخت فنی و سئوی اصولی از روز اول</b><p>سرعت، ساختار استاندارد و آماده‌بودن برای موتور جست‌وجو جزو تحویل اولیه است؛ بعداً هزینه اضافه برای «اصلاح زیرساخت» نمی‌پردازید.</p></div>
          </div>
          <div className="why-row">
            <span className="why-num">۰۴</span>
            <div><b>قابلیت توسعه و مدیریت محتوا</b><p>پنل مدیریتی کامل با آموزش؛ محتوای جدید خودتان منتشر کنید و قابلیت‌های جدید بدون بازسازی اضافه شوند.</p></div>
          </div>
          <div className="why-row">
            <span className="why-num">۰۵</span>
            <div><b>استفاده هدفمند از هوش مصنوعی</b><p>جایی که واقعاً ارزش دارد: پاسخ‌گویی، تولید پیش‌نویس و خودکارسازی کار تکراری — با بازبینی انسانی، نه جایگزینی کیفیت.</p></div>
          </div>
        </div>
      </div>
      <div className="why-visual reveal" data-delay="1">
        <div className="why-ring" aria-hidden="true"></div>
        <div className="why-stat-card">
          <div className="num" data-count="12" data-suffix="">۰</div>
          <div className="lbl">خدمت تخصصی در یک تیم واحد</div>
          <div className="row"><span>صفحه تخصصی خدمات</span><b>۴</b></div>
          <div className="row"><span>ابزار هوشمند محتوا</span><b>۸</b></div>
          <div className="row"><span>مرحله فرایند همکاری</span><b>۶</b></div>
        </div>
      </div>
    </div>
  </div>
</section>


<section className="section" id="services" style={{'paddingTop': '30px'}}>
  <div className="wrap">
    <div className="section-head reveal">
      <span className="eyebrow">خدمات ما</span>
      <h2 className="h2">هشت خدمت تخصصی، هشت صفحه اختصاصی</h2>
      <p className="lead">هر خدمت صفحه اختصاصی و محتوای کامل خودش را دارد؛ می‌توانید هر کدام را مستقل سفارش دهید یا ترکیبی سفارش بدهید.</p>
    </div>
    <div className="svc-grid8">
      <Link href="/services/web-design#corporate" className="svc-mini reveal" >
        <div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M4 21h16M8 7h2m4 0h2M8 11h2m4 0h2M8 15h2m4 0h2"/></svg></div>
        <h3>طراحی سایت شرکتی</h3>
        <p>حضور حرفه‌ای برای معرفی خدمات، پروژه‌ها و تیم شرکت شما.</p>
        <span className="link-more">جزئیات خدمت <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="14" height="14"><path d="M19 12H5m7-7-7 7 7 7"/></svg></span>
      </Link>
      <Link href="/services/e-commerce" className="svc-mini reveal"  data-delay="1">
        <div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.6"/><circle cx="17" cy="20" r="1.6"/><path d="M3 3h2l2.6 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6"/></svg></div>
        <h3>طراحی فروشگاه اینترنتی</h3>
        <p>تجربه خرید روان، درگاه پرداخت و صفحه محصول تبدیل‌محور.</p>
        <span className="link-more">جزئیات خدمت <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="14" height="14"><path d="M19 12H5m7-7-7 7 7 7"/></svg></span>
      </Link>
      <Link href="/services/speed-optimization" className="svc-mini reveal"  data-delay="2">
        <div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></div>
        <h3>بهینه‌سازی سرعت و عملکرد</h3>
        <p>Core Web Vitals، تصاویر و زیرساخت؛ سایتی که سریع جواب می‌دهد.</p>
        <span className="link-more">جزئیات خدمت <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="14" height="14"><path d="M19 12H5m7-7-7 7 7 7"/></svg></span>
      </Link>
      <Link href="/services/uiux" className="svc-mini reveal"  data-delay="3">
        <div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg></div>
        <h3>طراحی رابط و تجربه کاربری</h3>
        <p>مسیر کاربر مهندسی می‌شود تا هر صفحه به هدف خودش برسد.</p>
        <span className="link-more">جزئیات خدمت <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="14" height="14"><path d="M19 12H5m7-7-7 7 7 7"/></svg></span>
      </Link>
      <Link href="/services/seo" className="svc-mini reveal" >
        <div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/></svg></div>
        <h3>سئو تکنیکال و محتوایی</h3>
        <p>زیرساخت فنی استاندارد و انتخاب هوشمندانه کلمات کلیدی.</p>
        <span className="link-more">جزئیات خدمت <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="14" height="14"><path d="M19 12H5m7-7-7 7 7 7"/></svg></span>
      </Link>
      <Link href="/services/content-production" className="svc-mini reveal"  data-delay="1">
        <div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></div>
        <h3>تولید مقالات سئومحور</h3>
        <p>مقالات تخصصی با تحقیق واقعی و ساختار استاندارد انتشار.</p>
        <span className="link-more">جزئیات خدمت <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="14" height="14"><path d="M19 12H5m7-7-7 7 7 7"/></svg></span>
      </Link>
      <Link href="/services/support" className="svc-mini reveal"  data-delay="2">
        <div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4m8-4v4M3 10h18M8 15h3"/></svg></div>
        <h3>پشتیبانی و نگهداری سایت</h3>
        <p>به‌روزرسانی امنیتی، پشتیبان‌گیری و توسعه مستمر پس از انتشار.</p>
        <span className="link-more">جزئیات خدمت <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="14" height="14"><path d="M19 12H5m7-7-7 7 7 7"/></svg></span>
      </Link>
      <Link href="/services/ai-solutions" className="svc-mini reveal"  data-delay="3">
        <div className="bento-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M2 14h2m16 0h2M15 13v2m-6-2v2"/></svg></div>
        <h3>هوش مصنوعی و اتوماسیون</h3>
        <p>چت‌بات، دستیار اختصاصی و خودکارسازی فرایندهای تکراری.</p>
        <span className="link-more">جزئیات خدمت <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="14" height="14"><path d="M19 12H5m7-7-7 7 7 7"/></svg></span>
      </Link>
    </div>
  </div>
</section>


<section className="section" id="duo" style={{'paddingTop': '30px'}}>
  <div className="wrap">
    <div className="section-head reveal">
      <span className="eyebrow">خدمات، از نزدیک</span>
      <h2 className="h2">هر خدمت دقیقاً چه تغییری در کسب‌وکار شما می‌سازد؟</h2>
      <p className="lead">چهار حوزه اصلی کار ما — با نگاه کاربردی به «قبل و بعد» آن برای کسب‌وکار شما.</p>
    </div>

    <div className="duo reveal">
      <div className="duo-copy">
        <span className="eyebrow">طراحی سایت</span>
        <h2>سایتی که هویت برند شما را می‌فروشد، نه قالبی که همه دارند</h2>
        <p>قالب آماده هزینه اولیه کمتری دارد، اما مخاطب حس «تکراری‌بودن» را حس می‌کند و توسعه بعدی گران تمام می‌شود. طراحی اختصاصی یعنی هر صفحه برای هدف مشخص آن ساخته شده باشد.</p>
        <ul className="duo-points">
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg><span><b>طراحی بر اساس پرسونای واقعی مخاطب</b> — نه سلیقه لحظه‌ای</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg><span><b>ساختار صفحه‌ها بر مبنای مسیر خرید</b> یا تماس مشتری</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg><span><b>کد تمیز و توسعه‌پذیر</b> — قابلیت جدید بعداً بدون بازسازی اضافه می‌شود</span></li>
        </ul>
        <Link href="/services/web-design" className="btn btn-gold" >صفحه خدمت طراحی سایت
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="16" height="16"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
        </Link>
      </div>
      <div className="duo-visual"><img src="/img/service-web.webp" alt="پیش‌نمایش طراحی اختصاصی وب‌سایت کافه‌دانش" width="1800" height="1350" loading="lazy" /></div>
    </div>

    <div className="duo flip reveal">
      <div className="duo-copy">
        <span className="eyebrow">سئو</span>
        <h2>سئو یعنی ساختار درست؛ نه ترفند موقت</h2>
        <p>هیچ‌کس نمی‌تواند رتبه اول را تضمین کند — اما می‌توان زیرساختی ساخت که گوگل آن را دوست داشته باشد و محتوایی منتشر کرد که واقعاً سؤال مخاطب را پاسخ می‌دهد. نتیجه‌اش در طول زمان خودش را نشان می‌دهد.</p>
        <ul className="duo-points">
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg><span><b>سئوی تکنیکال:</b> سرعت، ساختار آدرس‌ها، داده ساختاریافته</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg><span><b>تحقیق کلمه کلیدی</b> بر اساس نیت جست‌وجوی مخاطب شما</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg><span><b>گزارش شفاف:</b> می‌بینید چه کاری انجام شده و چه تغییری کرده</span></li>
        </ul>
        <Link href="/services/seo" className="btn btn-gold" >صفحه خدمت سئو
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="16" height="16"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
        </Link>
      </div>
      <div className="duo-visual"><img src="/img/service-seo.webp" alt="پیش‌نمایش سئو تکنیکال و محتوایی کافه‌دانش" width="1800" height="1350" loading="lazy" /></div>
    </div>

    <div className="duo reveal">
      <div className="duo-copy">
        <span className="eyebrow">تولید محتوا</span>
        <h2>محتوایی که سؤال مشتری را پاسخ می‌دهد، فروش را می‌آورد</h2>
        <p>مقاله‌ای که فقط «کلمه کلیدی» داشته باشد خوانده نمی‌شود. محتوای خوب نیاز واقعی مخاطب را پیدا می‌کند، کامل پاسخ می‌دهد و خواننده را یک قدم به خرید نزدیک می‌کند — و همین محتواست که سئو را می‌سازد.</p>
        <ul className="duo-points">
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg><span><b>مقالات سئومحور با تحقیق واقعی</b> — نه بازنویسی رقبا</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg><span><b>لحن برند شما</b> حفظ می‌شود؛ محتوا با شما یکدست است</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg><span><b>تقویم انتشار منظم</b> — وبلاگ از سردرگمی به دارایی تبدیل می‌شود</span></li>
        </ul>
        <Link href="/services/content-production" className="btn btn-gold" >صفحه خدمت تولید محتوا
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="16" height="16"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
        </Link>
      </div>
      <div className="duo-visual"><img src="/img/service-content.webp" alt="پیش‌نمایش تولید محتوای تخصصی کافه‌دانش" width="1800" height="1350" loading="lazy" /></div>
    </div>

    <div className="duo flip reveal">
      <div className="duo-copy">
        <span className="eyebrow">هوش مصنوعی</span>
        <h2>کارهای تکراری تیم‌تان را به ابزار بسپارید</h2>
        <p>پاسخ‌دادن به سؤالات تکراری، پیش‌نویس محتوا و جمع‌آوری اطلاعات مشتری، ساعت‌ها از وقت تیم شما را می‌گیرد. دستیارهای هوشمند این کارها را خودکار می‌کنند تا انسان‌ها روی کارهای مهم تمرکز کنند.</p>
        <ul className="duo-points">
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg><span><b>چت‌بات آموزش‌دیده با محتوای سایت شما</b> — پاسخ درست، نه حدس</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg><span><b>اتصال امن سمت سرور</b> — کلیدها هرگز در مرورگر قرار نمی‌گیرند</span></li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg><span><b>بازبینی انسانی روی خروجی‌ها</b> — سرعت هوش مصنوعی، کیفیت انسانی</span></li>
        </ul>
        <Link href="/services/ai-solutions" className="btn btn-gold" >صفحه راهکارهای هوش مصنوعی
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="16" height="16"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
        </Link>
      </div>
      <div className="duo-visual"><img src="/img/ai-tools.webp" alt="پیش‌نمایش ابزارهای هوش مصنوعی و اتوماسیون کافه‌دانش" width="1800" height="1434" loading="lazy" /></div>
    </div>
  </div>
</section>


<section className="section" id="portfolio">
  <div className="wrap">
    <div className="section-head reveal">
      <span className="eyebrow">نمونه‌کارها</span>
      <h2 className="h2">کیفیت را در نمونه‌ها <span className="gold">ببینید</span></h2>
      <p className="lead">نمونه‌های زیر مفهومی و ساخته خود ما هستند (پروژه‌های واقعی به‌محض آماده‌شدن و با اجازه صاحبان‌شان منتشر می‌شوند) — کیفیت اجرا را همین‌جا ببینید.</p>
    </div>
    <div className="pf-grid2">
      {homePortfolio.map((p, i) => (
        <PortfolioCard
          key={p.slug}
          delay={i % 3}
          p={{
            slug: p.slug,
            title: p.title,
            category: p.category,
            summary: p.description,
            imageUrl: p.imageUrl,
            imageHeight: p.imageHeight,
            chips: p.chips,
            isConceptual: p.isConceptual,
          }}
        />
      ))}
    </div>
    <div style={{'textAlign': 'center', 'marginTop': '44px'}} className="reveal">
      <Link href="/portfolio" className="btn btn-ghost" >مشاهده همه نمونه‌کارها (با فیلتر دسته‌بندی)
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
      </Link>
    </div>
  </div>
</section>


<section className="section" id="process" style={{'background': 'var(--bg-1)', 'borderBlock': '1px solid var(--line)'}}>
  <div className="wrap">
    <div className="section-head reveal">
      <span className="eyebrow">فرایند همکاری</span>
      <h2 className="h2">شش مرحله شفاف، از درخواست تا تحویل</h2>
      <p className="lead">در هر گام می‌دانید کجا هستید، چه چیزی تحویل می‌گیرید و گام بعدی چیست.</p>
    </div>
    <div className="steps">
      <div className="step reveal"><span className="step-dot">۱</span><b>ثبت درخواست و نیازسنجی</b><p>فرم را پر می‌کنید یا تماس می‌گیرید؛ در جلسه اول کسب‌وکارتان را می‌شنویم.</p></div>
      <div className="step reveal" data-delay="1"><span className="step-dot">۲</span><b>تحلیل و تعیین محدوده</b><p>دامنه کار، امکانات، زمان‌بندی و برآورد شفاف — پیش از هر تعهدی.</p></div>
      <div className="step reveal" data-delay="2"><span className="step-dot">۳</span><b>طراحی ساختار و رابط کاربری</b><p>معماری اطلاعات و طراحی UI/UX؛ با بازبینی و تأیید شما.</p></div>
      <div className="step reveal" data-delay="3"><span className="step-dot">۴</span><b>توسعه و پیاده‌سازی</b><p>کدنویسی استاندارد، پیاده‌سازی محتوا و اتصال قابلیت‌ها.</p></div>
      <div className="step reveal" data-delay="3"><span className="step-dot">۵</span><b>بررسی کیفیت، عملکرد و سئو</b><p>تست سرعت، ریسپانسیو و دسترس‌پذیری؛ بررسی ساختار سئو.</p></div>
      <div className="step reveal" data-delay="3"><span className="step-dot">۶</span><b>تحویل و پشتیبانی</b><p>انتشار، آموزش پنل مدیریت و پشتیبانی توافق‌شده پس از تحویل.</p></div>
    </div>
  </div>
</section>


<PackagesSection />


<section className="section" style={{'paddingTop': '30px'}}>
  <div className="wrap">
    <div className="section-head reveal">
      <span className="eyebrow">مجله کافه‌دانش</span>
      <h2 className="h2">خواندنی‌های تخصصی دیجیتال</h2>
      <p className="lead">هر هفته یک مطلب کاربردی درباره طراحی سایت، سئو، محتوا و هوش مصنوعی — به زبان ساده.</p>
    </div>
    <div className="posts-grid">
      {latestPosts.map((a, i) => (
        <PostCard key={a.slug} a={{ ...a, excerpt: a.excerpt || '' }} delay={i % 3} />
      ))}
    </div>
    <div style={{'textAlign': 'center', 'marginTop': '36px'}} className="reveal">
      <Link href="/blog" className="btn btn-ghost" >مشاهده همه مقالات
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
      </Link>
    </div>
  </div>
</section>


<section className="section" id="faq" style={{'background': 'var(--bg-1)', 'borderBlock': '1px solid var(--line)'}}>
  <div className="wrap">
    <div className="section-head reveal">
      <span className="eyebrow">سؤالات متداول</span>
      <h2 className="h2">قبل از شروع پروژه بهتر است بدانید</h2>
    </div>
    <FaqAccordion items={homeFaq} />
    <div style={{'textAlign': 'center', 'marginTop': '34px'}} className="reveal">
      <Link href="/faq" className="btn btn-ghost" >مشاهده همه سؤالات متداول
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
      </Link>
    </div>
  </div>
</section>


<section className="section-tight">
  <div className="wrap">
    <div className="cta-banner reveal">
      <div>
        <h2>برای شروع دیجیتال کسب‌وکارتان آماده‌اید؟</h2>
        <p>جلسه اول مشاوره رایگان است: اهداف‌تان را می‌شنویم، نیازها را مشخص می‌کنیم و مسیر پیشنهادی را برای شناخت دقیق و تعیین مسیر همکاری با هم می‌چینیم.</p>
      </div>
      <div className="cta-actions">
        <Link href="/request" className="btn btn-dark btn-lg" >درخواست مشاوره رایگان</Link>
        <Link href="/portfolio" className="btn btn-ghost btn-lg"  style={{'borderColor': 'rgba(34,25,3,.3)', 'color': '#171208'}}>مشاهده نمونه‌کارها</Link>
      </div>
    </div>
  </div>
</section>


    </>
  )
}
