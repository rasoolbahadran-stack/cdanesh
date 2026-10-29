// ─── ابزارهای فارسی: رقم فارسی، تاریخ جلالی، زمان مطالعه ────────

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toFaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)])
}

export function faNumber(n: number): string {
  return toFaDigits(n.toLocaleString('en-US'))
}

const jFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const jFormatterShort = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function jalaliDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return '—'
  return jFormatter.format(d)
}

export function jalaliDateShort(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return '—'
  return jFormatterShort.format(d)
}

export function jalaliDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return '—'
  const time = new Intl.DateTimeFormat('fa-IR-u-nu-arabext', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
  return `${jFormatter.format(d)}، ساعت ${time}`
}

export function estimateReadTime(markdown: string): number {
  const words = markdown
    .replace(/[#*_>`~\[\]()\-!]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.trim().length > 1).length
  return Math.max(1, Math.round(words / 200))
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s\u200c]+/g, '-') // فاصله و نیم‌فاصله
    .replace(/[؟?!,،؛:.'"()«»\[\]{}]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120)
}

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'پیش‌نویس',
  SCHEDULED: 'زمان‌بندی‌شده',
  PUBLISHED: 'منتشرشده',
}

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  NEW: 'جدید',
  IN_REVIEW: 'در حال بررسی',
  WAITING_REPLY: 'در انتظار پاسخ',
  ACCEPTED: 'پذیرفته‌شده',
  CLOSED: 'بسته‌شده',
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'مدیر کل',
  EDITOR: 'مدیر محتوا',
  AUTHOR: 'نویسنده',
}
