'use client'

import { useActionState } from 'react'
import { CheckCircle2, Loader2, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { SimpleFormState } from '@/lib/actions/admin-actions'

export interface PackageFormValues {
  id?: string
  serviceType: string
  name: string
  slug: string
  audience: string
  features: string // هر خط یک مورد
  excluded: string
  duration: string
  support: string
  priceToman: string
  priceNote: string
  note: string
  marketBasis: string
  featured: boolean
  isPublished: boolean
}

export const EMPTY_PACKAGE: PackageFormValues = {
  serviceType: 'web-design',
  name: '',
  slug: '',
  audience: '',
  features: '',
  excluded: '',
  duration: '',
  support: '',
  priceToman: '',
  priceNote: '',
  note: '',
  marketBasis: '',
  featured: false,
  isPublished: false,
}

export const SERVICE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'web-design', label: 'طراحی سایت' },
  { value: 'e-commerce', label: 'فروشگاه اینترنتی' },
  { value: 'uiux', label: 'طراحی UI/UX' },
  { value: 'seo', label: 'سئو' },
  { value: 'content-production', label: 'تولید محتوا' },
  { value: 'speed-optimization', label: 'بهینه‌سازی سرعت' },
  { value: 'ai-solutions', label: 'هوش مصنوعی و اتوماسیون' },
  { value: 'support', label: 'پشتیبانی و نگهداری' },
  { value: 'other', label: 'سایر' },
]

export function PackageForm({
  action,
  initial,
  onDoneResetKey,
}: {
  action: (prev: SimpleFormState, fd: FormData) => Promise<SimpleFormState>
  initial: PackageFormValues
  onDoneResetKey?: string | number
}) {
  const [state, formAction, pending] = useActionState(action, {})

  return (
    <form action={formAction} key={onDoneResetKey} className="space-y-4">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pkg-name">نام پکیج *</Label>
          <Input id="pkg-name" name="name" defaultValue={initial.name} required maxLength={80} placeholder="مثلاً پکیج حرفه‌ای" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pkg-type">نوع خدمت *</Label>
          <select
            id="pkg-type"
            name="serviceType"
            defaultValue={initial.serviceType}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {SERVICE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pkg-slug">اسلاگ (برای لینک درخواست)</Label>
          <Input id="pkg-slug" name="slug" defaultValue={initial.slug} dir="ltr" className="text-left" placeholder="design-pro" pattern="[a-z0-9-]*" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pkg-price">قیمت (تومان — خالی = نیازمند برآورد)</Label>
          <Input id="pkg-price" name="priceToman" defaultValue={initial.priceToman} dir="ltr" inputMode="numeric" className="text-left" placeholder="24900000" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pkg-audience">مناسب برای (مخاطب پکیج)</Label>
        <Textarea id="pkg-audience" name="audience" defaultValue={initial.audience} rows={2} maxLength={300} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pkg-features">امکانات (هر خط یک مورد)</Label>
          <Textarea id="pkg-features" name="features" defaultValue={initial.features} rows={5} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pkg-excluded">خارج از پکیج (هر خط یک مورد)</Label>
          <Textarea id="pkg-excluded" name="excluded" defaultValue={initial.excluded} rows={5} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pkg-duration">مدت زمان اجرا</Label>
          <Input id="pkg-duration" name="duration" defaultValue={initial.duration} maxLength={120} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pkg-support">پشتیبانی</Label>
          <Input id="pkg-support" name="support" defaultValue={initial.support} maxLength={120} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pkg-pricenote">زیرنویس قیمت (حالت برآوردی)</Label>
          <Input id="pkg-pricenote" name="priceNote" defaultValue={initial.priceNote} maxLength={200} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pkg-market">مبنای مقایسه بازار (فقط داخلی)</Label>
          <Input id="pkg-market" name="marketBasis" defaultValue={initial.marketBasis} maxLength={300} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pkg-note">یادداشت عمومی پای کارت</Label>
        <Input id="pkg-note" name="note" defaultValue={initial.note} maxLength={300} />
      </div>

      <div className="flex flex-wrap gap-6 pt-1">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="isPublished" defaultChecked={initial.isPublished} className="h-4 w-4 accent-[var(--brand,#2e2455)]" />
          نمایش در سایت
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="featured" defaultChecked={initial.featured} className="h-4 w-4 accent-[var(--brand,#2e2455)]" />
          برچسب «پیشنهاد ما»
        </label>
      </div>

      {state.ok && (
        <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700" role="status">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          پکیج ذخیره شد.
        </p>
      )}
      {state.error && (
        <p className="rounded-lg bg-destructive/5 px-3 py-2.5 text-xs font-semibold text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="brand-gradient inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/25 focus-ring disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
        ذخیره پکیج
      </button>
    </form>
  )
}
