'use client'

import { useActionState } from 'react'
import { CheckCircle2, Loader2, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { SimpleFormState } from '@/lib/actions/admin-actions'

export function PortfolioForm({
  action,
}: {
  action: (prev: SimpleFormState, fd: FormData) => Promise<SimpleFormState>
}) {
  const [state, formAction, pending] = useActionState(action, {})

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pf-title">عنوان پروژه *</Label>
        <Input id="pf-title" name="title" required maxLength={120} placeholder="مثلاً: فروشگاه اینترنتی نمونه" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pf-category">دسته‌بندی *</Label>
        <Input id="pf-category" name="category" required maxLength={60} placeholder="مثلاً: فروشگاهی" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pf-image">آدرس تصویر *</Label>
        <Input
          id="pf-image"
          name="imageUrl"
          required
          dir="ltr"
          className="text-left font-mono text-xs"
          placeholder="/uploads/2026/01/xxxx.webp"
        />
        <p className="text-[11px] leading-5 text-slate-400">
          ابتدا تصویر را از بخش «رسانه‌ها» آپلود کنید، سپس آدرس آن را اینجا وارد کنید.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="pf-desc">توضیح *</Label>
        <Textarea id="pf-desc" name="description" required rows={3} maxLength={600} placeholder="توضیح کوتاه پروژه برای نمایش عمومی" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pf-link">لینک مشاهده (اختیاری)</Label>
        <Input id="pf-link" name="link" dir="ltr" className="text-left text-xs" placeholder="https://example.com" />
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
        <input type="checkbox" name="isPublished" defaultChecked className="h-4 w-4 rounded accent-[#2563eb]" />
        بلافاصله منتشر شود
      </label>

      {state.ok && (
        <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700" role="status">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          نمونه‌کار اضافه شد.
        </p>
      )}
      {state.error && (
        <p className="rounded-lg bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="brand-gradient inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/25 focus-ring disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
        افزودن نمونه‌کار
      </button>
    </form>
  )
}
