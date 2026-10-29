import Link from 'next/link'
import { ChevronLeft, Home } from 'lucide-react'
import { StructuredData } from '@/components/site/structured-data'

export interface Crumb {
  href: string
  label: string
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ href: '/', label: 'خانه' }, ...items]

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: item.href,
    })),
  }

  return (
    <nav aria-label="مسیر صفحه" className="mb-6">
      <StructuredData data={schema} />
      <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-slate-500">
        <li className="flex items-center gap-1.5">
          <Home className="h-3.5 w-3.5" aria-hidden />
          <Link href="/" className="transition-colors hover:text-brand focus-ring">
            خانه
          </Link>
        </li>
        {all.slice(1).map((item, i) => (
          <li key={item.href} className="flex items-center gap-1.5">
            <ChevronLeft className="h-3.5 w-3.5 text-slate-300" aria-hidden />
            {i === all.length - 2 ? (
              <span className="font-medium text-slate-700" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="transition-colors hover:text-brand focus-ring">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
