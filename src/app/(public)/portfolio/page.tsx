import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/site/breadcrumbs'
import PortfolioCard from '@/components/site/portfolio-card'
import CtaBanner from '@/components/site/cta-banner'
import { getPortfolioItems } from '@/lib/content'
import { toFaDigits } from '@/lib/fa'

export const metadata: Metadata = {
  title: 'نمونه‌کارها',
  description:
    'نمونه‌کارهای کافه‌دانش: فروشگاه اینترنتی، سایت شرکتی، کلینیک، مجله و دستیار هوشمند — هر پروژه را کامل و تا آخرین بخش صفحه ببینید.',
  alternates: { canonical: '/portfolio' },
  openGraph: { title: 'نمونه‌کارها | کافه‌دانش', url: '/portfolio' },
}

/** دسته‌بندی‌های فیلتر — کلید URL ↔ عنوان فارسی دسته در دیتابیس */
const CATS: { key: string; label: string }[] = [
  { key: 'shop', label: 'فروشگاهی' },
  { key: 'corporate', label: 'شرکتی' },
  { key: 'service', label: 'خدماتی' },
  { key: 'content', label: 'محتوایی' },
  { key: 'ai', label: 'هوش مصنوعی' },
]

// ظاهر چیپ‌های فیلتر = همان استایل `.pf-filters button` (روی <a> اعمال می‌شود)
const chipStyle: React.CSSProperties = {
  padding: '9px 20px',
  borderRadius: '999px',
  fontSize: '13.5px',
  fontWeight: 600,
  color: 'var(--mut)',
  background: 'var(--card)',
  border: '1px solid var(--line)',
  transition: '.25s',
}
const chipActiveStyle: React.CSSProperties = {
  background: 'var(--gold)',
  borderColor: 'var(--gold)',
  color: 'var(--gold-ink)',
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>
}) {
  const { cat } = await searchParams
  const activeCat = CATS.find((c) => c.key === cat)

  const all = await getPortfolioItems()
  const items = activeCat ? all.filter((p) => p.category === activeCat.label) : all

  // شمارش امانت‌دار: فقط وقتی همه نمونه‌های نمایش‌داده‌شده مفهومی‌اند
  const allConceptual = items.length > 0 && items.every((p) => p.isConceptual)
  const countText = `${toFaDigits(items.length)} ${allConceptual ? 'نمونه مفهومی' : 'نمونه'} ${
    activeCat ? `در دسته «${activeCat.label}»` : 'در همه دسته‌ها'
  }`

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs items={[{ label: 'نمونه‌کارها' }]} />
          <span className="eyebrow reveal in">نمونه‌کارها</span>
          <h1 className="h1 reveal in">
            هر پروژه را <span className="gold">تا آخرین صفحه</span> ببینید
          </h1>
          <p className="lead reveal in" data-delay="1">
            هر نمونه، نمای کامل و واقعیِ همان وب‌سایت است — از ابتدای صفحه تا فوتر. تصویر داخل هر
            قاب به‌صورت زنده مرور می‌شود و با کلیک، جزئیات همان پروژه باز می‌شود.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="wrap">
          {/* فیلتر دسته‌بندی — سمت سرور با پارامتر cat */}
          <div className="pf-filters" role="group" aria-label="فیلتر نمونه‌کارها بر اساس دسته‌بندی">
            <Link
              href="/portfolio"
              className={activeCat ? 'pf-filter' : 'pf-filter active'}
              style={{ ...chipStyle, ...(!activeCat ? chipActiveStyle : {}) }}
              aria-current={!activeCat ? 'true' : undefined}
            >
              همه
            </Link>
            {CATS.map((c) => {
              const isActive = activeCat?.key === c.key
              return (
                <Link
                  key={c.key}
                  href={`/portfolio?cat=${c.key}`}
                  className={isActive ? 'pf-filter active' : 'pf-filter'}
                  style={{ ...chipStyle, ...(isActive ? chipActiveStyle : {}) }}
                  aria-current={isActive ? 'true' : undefined}
                >
                  {c.label}
                </Link>
              )
            })}
          </div>
          <p className="pf-count" aria-live="polite">
            {countText}
          </p>

          <div className="pf-grid2">
            {items.map((p, i) => (
              <PortfolioCard
                key={p.slug}
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
                delay={i % 3}
              />
            ))}
          </div>
          <p
            className="muted small"
            style={{ textAlign: 'center', marginTop: '36px', maxWidth: '640px', marginInline: 'auto' }}
          >
            صادقانه: همه نمونه‌های بالا مفهومی و ساخته خود ما هستند و به کسب‌وکار واقعی اشاره‌ای
            ندارند. به‌محض اتمام پروژه‌های واقعی و با اجازه صاحبان‌شان، اینجا منتشر می‌شوند.
          </p>
        </div>
      </section>

      <CtaBanner
        title="کیفیت را در نمونه‌ها ببینید؛ در پروژه شما تجربه کنید"
        text="جلسه مشاوره رایگان برگزار می‌کنیم و دقیقاً می‌گوییم چه چیزی برای اهدافتان لازم است."
        primary={{ href: '/request', label: 'شروع پروژه' }}
      />
    </>
  )
}
