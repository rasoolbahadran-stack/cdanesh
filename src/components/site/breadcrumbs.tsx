import Link from 'next/link'

export interface Crumb {
  label: string
  href?: string
}

/**
 * Breadcrumb با JSON-LD — همه لینک‌ها واقعی‌اند؛ صفحه جاری لینک ندارد.
 */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: 'خانه', href: '/' }, ...items]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href && i < all.length - 1 ? { item: c.href } : {}),
    })),
  }

  return (
    <nav className="breadcrumb" aria-label="مسیر صفحه">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {all.map((c, i) => {
        const isLast = i === all.length - 1
        return (
          <span key={`${c.label}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            {c.href && !isLast ? (
              <Link href={c.href}>{c.label}</Link>
            ) : (
              <span aria-current={isLast ? 'page' : undefined}>{c.label}</span>
            )}
            {!isLast && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
            )}
          </span>
        )
      })}
    </nav>
  )
}
