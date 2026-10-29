import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import { publishDueScheduledArticles } from '@/lib/articles'
import { faNumber, jalaliDateTime, toFaDigits } from '@/lib/fa'
import { SERVICE_TYPE_LABELS } from '@/lib/site'
import { StatusChip } from '@/components/admin/status-chip'

export const metadata: Metadata = { title: 'داشبورد' }
export const dynamic = 'force-dynamic'

const kpiIcon = (children: React.ReactNode) => (
  <span className="ico" aria-hidden="true">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  </span>
)

export default async function AdminDashboardPage() {
  await publishDueScheduledArticles()

  const now = new Date()

  const [
    publishedCount,
    draftCount,
    scheduledCount,
    newRequestCount,
    totalRequestCount,
    portfolioCount,
    mediaCount,
    latestRequests,
    latestActivity,
  ] = await Promise.all([
    db.article.count({ where: { status: 'PUBLISHED' } }),
    db.article.count({ where: { status: 'DRAFT' } }),
    db.article.count({ where: { status: 'SCHEDULED', scheduledAt: { gt: now } } }),
    db.serviceRequest.count({ where: { status: 'NEW' } }),
    db.serviceRequest.count(),
    db.portfolioItem.count(),
    db.media.count(),
    db.serviceRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    db.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { user: { select: { name: true } } } }),
  ])

  const kpis: { label: string; value: number; href: string; icon: React.ReactNode }[] = [
    {
      label: 'مقالات منتشرشده',
      value: publishedCount,
      href: '/admin/articles?status=PUBLISHED',
      icon: kpiIcon(
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6M9 13h6M9 17h6" />
        </>
      ),
    },
    {
      label: 'پیش‌نویس‌ها',
      value: draftCount,
      href: '/admin/articles?status=DRAFT',
      icon: kpiIcon(
        <>
          <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </>
      ),
    },
    {
      label: 'زمان‌بندی‌شده',
      value: scheduledCount,
      href: '/admin/articles?status=SCHEDULED',
      icon: kpiIcon(
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      ),
    },
    {
      label: 'درخواست جدید',
      value: newRequestCount,
      href: '/admin/requests?status=NEW',
      icon: kpiIcon(
        <>
          <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20l1-4.9a8.4 8.4 0 1 1 17-3.6Z" />
        </>
      ),
    },
    {
      label: 'کل درخواست‌ها',
      value: totalRequestCount,
      href: '/admin/requests',
      icon: kpiIcon(
        <>
          <path d="M3 5h18M3 12h18M3 19h18" />
        </>
      ),
    },
    {
      label: 'نمونه‌کارها',
      value: portfolioCount,
      href: '/admin/portfolio',
      icon: kpiIcon(
        <>
          <rect x="3" y="7" width="18" height="13" rx="3" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </>
      ),
    },
    {
      label: 'رسانه‌ها',
      value: mediaCount,
      href: '/admin/media',
      icon: kpiIcon(
        <>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
        </>
      ),
    },
  ]

  return (
    <>
      <div className="adm-topbar">
        <div>
          <h1>داشبورد</h1>
          <p className="lead">نمای کلی محتوا و درخواست‌های سایت</p>
        </div>
        <div className="adm-actions">
          <Link className="btn btn-gold btn-sm" href="/admin/articles/new">
            + مقاله جدید
          </Link>
          <Link className="btn btn-ghost btn-sm" href="/admin/portfolio">
            مدیریت نمونه‌کار
          </Link>
          <Link className="btn btn-ghost btn-sm" href="/admin/requests">
            مشاهده درخواست‌ها
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="adm-panel" style={{ textDecoration: 'none' }}>
            <div className="adm-kpi">
              {k.icon}
              <div>
                <b style={{ fontSize: 22, display: 'block', lineHeight: 1.3 }}>{faNumber(k.value)}</b>
                <span className="muted" style={{ fontSize: 12.5 }}>
                  {k.label}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="adm-grid2" style={{ marginTop: 18 }}>
        <section className="adm-panel">
          <div className="adm-panel-head">
            <b>آخرین درخواست‌ها</b>
            <Link className="adm-btn primary" href="/admin/requests">
              همه درخواست‌ها
            </Link>
          </div>

          {latestRequests.length === 0 ? (
            <div className="adm-empty">هنوز درخواستی ثبت نشده است.</div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>نام</th>
                    <th>خدمت</th>
                    <th>تاریخ</th>
                    <th>وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {latestRequests.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td className="muted">{SERVICE_TYPE_LABELS[r.serviceType] ?? r.serviceType}</td>
                      <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                        {jalaliDateTime(r.createdAt)}
                      </td>
                      <td>
                        <StatusChip status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="adm-panel">
          <div className="adm-panel-head">
            <b>آخرین فعالیت‌ها</b>
            <Link className="adm-btn primary" href="/admin/activity">
              گزارش کامل
            </Link>
          </div>

          {latestActivity.length === 0 ? (
            <div className="adm-empty">فعالیتی ثبت نشده است.</div>
          ) : (
            <div>
              {latestActivity.map((a) => (
                <div key={a.id} className="adm-check">
                  <div style={{ minWidth: 0 }}>
                    <b style={{ overflowWrap: 'anywhere' }}>
                      {a.user?.name ?? 'سیستم'}
                      <span className="muted" style={{ fontWeight: 400, fontSize: 12 }} dir="ltr">
                        {' '}
                        · {a.action}
                      </span>
                    </b>
                    {a.details ? (
                      <span style={{ overflowWrap: 'anywhere' }}>: {a.details}</span>
                    ) : null}
                    <span style={{ display: 'block', color: 'var(--faint)', fontSize: 11.5, marginTop: 3 }}>
                      {toFaDigits(jalaliDateTime(a.createdAt))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
