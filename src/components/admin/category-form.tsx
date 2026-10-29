'use client'

import { useActionState } from 'react'
import { CheckCircle2, Loader2, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { SimpleFormState } from '@/lib/actions/admin-actions'

export function CategoryForm({
  action,
}: {
  action: (prev: SimpleFormState, fd: FormData) => Promise<SimpleFormState>
}) {
  const [state, formAction, pending] = useActionState(action, {})

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cat-name">نام دسته *</Label>
        <Input id="cat-name" name="name" required maxLength={60} placeholder="مثلاً: سئو" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cat-desc">توضیح (اختیاری)</Label>
        <Textarea id="cat-desc" name="description" rows={2} maxLength={300} placeholder="توضیح کوتاه برای صفحه دسته" />
      </div>

      {state.ok && (
        <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700" role="status">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          دسته‌بندی ساخته شد.
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
        افزودن دسته
      </button>
    </form>
  )
}
