// نشان وضعیت مشترک صفحات پنل — از کلاس chip موجود CSS + رنگ‌های متغیرها استفاده می‌کند
import { REQUEST_STATUS_LABELS, STATUS_LABELS } from '@/lib/fa'

type Tone = 'gold' | 'ok' | 'warn' | 'err' | 'muted' | 'faint'

const TONES: Record<Tone, { color: string; bg: string; border: string }> = {
  gold: { color: 'var(--gold)', bg: 'var(--gold-soft)', border: 'rgba(227, 185, 83, .4)' },
  ok: { color: 'var(--ok)', bg: 'rgba(88, 201, 139, .1)', border: 'rgba(88, 201, 139, .4)' },
  warn: { color: 'var(--warn)', bg: 'rgba(232, 194, 104, .1)', border: 'rgba(232, 194, 104, .4)' },
  err: { color: 'var(--err)', bg: 'rgba(229, 118, 106, .1)', border: 'rgba(229, 118, 106, .4)' },
  muted: { color: 'var(--mut)', bg: 'rgba(255, 255, 255, .05)', border: 'var(--line-2)' },
  faint: { color: 'var(--faint)', bg: 'rgba(255, 255, 255, .03)', border: 'var(--line)' },
}

const TONE_BY_STATUS: Record<string, Tone> = {
  PUBLISHED: 'ok',
  DRAFT: 'muted',
  SCHEDULED: 'warn',
  NEW: 'gold',
  IN_REVIEW: 'warn',
  WAITING_REPLY: 'muted',
  ACCEPTED: 'ok',
  CLOSED: 'faint',
}

export function StatusChip({ status, label }: { status: string; label?: string }) {
  const tone = TONES[TONE_BY_STATUS[status] ?? 'muted']
  const text = label ?? STATUS_LABELS[status] ?? REQUEST_STATUS_LABELS[status] ?? status
  return (
    <span
      className="chip"
      style={{
        color: tone.color,
        background: tone.bg,
        borderColor: tone.border,
        fontSize: 11.5,
        padding: '3px 11px',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  )
}
