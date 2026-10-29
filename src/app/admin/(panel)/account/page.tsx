import { getSessionUser } from '@/lib/auth'
import { ChangePasswordForm } from '@/components/admin/change-password-form'
import { jalaliDateTime, ROLE_LABELS } from '@/lib/fa'

export const dynamic = 'force-dynamic'

export default async function AdminAccountPage() {
  const user = await getSessionUser()
  const dbUser = user ? await (await import('@/lib/db')).db.user.findUnique({ where: { id: user.id } }) : null

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">حساب من</h1>
        <p className="mt-1 text-sm text-slate-500">اطلاعات حساب و تغییر رمز عبور</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-extrabold text-slate-900">اطلاعات حساب</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <dt className="text-xs text-slate-500">نام</dt>
            <dd className="mt-1 font-bold text-slate-800">{user?.name}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <dt className="text-xs text-slate-500">نام کاربری</dt>
            <dd className="mt-1 font-bold text-slate-800" dir="ltr">
              @{user?.username}
            </dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <dt className="text-xs text-slate-500">نقش</dt>
            <dd className="mt-1 font-bold text-slate-800">{user ? ROLE_LABELS[user.role] : '—'}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <dt className="text-xs text-slate-500">آخرین ورود</dt>
            <dd className="mt-1 font-bold text-slate-800">{dbUser?.lastLoginAt ? jalaliDateTime(dbUser.lastLoginAt) : '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="mb-1.5 text-sm font-extrabold text-slate-900">تغییر رمز عبور</h2>
        <p className="mb-6 text-xs leading-6 text-slate-500">
          با تغییر رمز، از همه دستگاه‌های دیگر خارج می‌شوید. رمز جدید حداقل ۸ کاراکتر شامل حرف و رقم باشد.
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  )
}
