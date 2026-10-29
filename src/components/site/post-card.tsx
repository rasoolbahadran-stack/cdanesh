import Link from 'next/link'
import { jalaliDate, toFaDigits } from '@/lib/fa'
import type { ArticleListItem } from '@/lib/content'

/** کارت مقاله — مطابق طراحی تأییدشده استاتیک */
export default function PostCard({ a, delay = 0 }: { a: ArticleListItem; delay?: number }) {
  return (
    <article className="post-card reveal" data-delay={delay || undefined} data-cat={a.category?.slug || ''}>
      <div className="post-thumb">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.coverImage || '/img/cover-blog.webp'} alt={a.coverAlt || a.title} loading="lazy" width={640} height={380} />
        <span className="chip chip-gold">{a.category?.name || 'مقاله'}</span>
      </div>
      <div className="post-body">
        <h3>
          <Link href={`/blog/${a.slug}`}>{a.title}</Link>
        </h3>
        <p>{a.excerpt}</p>
        <div className="post-meta">
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M8 2v4m8-4v4M3 10h18" /></svg>
            {jalaliDate(a.publishedAt)}
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
            {toFaDigits(a.readTime)} دقیقه مطالعه
          </span>
        </div>
      </div>
    </article>
  )
}
