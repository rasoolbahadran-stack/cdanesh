'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

export function AdminNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav aria-label="ناوبری پنل">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={isActive(item.href) ? 'active' : undefined}>
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
