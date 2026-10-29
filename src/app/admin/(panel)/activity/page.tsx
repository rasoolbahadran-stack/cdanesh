import { ShieldCheck } from 'lucide-react'
import { db } from '@/lib/db'
import { jalaliDateTime, toFaDigits } from '@/lib/fa'

export const dynamic = 'force-dynamic'

const ACTION_LABELS: Record<string, string> = {
  'auth.login': 'ورود به پنل',
  'auth.logout': 'خروج از پنل',
  'auth.password_change': 'تغییر رمز عبور',
  'article.create': 'ایجاد مقاله',
  'article.update': 'ویرایش مقاله',
  'article.autosave': 'ذخیره خودکار',
  'article.status': 'تغییر وضعیت مقاله',
  'article.delete': 'حذف مقاله',
  'article.revert': 'بازگردانی نسخه',
  'ai.article.generate': 'تولید مقاله با AI',
  'category.create': 'ایجاد دسته',
  'category.update': 'ویرایش دسته',
  'category.delete': 'حذف دسته',
  'tag.delete': 'حذف برچسب',
  'media.upload': 'آپلود رسانه',
  'media.update_alt': 'ویرایش متن جایگزین',
  'media.delete': 'حذف رسانه',
  'portfolio.create': 'ایجاد نمونه‌کار',
  'portfolio.update': 'ویرایش نمونه‌کار',
  'portfolio.delete': 'حذف نمونه‌کار',
  'request.update': 'به‌روزرسانی درخواست',
  'request.delete': 'حذف درخواست',
  'user.create': 'ایجاد کاربر',
  'user.update': 'ویرایش کاربر',
  'user.reset_password': 'بازنشانی رمز کاربر',
  'settings.update': 'ذخیره تنظیمات',
}

const ACTION_STYLES: Record<string, string> = {
  delete: 'text-red-600 bg-red-50',
  create: 'text-emerald-600 bg-emerald-50',
  login: 'text-brand bg-brand/8',
  logout: 'text-slate-600 bg-slate-100',
}

function styleFor(action: string): string {
  if (action.includes('delete')) return ACTION_STYLES.delete
  if (action.includes('create')) return ACTION_STYLES.create
  if (action.startsWith('auth.')) return ACTION_STYLES[action]
  return 'bg-slate-100 text-slate-600'
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const perPage = 30

  const [logs, total] = await Promise.all([
    db.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { user: { select: { name: true } } },
    }),
    db.activityLog.count(),
  ])

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">گزارش فعالیت‌ها</h1>
        <p className="mt-1 text-sm text-slate-500">
          {toFaDigits(total)} رویداد ثبت‌شده — شامل ورود، تغییر محتوا و عملیات مدیریتی
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {logs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden />
            <p className="text-sm text-slate-500">هنوز فعالیتی ثبت نشده است.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <th className="px-5 py-3.5 text-start font-bold">رویداد</th>
                  <th className="px-4 py-3.5 text-start font-bold">کاربر</th>
                  <th className="px-4 py-3.5 text-start font-bold">جزئیات</th>
                  <th className="px-4 py-3.5 text-start font-bold">زمان</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${styleFor(log.action)}`}>
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-slate-700">
                      {log.user?.name ?? 'سیستم'}
                    </td>
                    <td className="max-w-[280px] px-4 py-3.5">
                      <p className="truncate text-xs text-slate-600" title={log.details ?? undefined}>
                        {log.details ?? '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400">{jalaliDateTime(log.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label="صفحه‌بندی" className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/admin/activity${p > 1 ? `?page=${p}` : ''}`}
              aria-current={p === page ? 'page' : undefined}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold focus-ring ${
                p === page ? 'brand-gradient text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-brand/40'
              }`}
            >
              {toFaDigits(p)}
            </a>
          ))}
        </nav>
      )}
    </div>
  )
}
