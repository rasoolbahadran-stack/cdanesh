'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateRequestAction } from '@/lib/actions/admin-actions'
import { REQUEST_STATUS_LABELS } from '@/lib/fa'

export function RequestStatusSelect({ id, current }: { id: string; current: string }) {
  const router = useRouter()
  const [value, setValue] = useState(current)
  const [pending, startTransition] = useTransition()

  function onChange(next: string) {
    setValue(next)
    const fd = new FormData()
    fd.set('id', id)
    fd.set('status', next)
    startTransition(async () => {
      await updateRequestAction(fd)
      router.refresh()
    })
  }

  return (
    <div className="relative">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-36 focus-ring" aria-label="تغییر وضعیت درخواست">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <SelectValue />}
        </SelectTrigger>
        <SelectContent>
          {Object.entries(REQUEST_STATUS_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
