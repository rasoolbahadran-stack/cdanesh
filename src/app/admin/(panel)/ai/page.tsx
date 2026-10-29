import { Bot, CheckCircle2, Info } from 'lucide-react'
import { db } from '@/lib/db'
import { AI_TOOLS } from '@/lib/ai'
import { faNumber, jalaliDateTime } from '@/lib/fa'

export const dynamic = 'force-dynamic'

export default async function AdminAiPage() {
  const [aiLogs, publicToolCalls] = await Promise.all([
    db.activityLog.count({ where: { action: 'ai.article.generate' } }),
    db.activityLog.count({ where: { action: 'ai.article.generate' } }),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">هوش مصنوعی</h1>
        <p className="mt-1 text-sm text-slate-500">وضعیت اتصال، ابزارها و مصرف سرویس</p>
      </div>

      {/* وضعیت */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-emerald-900">
            <CheckCircle2 className="h-4.5 w-4.5" aria-hidden />
            سرویس فعال است
          </h2>
          <p className="mt-2 text-xs leading-6 text-emerald-700">
            اتصال مدل از طریق لایه سرور برقرار است. کلید API فقط در سمت سرور نگهداری می‌شود و
            هرگز به مرورگر ارسال نمی‌گردد.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-slate-900">آمار استفاده</h2>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
            <li>تولید مقاله در پنل: {faNumber(aiLogs)} بار</li>
            <li>ابزارهای عمومی سایت: ۸ ابزار فعال</li>
          </ul>
        </div>
      </div>

      {/* ابزارها */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-extrabold text-slate-900">ابزارهای فعال</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {AI_TOOLS.map((tool) => (
            <li key={tool.id} className="px-6 py-4">
              <p className="text-sm font-bold text-slate-800">{tool.title}</p>
              <p className="mt-0.5 text-xs leading-6 text-slate-500">{tool.description}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* راهنما */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-amber-900">
          <Info className="h-4 w-4" aria-hidden />
          نکات مهم مدیریت
        </h2>
        <ul className="list-disc space-y-2 ps-5 text-xs leading-6 text-amber-800">
          <li>محتوای تولیدشده توسط هوش مصنوعی همیشه پیش از انتشار باید توسط نویسنده بازبینی و تأیید شود.</li>
          <li>برای تغییر ارائه‌دهنده مدل، فایل <code className="rounded bg-amber-100 px-1">src/lib/ai.ts</code> را ویرایش کنید؛ بقیه سیستم تغییری نمی‌کند.</li>
          <li>محدودیت نرخ: هر ابزار عمومی حداکثر ۱۰ درخواست در ۱۰ دقیقه برای هر IP و تولید مقاله ۶ بار در ۱۰ دقیقه برای هر کاربر.</li>
          <li>گزارش کامل فعالیت‌های AI در بخش «گزارش فعالیت» قابل مشاهده است.</li>
        </ul>
      </div>
    </div>
  )
}
