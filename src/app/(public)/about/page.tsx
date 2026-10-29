import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/site/breadcrumbs'
import CtaBanner from '@/components/site/cta-banner'

export const metadata: Metadata = {
  title: 'درباره کافه‌دانش',
  description:
    'آشنایی با استودیو دیجیتال کافه‌دانش: نگاه، تخصص‌ها و شیوه کار ما در پروژه‌های دیجیتال.',
  alternates: { canonical: '/about' },
  openGraph: { title: 'درباره کافه‌دانش | کافه‌دانش', url: '/about' },
}

export default function AboutPage() {
  return (
    <>
      {/* ═══ هیرو درباره ما ═══ */}
      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs items={[{ label: 'درباره ما' }]} />
          <span className="eyebrow reveal in">درباره کافه‌دانش</span>
          <h1 className="h1 reveal in">
            تیم کوچک با <span className="gold">استانداردهای بزرگ</span>
          </h1>
          <p className="lead reveal in" data-delay="1">
            کافه‌دانش یک استودیوی دیجیتال است که روی سه چیز تمرکز دارد: طراحی مهندسی‌شده، محتوای
            واقعی و شفافیت با مشتری.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="wrap">
          <div className="split">
            <div className="prose reveal">
              <h2>داستان ما</h2>
              <p>
                کافه‌دانش از یک مشاهده ساده شروع شد: بیشتر کسب‌وکارها بین «طراح سایت»، «کارشناس
                سئو» و «نویسنده محتوا» سرگردان‌اند؛ هرکدام بخشی از کار را می‌کنند، هیچ‌کس کل مسیر را
                پاسخگو نیست و نتیجه، سایت‌هایی است که ظاهر دارند اما نتیجه نمی‌سازند.
              </p>
              <p>
                ما تصمیم گرفتیم کل زنجیره را زیر یک سقف بیاوریم: از طراحی سایت اختصاصی و UI/UX تا
                سئوی تکنیکال، تولید محتوای تخصصی و ابزارهای هوش مصنوعی کاربردی. وقتی همه این‌ها را
                یک تیم و با یک زبان مشترک انجام می‌دهد، نتیجه منسجم‌تر و هزینه ارتباطی شما کمتر است.
              </p>
              <h2>نگاه ما به کار</h2>
              <ul className="check-list">
                <li>
                  <strong>شفافیت قبل از تبلیغ:</strong> چیزی که انجام نمی‌دهیم را هم صادقانه
                  می‌گوییم؛ مثل تضمین رتبه اول گوگل.
                </li>
                <li>
                  <strong>مهندسی به‌جای ظاهرسازی:</strong> هر تصمیم طراحی باید یک دلیل کاربردی
                  داشته باشد.
                </li>
                <li>
                  <strong>تحویل مرحله‌ای:</strong> پیشرفت پروژه قابل دیدن است، نه پنهان پشت «به‌زودی
                  آماده می‌شود».
                </li>
                <li>
                  <strong>ابزار، نه شعار:</strong> هوش مصنوعی را جایی به کار می‌بریم که واقعاً کار
                  را سریع‌تر کند — با بازبینی انسانی.
                </li>
              </ul>
              <h2>چه کارهایی می‌کنیم</h2>
              <p>
                طراحی سایت حرفه‌ای و اختصاصی، سایت شرکتی/خدماتی/فروشگاهی، برنامه‌نویسی و توسعه وب،
                طراحی UI/UX، سئو تکنیکال و محتوایی، تولید مقالات تخصصی، استراتژی و تقویم محتوایی،
                ساخت دستیارهای هوشمند و ابزارهای AI، خودکارسازی فرایندها و پشتیبانی و توسعه مداوم.
                فهرست کامل با جزئیات در{' '}
                <Link href="/#services" style={{ color: 'var(--gold)' }}>
                  صفحه خدمات
                </Link>{' '}
                آمده است.
              </p>
              <h2>چه کارهایی نمی‌کنیم</h2>
              <p>
                قالب آماده را با اسم شما نمی‌فروشیم، رتبه گوگل تضمین نمی‌کنیم، محتوای بدون تحقیق
                تحویل نمی‌دهیم و قابلیتی را که نداریم، «داریم» جلوه نمی‌دهیم. این فهرست کوتاه، دلیل
                اعتماد بلندمدت مشتریان به یک تیم است.
              </p>
            </div>
            <aside>
              <div className="aside-card reveal" data-delay="1">
                <b>در یک نگاه</b>
                <div className="plan-list">
                  <div className="plan-row">
                    <span>
                      <b>۱۲</b>
                      <span>خدمت تخصصی</span>
                    </span>
                  </div>
                  <div className="plan-row">
                    <span>
                      <b>۴</b>
                      <span>حوزه تخصصی: طراحی، سئو، محتوا، هوش مصنوعی</span>
                    </span>
                  </div>
                  <div className="plan-row">
                    <span>
                      <b>۸</b>
                      <span>ابزار هوشمند محتوا</span>
                    </span>
                  </div>
                  <div className="plan-row">
                    <span>
                      <b>۵</b>
                      <span>مرحله فرایند شفاف</span>
                    </span>
                  </div>
                </div>
              </div>
              <div
                className="aside-card reveal"
                data-delay="2"
                style={{
                  background: 'linear-gradient(150deg,rgba(227,185,83,.14),rgba(227,185,83,.04))',
                  borderColor: 'rgba(227,185,83,.35)',
                }}
              >
                <b>گفت‌وگو کنیم؟</b>
                <p className="muted" style={{ fontSize: '13.5px', marginBottom: '14px' }}>
                  جلسه اول مشاوره رایگان است — ایده‌تان را می‌شنویم و مسیر را با هم می‌چینیم.
                </p>
                <Link href="/request" className="btn btn-gold btn-block">
                  درخواست مشاوره
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <CtaBanner
        title="پروژه بعدی ما، پروژه شماست؟"
        text="از یک گفت‌وگوی هدفمند برای شناخت نیازها و تعیین مسیر همکاری شروع کنیم."
        primary={{ href: '/request', label: 'شروع گفت‌وگو' }}
        secondary={{ href: '/portfolio', label: 'نمونه‌کارها' }}
      />
    </>
  )
}
