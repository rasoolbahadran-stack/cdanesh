import Image from 'next/image'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { jalaliDate, toFaDigits } from '@/lib/fa'

export interface ArticleCardData {
  slug: string
  title: string
  excerpt: string | null
  coverImage: string | null
  coverAlt: string | null
  readTime: number
  publishedAt: Date | null
  categoryName?: string | null
}

export function ArticleCard({ article }: { article: ArticleCardData }) {
  return (
    <article className="card-hover group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Link
        href={`/blog/${article.slug}`}
        className="relative block aspect-[16/9] overflow-hidden bg-slate-100 focus-ring"
        aria-label={`مطالعه مقاله: ${article.title}`}
      >
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt={article.coverAlt ?? article.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center brand-gradient text-4xl font-extrabold text-white/90">
            KD
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
          {article.categoryName && (
            <span className="rounded-full bg-brand/8 px-2.5 py-1 font-semibold text-brand">
              {article.categoryName}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {toFaDigits(article.readTime)} دقیقه مطالعه
          </span>
        </div>
        <h3 className="mb-2.5 text-lg font-bold leading-7 text-slate-900">
          <Link href={`/blog/${article.slug}`} className="transition-colors hover:text-brand focus-ring">
            {article.title}
          </Link>
        </h3>
        {article.excerpt && (
          <p className="mb-4 line-clamp-3 text-sm leading-6.5 text-slate-600">{article.excerpt}</p>
        )}
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
          <time className="text-xs text-slate-500" dateTime={article.publishedAt?.toISOString()}>
            {jalaliDate(article.publishedAt)}
          </time>
          <Link
            href={`/blog/${article.slug}`}
            className="text-sm font-semibold text-brand transition-all hover:gap-1 focus-ring"
            aria-label={`ادامه مقاله: ${article.title}`}
          >
            ادامه مطلب ←
          </Link>
        </div>
      </div>
    </article>
  )
}
