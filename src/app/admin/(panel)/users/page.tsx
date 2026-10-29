import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { createUserAction, resetUserPasswordAction, updateUserAction } from '@/lib/actions/admin-actions'
import { UserForm } from '@/components/admin/user-form'
import { jalaliDateTime, ROLE_LABELS, toFaDigits } from '@/lib/fa'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const me = await getSessionUser()
  const users = await db.user.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { articles: true } } },
  })

  const ROLE_STYLE: Record<string, string> = {
    ADMIN: 'bg-brand/8 text-brand',
    EDITOR: 'bg-violet-50 text-violet-700',
    AUTHOR: 'bg-slate-100 text-slate-600',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">کاربران و نقش‌ها</h1>
        <p className="mt-1 text-sm text-slate-500">
          {toFaDigits(users.length)} کاربر — مدیر کل: دسترسی کامل، مدیر محتوا: مدیریت محتوا، نویسنده: نگارش مقاله
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-100">
            {users.map((u) => (
              <li key={u.id} className="space-y-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-extrabold text-brand">
                    {u.name.slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-slate-900">
                      {u.name}
                      {u.id === me?.id && <span className="ms-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">شما</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400" dir="ltr">
                      @{u.username} {u.email ? `· ${u.email}` : ''}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${ROLE_STYLE[u.role]}`}>
                    {ROLE_LABELS[u.role]}
                  </span>
                  {!u.isActive && (
                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">غیرفعال</span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400">
                  {toFaDigits(u._count.articles)} مقاله · آخرین ورود: {u.lastLoginAt ? jalaliDateTime(u.lastLoginAt) : '—'}
                </p>

                {me && (u.id !== me.id || u.role === 'ADMIN') && (
                  <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
                    <form action={updateUserAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        aria-label={`نقش ${u.name}`}
                        className="h-8 rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-brand/50"
                      >
                        <option value="ADMIN">مدیر کل</option>
                        <option value="EDITOR">مدیر محتوا</option>
                        <option value="AUTHOR">نویسنده</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        <input type="checkbox" name="isActive" defaultChecked={u.isActive} className="h-3.5 w-3.5 rounded accent-[#2563eb]" />
                        فعال
                      </label>
                      <button type="submit" className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-brand/10 hover:text-brand focus-ring">
                        ذخیره
                      </button>
                    </form>

                    <form action={resetUserPasswordAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <input
                        type="password"
                        name="password"
                        placeholder="رمز جدید (حداقل ۸ کاراکتر، حرف + رقم)"
                        minLength={8}
                        className="h-8 w-56 rounded-lg border border-slate-200 px-2.5 text-xs outline-none focus:border-brand/50"
                        aria-label={`رمز جدید برای ${u.name}`}
                      />
                      <button type="submit" className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-amber-50 hover:text-amber-700 focus-ring">
                        بازنشانی رمز
                      </button>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
          <h2 className="mb-4 text-sm font-extrabold text-slate-900">کاربر جدید</h2>
          <UserForm action={createUserAction} />
        </div>
      </div>
    </div>
  )
}
