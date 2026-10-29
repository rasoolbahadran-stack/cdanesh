import Link from 'next/link'
import type { Block } from '@/lib/blocks'

/**
 * رندر بلوک‌های محتوای مقاله — معادل رندر استاتیک تأییدشده.
 * هر بلوک یک عنصر معنایی است؛ تصاویر lazy با ابعاد مشخص.
 */
export default function ArticleBlocks({ blocks }: { blocks: Block[] }) {
  const toc = blocks.filter((b): b is { h2: string; id?: string } => 'h2' in b)

  return (
    <div className="article-body">
      {toc.length >= 3 && (
        <nav className="toc-box" aria-label="فهرست مطالب">
          <b>فهرست مطالب</b>
          <ol>
            {toc.map((h, i) => (
              <li key={i}>
                <a href={`#${h.id || `s${i + 1}`}`}>{h.h2}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {blocks.map((b, i) => {
        if ('p' in b) return <p key={i}>{b.p}</p>
        if ('h2' in b)
          return (
            <h2 key={i} id={b.id || `s${toc.findIndex((t) => t.h2 === b.h2) + 1}`}>
              {b.h2}
            </h2>
          )
        if ('h3' in b) return <h3 key={i}>{b.h3}</h3>
        if ('ul' in b)
          return (
            <ul key={i}>
              {b.ul.map((li, j) => (
                <li key={j} dangerouslySetInnerHTML={{ __html: li }} />
              ))}
            </ul>
          )
        if ('ol' in b)
          return (
            <ol key={i}>
              {b.ol.map((li, j) => (
                <li key={j} dangerouslySetInnerHTML={{ __html: li }} />
              ))}
            </ol>
          )
        if ('quote' in b)
          return (
            <blockquote key={i}>
              <p>{b.quote}</p>
            </blockquote>
          )
        if ('img' in b)
          return (
            <figure key={i} className="article-figure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.img.src}
                alt={b.img.alt}
                loading="lazy"
                width={1200}
                height={675}
                style={{ width: '100%', height: 'auto', borderRadius: 16 }}
              />
              {b.img.cap && <figcaption>{b.img.cap}</figcaption>}
            </figure>
          )
        if ('cta' in b)
          return (
            <div key={i} className="article-cta">
              <p>
                {b.cta.pre ? `${b.cta.pre} ` : ''}
                <Link href={b.cta.link || '/request'}>{b.cta.label}</Link>
                {b.cta.post ? ` ${b.cta.post}` : ''}
              </p>
            </div>
          )
        return null
      })}
    </div>
  )
}
