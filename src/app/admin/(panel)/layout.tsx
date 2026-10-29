import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { logoutAction } from '@/lib/actions/auth-actions'
import { publishDueScheduledArticles } from '@/lib/articles'
import { ROLE_LABELS } from '@/lib/fa'
import { AdminNav, type NavItem } from './nav-client'

export const metadata: Metadata = {
  title: { default: 'پنل مدیریت', template: '%s | پنل کافه‌دانش' },
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const svg = (children: React.ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
)

const NAV_ITEMS: NavItem[] = [
  {
    href: '/admin',
    label: 'داشبورد',
    icon: svg(
      <>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </>
    ),
  },
  {
    href: '/admin/articles',
    label: 'مقالات',
    icon: svg(
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M9 13h6M9 17h6" />
      </>
    ),
  },
  {
    href: '/admin/categories',
    label: 'دسته‌بندی‌ها',
    icon: svg(
      <>
        <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7-7A2 2 0 0 1 3 12.2V5a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6l7 7a2 2 0 0 1 0 2.8Z" />
        <circle cx="7.5" cy="7.5" r=".5" />
      </>
    ),
  },
  {
    href: '/admin/portfolio',
    label: 'نمونه‌کارها',
    icon: svg(
      <>
        <rect x="3" y="7" width="18" height="13" rx="3" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
  },
  {
    href: '/admin/faq',
    label: 'سؤالات متداول',
    icon: svg(
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.2 9a2.8 2.8 0 0 1 5.5.7c0 1.8-2.7 2.3-2.7 3.8M12 17h.01" />
      </>
    ),
  },
  {
    href: '/admin/media',
    label: 'رسانه‌ها',
    icon: svg(
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
      </>
    ),
  },
  {
    href: '/admin/requests',
    label: 'درخواست‌ها',
    icon: svg(
      <>
        <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20l1-4.9a8.4 8.4 0 1 1 17-3.6Z" />
      </>
    ),
  },
  {
    href: '/admin/seo',
    label: 'سئو',
    icon: svg(
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3M11 8v6M8 11h6" />
      </>
    ),
  },
  {
    href: '/admin/packages',
    label: 'پکیج‌ها و تعرفه',
    icon: svg(
      <>
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    ),
  },
  {
    href: '/admin/users',
    label: 'کاربران',
    icon: svg(
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    href: '/admin/settings',
    label: 'تنظیمات',
    icon: svg(
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.5 1Z" />
      </>
    ),
  },
  {
    href: '/admin/activity',
    label: 'گزارش فعالیت',
    icon: svg(
      <>
        <path d="M3 12h4l3-8 4 16 3-8h4" />
      </>
    ),
  },
]

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect('/admin/login')

  // انتشار مقالات زمان‌بندی‌شده‌ای که زمانشان رسیده (Lazy Publish)
  await publishDueScheduledArticles()

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link className="brand" href="/admin" style={{ marginBottom: 30 }}>
          <span className="brand-mark" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" />
          </span>
          <span className="brand-name">
            کافه‌دانش
            <small>PANEL</small>
          </span>
        </Link>

        <AdminNav items={NAV_ITEMS} />

        <a className="btn btn-ghost btn-sm btn-block" href="/" target="_blank" rel="noreferrer" style={{ marginTop: 14 }}>
          مشاهده سایت
        </a>
        <form action={logoutAction} style={{ marginTop: 8 }}>
          <button
            className="btn btn-ghost btn-sm btn-block"
            type="submit"
            style={{ borderColor: 'rgba(229, 118, 106, .4)', color: 'var(--err)' }}
          >
            خروج از حساب
          </button>
        </form>
      </aside>

      <div className="admin-main">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 24,
            paddingBottom: 16,
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{user.name}</span>
            <span className="chip chip-gold" style={{ fontSize: 11.5 }}>
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
          <Link href="/admin/account" className="btn btn-ghost btn-sm">
            حساب کاربری
          </Link>
        </div>
        {children}
      </div>
    </div>
  )
}
