import Image from 'next/image'
import { Copy, Trash2 } from 'lucide-react'
import { db } from '@/lib/db'
import { deleteMediaAction, updateMediaAltAction } from '@/lib/actions/admin-actions'
import { MediaUploader } from '@/components/admin/media-uploader'
import { jalaliDate, faNumber } from '@/lib/fa'

export const dynamic = 'force-dynamic'

export default async function AdminMediaPage() {
  const media = await db.media.findMany({
    orderBy: { createdAt: 'desc' },
    include: { uploadedBy: { select: { name: true } } },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">مدیریت رسانه‌ها</h1>
          <p className="mt-1 text-sm text-slate-500">
            {faNumber(media.length)} فایل — همه تصاویر هنگام آپلود به WebP تبدیل می‌شوند
          </p>
        </div>
        <MediaUploader />
      </div>

      {media.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <p className="mb-1 font-bold text-slate-700">هنوز فایلی آپلود نشده است</p>
          <p className="text-sm text-slate-500">تصاویر شاخص مقالات و نمونه‌کارها را از اینجا یا ویرایشگر مقاله آپلود کنید.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((m) => (
            <div key={m.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-video bg-slate-100">
                <Image src={m.path} alt={m.alt ?? m.originalName} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <p className="truncate text-xs font-bold text-slate-700" title={m.originalName}>
                    {m.originalName}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {m.width?.toLocaleString('fa-IR')}×{m.height?.toLocaleString('fa-IR')} · {faNumber(Math.round(m.size / 1024))} کیلوبایت · {jalaliDate(m.createdAt)}
                  </p>
                </div>
                <form action={updateMediaAltAction} className="flex gap-2">
                  <input type="hidden" name="id" value={m.id} />
                  <input
                    name="alt"
                    defaultValue={m.alt ?? ''}
                    placeholder="متن جایگزین (Alt)"
                    maxLength={300}
                    className="h-9 flex-1 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/10"
                    aria-label={`متن جایگزین ${m.originalName}`}
                  />
                  <button type="submit" className="rounded-lg bg-slate-100 px-3 text-[11px] font-bold text-slate-600 hover:bg-brand/10 hover:text-brand focus-ring">
                    ذخیره
                  </button>
                </form>
                <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                  <code className="flex-1 truncate rounded bg-slate-50 px-2 py-1.5 text-[10px] text-slate-500" dir="ltr">
                    {m.path}
                  </code>
                  <CopyPathButton path={m.path} />
                  <form action={deleteMediaAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-ring"
                      aria-label={`حذف ${m.originalName}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CopyPathButton({ path }: { path: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(path)
        } catch {
          // دسترسی رد شد
        }
      }}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-brand/10 hover:text-brand focus-ring"
      aria-label="کپی آدرس فایل"
      title="کپی آدرس"
    >
      <Copy className="h-3.5 w-3.5" aria-hidden />
    </button>
  )
}
