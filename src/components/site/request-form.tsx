'use client'

import { useState, type FormEvent } from 'react'
import {
  validateIranPhone,
  validateName,
  validateMessage,
  validateEmailOptional,
} from '@/lib/validators'
import { SERVICE_TYPE_LABELS, BUDGET_RANGES } from '@/lib/site'

interface Props {
  /** خدمت پیش‌فرض (مثلاً در صفحه سئو: seo) */
  defaultService?: string
  /** متن دکمه */
  submitLabel?: string
  compact?: boolean
}

type Errors = Partial<Record<'name' | 'phone' | 'email' | 'message' | 'form', string>>

/**
 * فرم درخواست خدمات — اعتبارسنجی موبایل ایران (۰۹۱۲۳۴۵۶۷۸۹) در دو لایه
 * کلاینت و سرور؛ در خطا مقادیر پاک نمی‌شوند و خطاها درون‌خطی فارسی‌اند.
 */
export default function RequestForm({ defaultService = 'web-design', submitLabel = 'ارسال درخواست', compact = false }: Props) {
  const [values, setValues] = useState({
    name: '',
    phone: '',
    email: '',
    serviceType: defaultService in SERVICE_TYPE_LABELS ? defaultService : 'other',
    budget: '',
    message: '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  const set = (k: keyof typeof values, v: string) => {
    setValues((s) => ({ ...s, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined, form: undefined }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (sending) return // جلوگیری از ارسال تکراری

    const next: Errors = {}
    const n = validateName(values.name)
    if (!n.ok) next.name = n.error
    const p = validateIranPhone(values.phone)
    if (!p.ok) next.phone = p.error
    const em = validateEmailOptional(values.email)
    if (!em.ok) next.email = em.error
    const m = validateMessage(values.message)
    if (!m.ok) next.message = m.error

    if (Object.keys(next).length) {
      setErrors(next)
      return
    }

    setSending(true)
    setErrors({})
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: n.value,
          phone: p.value,
          email: em.value || undefined,
          serviceType: values.serviceType,
          budget: values.budget || undefined,
          message: m.value,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        setDone(true)
      } else {
        // خطاهای سمت سرور
        const serverErrors: Errors = {}
        if (data?.errors) {
          for (const k of ['name', 'phone', 'email', 'message'] as const) {
            if (data.errors[k]) serverErrors[k] = data.errors[k]
          }
        }
        setErrors({ ...serverErrors, form: data?.error || 'ارسال ناموفق بود؛ دوباره تلاش کنید.' })
      }
    } catch {
      setErrors({ form: 'ارتباط برقرار نشد؛ اتصال اینترنت را بررسی کنید.' })
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div className="form-ok" role="status" style={{ display: 'flex' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 13 4 4L19 7" /></svg>
        <div>
          <b>درخواست شما ثبت شد.</b>
          <p style={{ marginTop: 6 }}>
            برای پیگیری سریع‌تر می‌توانید مستقیم تماس بگیرید. معمولاً در اولین فرصت پاسخ می‌دهیم.
          </p>
        </div>
      </div>
    )
  }

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <span className="form-err" role="alert">
        {errors[k]}
      </span>
    ) : null

  return (
    <form onSubmit={onSubmit} noValidate className={compact ? 'request-form compact' : 'request-form'}>
      {errors.form && (
        <div className="form-err" role="alert" style={{ marginBottom: 14, display: 'block' }}>
          {errors.form}
        </div>
      )}

      <div className="field-row">
        <div className="field">
          <label htmlFor="rf-name">
            نام و نام خانوادگی <i>*</i>
          </label>
          <input
            id="rf-name"
            className="control"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="مثلاً علی رضایی"
            autoComplete="name"
            aria-invalid={!!errors.name}
          />
          {err('name')}
        </div>
        <div className="field">
          <label htmlFor="rf-phone">
            شماره موبایل <i>*</i>
          </label>
          <input
            id="rf-phone"
            className="control"
            dir="ltr"
            inputMode="tel"
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="09123456789"
            autoComplete="tel"
            aria-invalid={!!errors.phone}
          />
          {err('phone')}
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="rf-service">خدمت موردنیاز</label>
          <select id="rf-service" className="control" value={values.serviceType} onChange={(e) => set('serviceType', e.target.value)}>
            {Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="rf-budget">بودجه تقریبی (اختیاری)</label>
          <select id="rf-budget" className="control" value={values.budget} onChange={(e) => set('budget', e.target.value)}>
            <option value="">انتخاب کنید (اختیاری)</option>
            {BUDGET_RANGES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="rf-email">ایمیل (اختیاری)</label>
        <input
          id="rf-email"
          className="control"
          dir="ltr"
          type="email"
          value={values.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          aria-invalid={!!errors.email}
        />
        {err('email')}
      </div>

      <div className="field">
        <label htmlFor="rf-msg">
          توضیحات پروژه <i>*</i>
        </label>
        <textarea
          id="rf-msg"
          className="control"
          rows={compact ? 4 : 6}
          value={values.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="کسب‌وکار شما چه می‌کند و از سایت چه انتظاری دارید؟"
          aria-invalid={!!errors.message}
        />
        {err('message')}
      </div>

      <button className="btn btn-gold btn-lg btn-block" type="submit" disabled={sending} aria-busy={sending}>
        {sending ? 'در حال ارسال…' : submitLabel}
        {!sending && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7" /></svg>
        )}
      </button>
      <p className="form-note">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
        <span>اطلاعات شما فقط برای تماس درباره همین درخواست استفاده می‌شود.</span>
      </p>
    </form>
  )
}
