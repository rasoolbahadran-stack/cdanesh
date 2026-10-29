import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Breadcrumbs from '@/components/site/breadcrumbs'
import CtaBanner from '@/components/site/cta-banner'
import { getPortfolioBySlug } from '@/lib/content'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const item = await getPortfolioBySlug(slug)
  if (!item) return { title: 'نمونه‌کار پیدا نشد' }
  return {
    title: { absolute: item.metaTitle || `${item.title} | نمونه‌کار کافه‌دانش` },
    description: item.metaDescription || item.description,
    alternates: { canonical: `/portfolio/${item.slug}` },
    openGraph: {
      title: item.metaTitle || item.title,
      description: item.metaDescription || item.description,
      url: `/portfolio/${item.slug}`,
      images: [{ url: item.imageUrl }],
    },
  }
}

export default async function PortfolioDetailPage({ params }: Props) {
  const { slug } = await params
  const item = await getPortfolioBySlug(slug)
  if (!item) notFound()

  const s = item.sections
  const goal: string[] = s.goal || []
  const points: string[] = s.points || []
  const specs: [string, string][] = s.specs || []
  const features: [string, string][] = s.features || []

  return (
    <>
      {/* ─── هیرو پروژه ─── */}
      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs
            items={[{ label: 'نمونه‌کارها', href: '/portfolio' }, { label: item.title }]}
          />
          <span className="eyebrow reveal in">نمونه‌کار {item.category}</span>
          <h1 className="h1 reveal in">{s.h1 || item.title}</h1>
          <p className="lead reveal in" data-delay="1">
            {item.description}
          </p>
          <div className="page-hero-pills reveal in" data-delay="2">
            <span className="chip chip-gold">{item.category}</span>
            {item.isConceptual && <span className="badge-demo">نمونه مفهومی — پروژه نمایشی</span>}
            {item.chips.map((c) => (
              <span className="chip" key={c}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── پیش‌نمایش کامل صفحه (اسکرول داخل قاب) ─── */}
      <section className="section-tight">
        <div className="wrap">
          <div className="pf-card">
            <div className="pf-head">
              <span className="dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="pf-url">cdanesh.ir/demo/{item.slug}</span>
            </div>
            <div
              className="pf-window custom-scrollbar"
              role="region"
              aria-label={`پیش‌نمایش کامل ${item.title} — اسکرول داخل قاب`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.imageUrl}
                alt={`نمای کامل صفحه ${item.title} — نمونه مفهومی`}
                width={1280}
                height={item.imageHeight}
                loading="lazy"
              />
            </div>
          </div>
          <p className="muted small" style={{ textAlign: 'center', marginTop: '18px' }}>
            این تصویر، نمای کاملِ صفحه‌ی اصلی نمونه است. داخل قاب اسکرول کنید تا همه بخش‌ها را
            ببینید.
          </p>
        </div>
      </section>

      {/* ─── درباره پروژه + مشخصات ─── */}
      <section className="section" style={{ paddingTop: '40px' }}>
        <div className="wrap split">
          <div className="reveal">
            <span className="eyebrow">درباره پروژه</span>
            <h2 className="h2">
              هدف و روند <span className="gold">اجرای پروژه</span>
            </h2>
            {goal.map((g, i) => (
              <p key={i} style={{ color: 'var(--mut)', lineHeight: '2.1', marginTop: '16px' }}>
                {g}
              </p>
            ))}
            {points.length > 0 && (
              <ul className="duo-points" style={{ marginTop: '24px' }}>
                {points.map((pt, i) => (
                  <li key={i}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <aside className="aside-card reveal" data-delay="1">
            <b style={{ fontSize: '16px' }}>مشخصات پروژه</b>
            <ul style={{ marginTop: '16px', display: 'grid', gap: '12px', fontSize: '13.5px', color: 'var(--mut)' }}>
              {specs.map(([label, value], i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span>{label}</span>
                  <b style={{ color: value === 'نمونه مفهومی' ? 'var(--warn)' : 'var(--txt)' }}>{value}</b>
                </li>
              ))}
            </ul>
            {item.isConceptual && (
              <p className="pkg-note">
                این نمونه برای نمایش سبک کار و کیفیت اجرای ما ساخته شده است؛ هیچ کسب‌وکار واقعی به
                آن اشاره ندارد.
              </p>
            )}
            <Link href="/request" className="btn btn-gold btn-block" style={{ marginTop: '18px' }}>
              پروژه مشابه می‌خواهم
            </Link>
          </aside>
        </div>
      </section>

      {/* ─── امکانات کلیدی ─── */}
      {features.length > 0 && (
        <section className="section-tight" style={{ paddingBottom: '20px' }}>
          <div className="wrap">
            <span className="eyebrow">امکانات کلیدی</span>
            <h2 className="h2" style={{ marginTop: '10px' }}>
              چه چیزهایی در این نمونه <span className="gold">پیاده شده است</span>؟
            </h2>
            <div
              className="feat-grid"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '18px', marginTop: '34px' }}
            >
              {features.map(([title, desc], i) => (
                <div className="feat-card" key={i}>
                  <b>{title}</b>
                  <p style={{ fontSize: '13px', color: 'var(--mut)', marginTop: '8px', lineHeight: '1.9' }}>
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBanner
        title="پروژه‌ای شبیه این نمونه در سر دارید؟"
        text="در جلسه مشاوره، دقیقاً می‌گوییم چه ساختار و چه امکاناتی برای هدف شما لازم است."
        primary={{ href: '/request', label: 'شروع پروژه' }}
        secondary={{ href: '/portfolio', label: 'نمونه‌کارهای دیگر' }}
      />
    </>
  )
}
