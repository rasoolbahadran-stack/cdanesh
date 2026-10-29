import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ArticleBlocks from '@/components/site/article-blocks'
import Breadcrumbs from '@/components/site/breadcrumbs'
import CtaBanner from '@/components/site/cta-banner'
import FaqAccordion from '@/components/site/faq-accordion'
import PostCard from '@/components/site/post-card'
import {
  getArticleBySlug,
  getFaqForPage,
  getRelatedArticles,
  parseArticleContent,
} from '@/lib/content'
import { jalaliDate, jalaliDateShort, toFaDigits } from '@/lib/fa'
import { getSiteSettings } from '@/lib/settings'
import { SITE } from '@/lib/site'

type ArticleParams = { slug: string }

export async function generateMetadata({ params }: { params: Promise<ArticleParams> }): Promise<Metadata> {
  const { slug } = await params
  const a = await getArticleBySlug(slug)
  if (!a) return {}

  const settings = await getSiteSettings()
  const title = a.metaTitle || a.title
  const description = a.metaDescription || a.excerpt

  return {
    // عنوان سئو کامل ذخیره می‌شود؛ در نبودش عنوان مقاله با قالب سراسری کامل می‌شود (مطابق نسخه استاتیک)
    title: a.metaTitle ? { absolute: a.metaTitle } : a.title,
    description,
    alternates: { canonical: a.canonicalUrl || `/blog/${slug}` },
    openGraph: {
      title: a.ogTitle || title,
      description: a.ogDescription || a.metaDescription || a.excerpt,
      images: [a.ogImage || a.coverImage || settings.ogImage],
      type: 'article',
      publishedTime: a.publishedAt?.toISOString(),
      modifiedTime: a.updatedAt.toISOString(),
    },
    robots: a.noindex ? { index: false, follow: false } : undefined,
  }
}

export default async function ArticlePage({ params }: { params: Promise<ArticleParams> }) {
  const { slug } = await params
  const article = await getArticleBySlug(slug)
  if (!article) notFound()

  const [settings, faq, related] = await Promise.all([
    getSiteSettings(),
    getFaqForPage(`article:${article.slug}`),
    getRelatedArticles(article, 3),
  ])

  const blocks = parseArticleContent(article.content)
  const cover = article.coverImage || settings.ogImage
  const pageUrl = `${SITE.url}/blog/${article.slug}`

  // داده ساختاریافته مقاله — مطابق نسخه استاتیک
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription || article.excerpt,
    image: new URL(cover, SITE.url).toString(),
    datePublished: (article.publishedAt ?? article.updatedAt).toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: { '@type': 'Person', name: article.author.name },
    publisher: { '@type': 'Organization', name: settings.siteName },
    mainEntityOfPage: pageUrl,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      {/* ═══ بنر مقاله ═══ */}
      <section className="article-hero">
        <div className="wrap">
          <div className="article-hero-grid">
            <div className="article-head">
              <Breadcrumbs
                items={[
                  { label: 'مجله', href: '/blog' },
                  ...(article.category
                    ? [{ label: article.category.name, href: `/blog?cat=${article.category.slug}` }]
                    : []),
                  { label: article.title },
                ]}
              />
              <div className="article-cats">
                {article.category && (
                  <Link className="chip chip-gold" href={`/blog?cat=${article.category.slug}`}>
                    {article.category.name}
                  </Link>
                )}
              </div>
              <h1>{article.title}</h1>
              <div className="article-meta">
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 7h-9m9 5h-9m9 5h-9M4 7l2 2-2 2m2 6 2 2-2 2" />
                  </svg>
                  {article.author.name}
                </span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="17" rx="3" />
                    <path d="M8 2v4m8-4v4M3 10h18" />
                  </svg>
                  {jalaliDate(article.publishedAt)}
                </span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                  {toFaDigits(article.readTime)} دقیقه مطالعه
                </span>
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  آخرین به‌روزرسانی: {jalaliDateShort(article.updatedAt)}
                </span>
              </div>
            </div>
            <div className="article-hero-cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cover}
                alt={article.coverAlt || article.title}
                width={1200}
                height={630}
                loading="eager"
                fetchPriority="high"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ بدنه مقاله ═══ */}
      <section className="section-tight" style={{ paddingTop: 10 }}>
        <div className="wrap">
          <div className="split">
            <article className="prose">
              <ArticleBlocks blocks={blocks} />

              {/* برچسب‌ها */}
              {article.tags.length > 0 && (
                <div className="post-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <b style={{ fontSize: 13.5, color: 'var(--faint)' }}>برچسب‌ها:</b>
                  {article.tags.map(({ tag }) => (
                    <Link key={tag.slug} className="chip" href={`/blog?tag=${encodeURIComponent(tag.slug)}`}>
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </article>

            {/* کارت کنار مقاله — مطابق نسخه استاتیک */}
            <aside>
              <div
                className="aside-card"
                style={{ background: 'linear-gradient(150deg,rgba(227,185,83,.14),rgba(227,185,83,.04))', borderColor: 'rgba(227,185,83,.35)' }}
              >
                <b>پروژه مشابهی در ذهن دارید؟</b>
                <p className="muted" style={{ fontSize: 14, marginBottom: 14 }}>
                  در جلسه کوتاه مشاوره، نیاز شما بررسی و مسیر پیشنهادی ارائه می‌شود.
                </p>
                <Link className="btn btn-gold btn-block" href="/request">
                  درخواست مشاوره رایگان
                </Link>
              </div>
            </aside>
          </div>

          {/* پرسش‌های متداول مقاله */}
          {faq.length > 0 && (
            <div style={{ marginTop: 64 }}>
              <div className="section-head side" style={{ marginBottom: 26 }}>
                <h2 className="h3">پرسش‌های متداول این مقاله</h2>
              </div>
              <FaqAccordion items={faq} />
            </div>
          )}

          {/* مقالات مرتبط */}
          {related.length > 0 && (
            <div style={{ marginTop: 70 }}>
              <div className="section-head side" style={{ marginBottom: 30 }}>
                <h2 className="h3">مقالات مرتبط</h2>
              </div>
              <div className="posts-grid">
                {related.map((a, i) => (
                  <PostCard key={a.id} a={a} delay={i % 3} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══ CTA پایانی ═══ */}
      <CtaBanner />
    </>
  )
}
