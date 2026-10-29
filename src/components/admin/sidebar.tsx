'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Bot,
  FileText,
  FolderTree,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { logoutAction } from '@/lib/actions/auth-actions'
import { ROLE_LABELS } from '@/lib/fa'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

export function AdminSidebar({
  user,
}: {
  user: { name: string; role: string; username: string }
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const sections: { title: string; items: NavItem[] }[] = [
    {
      title: 'مرور کلی',
      items: [
        { href: '/admin', label: 'داشبورد', icon: LayoutDashboard },
        { href: '/admin/requests', label: 'درخواست‌ها', icon: Inbox },
      ],
    },
    {
      title: 'محتوا',
      items: [
        { href: '/admin/articles', label: 'مقالات', icon: FileText },
        { href: '/admin/categories', label: 'دسته‌بندی و برچسب', icon: FolderTree },
        { href: '/admin/media', label: 'رسانه‌ها', icon: Images },
        { href: '/admin/portfolio', label: 'نمونه‌کارها', icon: Sparkles },
      ],
    },
    {
      title: 'سیستم',
      items: [
        { href: '/admin/ai', label: 'هوش مصنوعی', icon: Bot },
        { href: '/admin/users', label: 'کاربران', icon: Users },
        { href: '/admin/settings', label: 'تنظیمات سایت', icon: Settings },
        { href: '/admin/activity', label: 'گزارش فعالیت', icon: ShieldCheck },
        { href: '/admin/account', label: 'حساب من', icon: Users },
      ],
    },
  ]

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const nav = (
    <nav className="flex h-full flex-col" aria-label="منوی مدیریت">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
        <Link href="/admin" className="flex items-center gap-2.5 focus-ring rounded-lg">
          <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-lg text-sm font-extrabold text-white">
            KD
          </span>
          <span className="text-base font-extrabold text-slate-900">پنل مدیریت</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 focus-ring lg:hidden"
          aria-label="بستن منو"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-5">
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-ring',
                      isActive(item.href)
                        ? 'bg-brand/8 font-bold text-brand'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-slate-200 p-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-extrabold text-brand">
            {user.name.slice(0, 2)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-800">{user.name}</p>
            <p className="text-xs text-slate-500">{ROLE_LABELS[user.role] ?? user.role}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-ring"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            خروج از حساب
          </button>
        </form>
      </div>
    </nav>
  )

  return (
    <>
      {/* دسکتاپ */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-[260px] border-e border-slate-200 bg-white lg:block">
        {nav}
      </aside>

      {/* موبایل — نوار بالا */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="brand-gradient flex h-8 w-8 items-center justify-center rounded-lg text-xs font-extrabold text-white">
            KD
          </span>
          <span className="text-sm font-extrabold text-slate-900">پنل مدیریت</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-ring"
          aria-label="باز کردن منوی مدیریت"
          aria-expanded={open}
        >
          <Menu className="h-5.5 w-5.5" />
        </button>
      </div>
      <div className="h-14 lg:hidden" aria-hidden />

      {/* کشوی موبایل */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 start-0 w-[290px] bg-white shadow-2xl">{nav}</div>
        </div>
      )}
    </>
  )
}
