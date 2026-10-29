'use client'

import { useActionState } from 'react'
import { CheckCircle2, KeyRound, Loader2, TriangleAlert } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePasswordAction, type ChangePasswordState } from '@/lib/actions/auth-actions'

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, {} as ChangePasswordState)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pw-current">رمز عبور فعلی</Label>
        <Input id="pw-current" name="current" type="password" required autoComplete="current-password" dir="ltr" className="text-right" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pw-next">رمز عبور جدید</Label>
          <Input id="pw-next" name="next" type="password" required minLength={8} autoComplete="new-password" dir="ltr" className="text-right" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pw-confirm">تکرار رمز جدید</Label>
          <Input id="pw-confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" dir="ltr" className="text-right" />
        </div>
      </div>

      {state.ok && (
        <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700" role="status">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          رمز عبور با موفقیت تغییر کرد.
        </p>
      )}
      {state.error && (
        <p className="flex items-center gap-1.5 rounded-lg bg-destructive/5 px-3 py-2.5 text-xs font-semibold text-destructive" role="alert">
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="brand-gradient inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-bold text-white shadow-md shadow-brand/25 focus-ring disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <KeyRound className="h-4 w-4" aria-hidden />}
        تغییر رمز
      </button>
    </form>
  )
}
