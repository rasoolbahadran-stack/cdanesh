/**
 * آکاردئون سؤالات متداول — با details/summary (قابل استفاده با کیبورد، بدون JS)
 * داده از دیتابیس می‌آید؛ Schema فقط با محتوای واقعی صفحه ساخته می‌شود.
 */
export default function FaqAccordion({
  items,
  schema = true,
}: {
  items: { q: string; a: string }[]
  schema?: boolean
}) {
  if (!items?.length) return null

  const jsonLd = schema
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      }
    : null

  return (
    <div className="faq-list">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      {items.map((f, i) => (
        <details className="faq-item" key={i} {...(i === 0 ? { open: true } : {})}>
          <summary>
            <span>{f.q}</span>
            <span className="fx" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </span>
          </summary>
          <div className="faq-a">
            <div>
              <p>{f.a}</p>
            </div>
          </div>
        </details>
      ))}
    </div>
  )
}
