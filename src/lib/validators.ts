// ─── اعتبارسنجی‌های مشترک (کلاینت + سرور، یک منبع واحد) ─────────

/** موبایل ایران: ۱۱ رقم و شروع با 09 — نمونه درست: 09123456789 */
export const IR_PHONE_REGEX = /^09\d{9}$/

export function normalizePhone(raw: string): string {
  // تبدیل ارقام فارسی/عربی به لاتین + حذف جداکننده‌های معمول
  const fa = '۰۱۲۳۴۵۶۷۸۹'
  const ar = '٠١٢٣٤٥٦٧٨٩'
  let s = String(raw || '').trim()
  s = s.replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)))
  s = s.replace(/[٠-٩]/g, (d) => String(ar.indexOf(d)))
  return s.replace(/[\s\-()+.]/g, '')
}

export function validateIranPhone(raw: string): { ok: boolean; value?: string; error?: string } {
  const value = normalizePhone(raw)
  if (!value) return { ok: false, error: 'شماره موبایل لازم است.' }
  if (value.startsWith('98') && value.length === 12) {
    // 98912... → 0912...
    const local = '0' + value.slice(2)
    return IR_PHONE_REGEX.test(local)
      ? { ok: true, value: local }
      : { ok: false, error: 'قالب درست: 09123456789 (۱۱ رقم، شروع با ۰۹).' }
  }
  if (value.startsWith('9') && value.length === 10) {
    const local = '0' + value
    return IR_PHONE_REGEX.test(local)
      ? { ok: true, value: local }
      : { ok: false, error: 'قالب درست: 09123456789 (۱۱ رقم، شروع با ۰۹).' }
  }
  if (!IR_PHONE_REGEX.test(value)) {
    return { ok: false, error: 'شماره موبایل باید ۱۱ رقم باشد و با ۰۹ شروع شود — مانند 09123456789.' }
  }
  return { ok: true, value }
}

export function validateName(raw: string): { ok: boolean; value?: string; error?: string } {
  const value = String(raw || '').trim().replace(/\s+/g, ' ')
  if (!value) return { ok: false, error: 'نام لازم است.' }
  if (value.length < 2) return { ok: false, error: 'نام باید حداقل ۲ نویسه باشد.' }
  if (value.length > 80) return { ok: false, error: 'نام بیش از حد طولانی است.' }
  return { ok: true, value }
}

export function validateMessage(raw: string): { ok: boolean; value?: string; error?: string } {
  const value = String(raw || '').trim()
  if (!value) return { ok: false, error: 'توضیحات لازم است.' }
  if (value.length < 10) return { ok: false, error: 'توضیحات باید حداقل ۱۰ نویسه باشد.' }
  if (value.length > 3000) return { ok: false, error: 'توضیحات حداکثر ۳۰۰۰ نویسه است.' }
  return { ok: true, value }
}

export function validateEmailOptional(raw: string): { ok: boolean; value?: string; error?: string } {
  const value = String(raw || '').trim()
  if (!value) return { ok: true, value: '' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return { ok: false, error: 'قالب ایمیل درست نیست.' }
  return { ok: true, value }
}
