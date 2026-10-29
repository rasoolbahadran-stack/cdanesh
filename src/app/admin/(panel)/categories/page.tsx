import { Trash2 } from 'lucide-react'
import { db } from '@/lib/db'
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  deleteTagAction,
  type SimpleFormState,
} from '@/lib/actions/admin-actions'
import { CategoryForm } from '@/components/admin/category-form'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  const [categories, tags] = await Promise.all([
    db.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { articles: true } } },
    }),
    db.tag.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { articles: true } } },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">دسته‌بندی‌ها و برچسب‌ها</h1>
        <p className="mt-1 text-sm text-slate-500">
          سازمان‌دهی مقالات برای کاربران و موتورهای جست‌وجو
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* فهرست دسته‌ها */}
        <div className="space-y-5">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-extrabold text-slate-900">دسته‌بندی‌ها ({categories.length.toLocaleString('fa-IR')})</h2>
            </div>
            {categories.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-slate-400">هنوز دسته‌بندی‌ای ساخته نشده است.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {categories.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                    <form action={updateCategoryAction} className="flex flex-1 flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={c.id} />
                      <input
                        name="name"
                        defaultValue={c.name}
                        maxLength={60}
                        required
                        className="h-9 flex-1 min-w-36 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10"
                        aria-label={`نام دسته ${c.name}`}
                      />
                      <span className="text-xs text-slate-400" dir="ltr">
                        /blog?cat={c.slug}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                        {c._count.articles.toLocaleString('fa-IR')} مقاله
                      </span>
                      <button type="submit" className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600 transition-colors hover:bg-brand/10 hover:text-brand focus-ring">
                        ذخیره
                      </button>
                    </form>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-ring"
                        aria-label={`حذف دسته ${c.name}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* برچسب‌ها */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-extrabold text-slate-900">برچسب‌ها ({tags.length.toLocaleString('fa-IR')})</h2>
              <p className="mt-1 text-xs text-slate-400">برچسب‌ها هنگام ویرایش مقاله ساخته می‌شوند؛ اینجا قابل حذف‌اند.</p>
            </div>
            {tags.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">برچسبی وجود ندارد.</p>
            ) : (
              <div className="flex flex-wrap gap-2 p-5">
                {tags.map((t) => (
                  <form key={t.id} action={deleteTagAction} className="flex items-center gap-1 rounded-full border border-slate-200 bg-white py-1 ps-3 pe-1">
                    <input type="hidden" name="id" value={t.id} />
                    <span className="text-xs font-semibold text-slate-600">
                      {t.name}
                      <span className="ms-1.5 text-slate-400">{t._count.articles.toLocaleString('fa-IR')}</span>
                    </span>
                    <button
                      type="submit"
                      className="flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 focus-ring"
                      aria-label={`حذف برچسب ${t.name}`}
                    >
                      <Trash2 className="h-3 w-3" aria-hidden />
                    </button>
                  </form>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* فرم دسته جدید */}
        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
          <h2 className="mb-4 text-sm font-extrabold text-slate-900">دسته‌بندی جدید</h2>
          <CategoryForm action={createCategoryAction as unknown as (prev: SimpleFormState, fd: FormData) => Promise<SimpleFormState>} />
        </div>
      </div>
    </div>
  )
}
