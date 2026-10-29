import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/site/breadcrumbs'
import PostCard from '@/components/site/post-card'
import CtaBanner from '@/components/site/cta-banner'
import { getCategories, getPublishedArticles } from '@/lib/content'
import { toFaDigits } from '@/lib/fa'

const PER_PAGE = 9

export const metadata: Metadata = {
  title: { absolute: 'مجله کافه‌دانش | مقالات تخصصی طراحی سایت، سئو و هوش مصنوعی' },
  description:
    'مقالات تخصصی طراحی سایت، سئو، تولید محتوا، سرعت و هوش مصنوعی — به زبان ساده، بدون اغراق و با کاربرد عملی برای کسب‌وکار شما.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'مجله کافه‌دانش | مقالات تخصصی طراحی سایت، سئو و هوش مصنوعی',
    description:
      'مقالات تخصصی طراحی سایت، سئو، تولید محتوا، سرعت و هوش مصنوعی — به زبان ساده، بدون اغراق و با کاربرد عملی برای کسب‌وکار شما.',
    url: '/blog',
    type: 'website',
  },
}

type BlogSearchParams = { cat?: string; tag?: string; q?: string; page?: string }

/** لینک صفحه‌بندی با حفظ فیلترهای فعلی (cat/tag/q) */
function pageHref(filters: { cat?: string; tag?: string; q?: string }, page: number): string {
  const params = new URLSearchParams()
  if (filters.cat) params.set('cat', filters.cat)
  if (filters.tag) params.set('tag', filters.tag)
  if (filters.q) params.set('q', filters.q)
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `/blog?${qs}` : '/blog'
}

/** شماره صفحه‌ها با بی‌نهایت؛ تا ۹ صفحه همه نمایش داده می‌شوند */
function paginationRange(current: number, total: number): (number | 'gap')[] {
  if (total <= 9) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | 'gap')[] = []
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - current) <= 1) out.push(p)
    else if (out[out.length - 1] !== 'gap') out.push('gap')
  }
  return out
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<BlogSearchParams> }) {
  const sp = await searchParams
  const cat = sp.cat?.trim() || undefined
  const tag = sp.tag?.trim() || undefined
  const q = sp.q?.trim() || undefined
  const requested = Math.max(1, Number.parseInt(sp.page || '1', 10) || 1)

  const filters = { cat, tag, q }
  const [categories, firstPage] = await Promise.all([
    getCategories(),
    getPublishedArticles({ page: requested, perPage: PER_PAGE, catSlug: cat, tagSlug: tag, q }),
  ])

  // شماره صفحه خارج از محدوده → نمایش آخرین صفحه واقعی (مطابق رفتار نسخه استاتیک)
  let result = firstPage
  let page = requested
  if (!result.items.length && page > result.pages) {
    page = result.pages
    result = await getPublishedArticles({ page, perPage: PER_PAGE, catSlug: cat, tagSlug: tag, q })
  }

  const range = paginationRange(page, result.pages)

  return (
    <>
      {/* ═══ هیرو مجله ═══ */}
      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs items={[{ label: 'مجله' }]} />
          <span className="eyebrow">مجله کافه‌دانش</span>
          <h1 className="h1">
            دانش دیجیتال، <span className="gold">به زبان ساده</span>
          </h1>
          <p className="lead">
            مقالات تخصصی طراحی سایت، سئو، تولید محتوا و هوش مصنوعی — بدون اغراق و پیچیدگی غیرضروری.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="wrap">
          {/* دسته‌بندی‌ها */}
          <div className="filter-chips" role="group" aria-label="دسته‌بندی مقالات">
            <Link href="/blog" className={!cat && !tag ? 'active' : undefined}>
              همه
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/blog?cat=${encodeURIComponent(c.slug)}`}
                className={cat === c.slug ? 'active' : undefined}
              >
                {c.name}
              </Link>
            ))}
          </div>

          {/* جست‌وجو (فرم HTML خالص — بدون جاوااسکریپت) */}
          <form className="blog-search" action="/blog" method="get">
            {cat && <input type="hidden" name="cat" value={cat} />}
            {tag && <input type="hidden" name="tag" value={tag} />}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              className="control"
              type="search"
              name="q"
              defaultValue={q}
              placeholder="جست‌وجو در مقالات…"
              aria-label="جست‌وجو در مقالات"
            />
            <button type="submit" className="btn btn-gold">
              جست‌وجو
            </button>
          </form>

          {/* شبکه مقالات */}
          {result.items.length ? (
            <div className="posts-grid" style={{ marginTop: 40 }} aria-live="polite">
              {result.items.map((item, i) => (
                <PostCard key={item.id} a={item} delay={i % 3} />
              ))}
            </div>
          ) : (
            <div className="blog-empty" style={{ display: 'block' }}>
              <p>مقاله‌ای با این فیلتر پیدا نشد.</p>
              <Link className="btn btn-ghost" href="/blog" style={{ marginTop: 20 }}>
                حذف فیلترها
              </Link>
            </div>
          )}

          {/* صفحه‌بندی */}
          {result.pages > 1 && (
            <nav className="pagination" aria-label="صفحه‌بندی">
              {page > 1 ? (
                <Link href={pageHref(filters, page - 1)} aria-label="صفحه قبل">
                  →
                </Link>
              ) : (
                <span className="page-disabled" aria-hidden="true">
                  →
                </span>
              )}
              {range.map((it, i) =>
                it === 'gap' ? (
                  <span key={`gap-${i}`} aria-hidden="true">
                    …
                  </span>
                ) : it === page ? (
                  <span key={it} className="page-current" aria-current="page">
                    {toFaDigits(it)}
                  </span>
                ) : (
                  <Link key={it} href={pageHref(filters, it)} aria-label={`صفحه ${toFaDigits(it)}`}>
                    {toFaDigits(it)}
                  </Link>
                ),
              )}
              {page < result.pages ? (
                <Link href={pageHref(filters, page + 1)} aria-label="صفحه بعد">
                  ←
                </Link>
              ) : (
                <span className="page-disabled" aria-hidden="true">
                  ←
                </span>
              )}
            </nav>
          )}
        </div>
      </section>

      {/* ═══ CTA پایانی ═══ */}
      <CtaBanner />
    </>
  )
}
