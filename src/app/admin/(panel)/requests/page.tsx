import { Inbox, Trash2 } from 'lucide-react'
import { db } from '@/lib/db'
import { deleteRequestAction, updateRequestAction } from '@/lib/actions/admin-actions'
import { RequestStatusSelect } from '@/components/admin/request-status-select'
import { faNumber, jalaliDateTime, REQUEST_STATUS_LABELS, toFaDigits } from '@/lib/fa'

export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-amber-50 text-amber-700 ring-amber-200',
  IN_REVIEW: 'bg-blue-50 text-blue-700 ring-blue-200',
  IN_PROGRESS: 'bg-violet-50 text-violet-700 ring-violet-200',
  DONE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  REJECTED: 'bg-slate-100 text-slate-500 ring-slate-200',
}

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const { status, page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const perPage = 12

  const where = {
    ...(status && ['NEW', 'IN_REVIEW', 'WAITING_REPLY', 'ACCEPTED', 'CLOSED'].includes(status)
      ? { status: status as 'NEW' | 'IN_REVIEW' | 'WAITING_REPLY' | 'ACCEPTED' | 'CLOSED' }
      : {}),
  }

  const [requests, total, counts] = await Promise.all([
    db.serviceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    db.serviceRequest.count({ where }),
    db.serviceRequest.groupBy({ by: ['status'], _count: { status: true } }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count.status ?? 0

  const filters = [
    { key: '', label: 'همه', count: counts.reduce((a, c) => a + c._count.status, 0) },
    { key: 'NEW', label: 'جدید', count: countOf('NEW') },
    { key: 'IN_REVIEW', label: 'در حال بررسی', count: countOf('IN_REVIEW') },
    { key: 'IN_PROGRESS', label: 'در حال انجام', count: countOf('IN_PROGRESS') },
    { key: 'DONE', label: 'انجام شد', count: countOf('DONE') },
    { key: 'REJECTED', label: 'رد شد', count: countOf('REJECTED') },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">درخواست‌های مشتریان</h1>
        <p className="mt-1 text-sm text-slate-500">{faNumber(total)} درخواست — پیگیری و تغییر وضعیت</p>
      </div>

      {/* فیلترها */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const params = new URLSearchParams()
          if (f.key) params.set('status', f.key)
          const active = (status ?? '') === f.key
          return (
            <a
              key={f.key}
              href={`/admin/requests${params.toString() ? `?${params}` : ''}`}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors focus-ring ${
                active ? 'brand-gradient border-transparent text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-brand/30 hover:text-brand'
              }`}
            >
              {f.label}
              <span className={`ms-1.5 rounded-full px-1.5 text-[10px] ${active ? 'bg-white/25' : 'bg-slate-100'}`}>
                {toFaDigits(f.count)}
              </span>
            </a>
          )
        })}
      </div>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <Inbox className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden />
          <p className="mb-1 font-bold text-slate-700">درخواستی یافت نشد</p>
          <p className="text-sm text-slate-500">درخواست‌های ثبت‌شده از فرم سایت اینجا نمایش داده می‌شوند.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-extrabold text-slate-900">{r.name}</h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${STATUS_STYLES[r.status]}`}>
                      {REQUEST_STATUS_LABELS[r.status]}
                    </span>
                  </div>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span dir="ltr">{r.phone}</span>
                    {r.email && <span dir="ltr">{r.email}</span>}
                    <span>{r.serviceType}</span>
                    <span>{jalaliDateTime(r.createdAt)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <RequestStatusSelect id={r.id} current={r.status} />
                  <form action={deleteRequestAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-ring"
                      aria-label={`حذف درخواست ${r.name}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </form>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-slate-50 p-4">
                {r.subject && <p className="mb-1.5 text-xs font-bold text-slate-700">{r.subject}</p>}
                <p className="text-sm leading-7 text-slate-600">{r.message}</p>
              </div>

              <form action={updateRequestAction} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="status" value={r.status} />
                <input
                  name="adminNote"
                  defaultValue={r.adminNote ?? ''}
                  placeholder="یادداشت داخلی (فقط برای تیم قابل مشاهده است)"
                  maxLength={1000}
                  className="h-9 flex-1 min-w-56 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10"
                  aria-label={`یادداشت داخلی برای ${r.name}`}
                />
                <button type="submit" className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-brand/10 hover:text-brand focus-ring">
                  ذخیره یادداشت
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="صفحه‌بندی" className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams()
            if (status) params.set('status', status)
            if (p > 1) params.set('page', String(p))
            return (
              <a
                key={p}
                href={`/admin/requests${params.toString() ? `?${params}` : ''}`}
                aria-current={p === page ? 'page' : undefined}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold focus-ring ${
                  p === page ? 'brand-gradient text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-brand/40'
                }`}
              >
                {toFaDigits(p)}
              </a>
            )
          })}
        </nav>
      )}
    </div>
  )
}
