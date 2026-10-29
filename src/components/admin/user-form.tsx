'use client'

import { useActionState } from 'react'
import { CheckCircle2, Loader2, UserPlus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SimpleFormState } from '@/lib/actions/admin-actions'

export function UserForm({
  action,
}: {
  action: (prev: SimpleFormState, fd: FormData) => Promise<SimpleFormState>
}) {
  const [state, formAction, pending] = useActionState(action, {})

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="u-name">نام و نام خانوادگی *</Label>
        <Input id="u-name" name="name" required maxLength={80} placeholder="مثلاً: علی رضایی" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="u-username">نام کاربری *</Label>
        <Input id="u-username" name="username" required maxLength={60} dir="ltr" className="text-left" placeholder="ali.rezaei" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="u-email">ایمیل (اختیاری)</Label>
        <Input id="u-email" name="email" type="email" dir="ltr" className="text-left" placeholder="ali@example.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="u-role">نقش *</Label>
        <Select name="role" defaultValue="AUTHOR">
          <SelectTrigger id="u-role" className="w-full focus-ring">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">مدیر کل</SelectItem>
            <SelectItem value="EDITOR">مدیر محتوا</SelectItem>
            <SelectItem value="AUTHOR">نویسنده</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="u-password">رمز عبور *</Label>
        <Input
          id="u-password"
          name="password"
          type="password"
          required
          minLength={8}
          dir="ltr"
          className="text-left"
          placeholder="حداقل ۸ کاراکتر شامل حرف و رقم"
        />
      </div>

      {state.ok && (
        <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700" role="status">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          کاربر ساخته شد.
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
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <UserPlus className="h-4 w-4" aria-hidden />}
        افزودن کاربر
      </button>
    </form>
  )
}
