'use client'

import { useActionState } from 'react'
import { CheckCircle2, Loader2, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SimpleFormState } from '@/lib/actions/admin-actions'

export function RedirectForm({
  action,
}: {
  action: (prev: SimpleFormState, fd: FormData) => Promise<SimpleFormState>
}) {
  const [state, formAction, pending] = useActionState(action, {})

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_110px_auto] sm:items-end">
      <div className="space-y-1.5">
        <Label htmlFor="rd-from">مسیر قدیمی *</Label>
        <Input id="rd-from" name="fromPath" dir="ltr" className="text-left" placeholder="/old-page" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rd-to">مقصد جدید *</Label>
        <Input id="rd-to" name="toPath" dir="ltr" className="text-left" placeholder="/new-page" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rd-code">کد</Label>
        <select
          id="rd-code"
          name="statusCode"
          defaultValue="301"
          className="flex h-10 w-full rounded-lg border border-input bg-background px-2 py-2 text-sm"
        >
          <option value="301">301</option>
          <option value="302">302</option>
          <option value="307">307</option>
          <option value="308">308</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="brand-gradient inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white shadow-md shadow-brand/25 focus-ring disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
        افزودن
      </button>

      {state.ok && (
        <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 sm:col-span-4" role="status">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          ریدایرکت ثبت شد (حداکثر تا یک دقیقه بعد روی سایت فعال می‌شود).
        </p>
      )}
      {state.error && (
        <p className="rounded-lg bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive sm:col-span-4" role="alert">
          {state.error}
        </p>
      )}
    </form>
  )
}
