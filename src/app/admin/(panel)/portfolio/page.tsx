import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { db } from '@/lib/db'
import { createPortfolioAction, deletePortfolioAction, updatePortfolioAction } from '@/lib/actions/admin-actions'
import { PortfolioForm } from '@/components/admin/portfolio-form'
import { faNumber } from '@/lib/fa'

export const dynamic = 'force-dynamic'

export default async function AdminPortfolioPage() {
  const items = await db.portfolioItem.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">مدیریت نمونه‌کارها</h1>
        <p className="mt-1 text-sm text-slate-500">
          {faNumber(items.length)} مورد — تصاویر بلند (اسکرین‌شات کامل صفحه) بهترین نمایش را در قاب اسکرول‌شو دارند
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
              <p className="mb-1 font-bold text-slate-700">هنوز نمونه‌کاری ثبت نشده است</p>
              <p className="text-sm text-slate-500">اولین نمونه‌کار را از فرم کنار صفحه اضافه کنید.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <Image src={item.imageUrl} alt={item.title} fill sizes="96px" className="object-cover object-top" />
                  </div>
                  <form action={updatePortfolioAction} className="min-w-0 flex-1 space-y-3">
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="imageUrl" value={item.imageUrl} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input name="title" defaultValue={item.title} maxLength={120} required className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand/50" aria-label="عنوان" />
                      <input name="category" defaultValue={item.category} maxLength={60} required className="h-9 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand/50" aria-label="دسته" />
                    </div>
                    <textarea
                      name="description"
                      defaultValue={item.description}
                      maxLength={600}
                      required
                      rows={2}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand/50"
                      aria-label="توضیح"
                    />
                    <input name="link" defaultValue={item.link ?? ''} placeholder="لینک پروژه (اختیاری)" dir="ltr" className="h-9 w-full rounded-lg border border-slate-200 px-3 text-left text-xs outline-none focus:border-brand/50" aria-label="لینک" />
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                        <input type="checkbox" name="isPublished" defaultChecked={item.isPublished} className="h-4 w-4 rounded accent-[#2563eb]" />
                        منتشر شود
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-500">
                        <input type="checkbox" defaultChecked={item.isConceptual} disabled className="h-4 w-4 rounded accent-[#2563eb] opacity-60" />
                        نمونه مفهومی (نامتغیر)
                      </label>
                      <button type="submit" className="ms-auto rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-brand/10 hover:text-brand focus-ring">
                        ذخیره تغییرات
                      </button>
                    </div>
                  </form>
                  <form action={deletePortfolioAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-ring"
                      aria-label={`حذف ${item.title}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
          <h2 className="mb-4 text-sm font-extrabold text-slate-900">نمونه‌کار جدید</h2>
          <PortfolioForm action={createPortfolioAction} />
        </div>
      </div>
    </div>
  )
}
