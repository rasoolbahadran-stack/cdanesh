'use client'

import { useActionState } from 'react'
import { CheckCircle2, Loader2, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { SimpleFormState } from '@/lib/actions/admin-actions'

interface Settings {
  [key: string]: string
}

/**
 * فرم تنظیمات — کلیدها دقیقاً همان کلیدهایی است که سایت می‌خواند
 * (هم‌راستا با SETTING_KEYS در saveSettingsAction و getSiteSettings).
 */
export function SettingsForm({
  action,
  initial,
}: {
  action: (prev: SimpleFormState, fd: FormData) => Promise<SimpleFormState>
  initial: Settings
}) {
  const [state, formAction, pending] = useActionState(action, {})

  const textField = (
    key: string,
    label: string,
    placeholder: string,
    group: string,
    opts?: { dir?: string; textarea?: boolean; hint?: string }
  ) => ({ kind: 'text' as const, key, label, placeholder, group, ...opts })

  const fields = [
    // ── برند ──
    textField('siteName', 'نام سایت', 'کافه‌دانش', 'برند'),
    textField('siteTagline', 'شعار سایت', 'استودیو دیجیتال؛ طراحی سایت، سئو و راهکارهای هوشمند', 'برند'),
    textField('ownerName', 'نام مدیر برند', 'رسول بهادران', 'برند'),
    textField('ownerTitle', 'عنوان شغلی مدیر', 'طراح سایت', 'برند'),
    // ── تماس (فقط اطلاعات واقعی) ──
    textField('phone', 'شماره تماس واقعی', '09165806207', 'تماس', {
      hint: 'فقط شمارهٔ واقعی؛ به‌صورت خودکار لینک tel: می‌شود و در فوتر/تماس/معرفی نمایش داده می‌شود.',
    }),
    textField('website', 'آدرس سایت', 'https://www.cdanesh.ir/', 'تماس', { dir: 'ltr' }),
    textField('email', 'ایمیل (اختیاری)', 'فقط در صورت واقعی‌بودن — خالی = نمایش داده نمی‌شود', 'تماس', { dir: 'ltr' }),
    textField('address', 'آدرس (اختیاری)', 'فقط در صورت واقعی‌بودن — خالی = نمایش داده نمی‌شود', 'تماس'),
    // ── سئو ──
    textField('defaultMetaTitle', 'عنوان متای پیش‌فرض', 'کافه‌دانش | طراحی سایت، سئو و راهکارهای هوشمند', 'سئو'),
    textField('defaultMetaDescription', 'توضیحات متای پیش‌فرض', 'استودیو دیجیتال کافه‌دانش؛ طراحی سایت اختصاصی، سئوی اصولی و راهکارهای هوش مصنوعی…', 'سئو', { textarea: true }),
    textField('ogImage', 'تصویر پیش‌فرض اشتراک‌گذاری (OG)', '/img/og-default.webp', 'سئو', { dir: 'ltr' }),
  ]

  const groups = ['برند', 'تماس', 'سئو', 'قیمت‌گذاری و پرداخت']
  const groupTitles: Record<string, string> = {
    'برند': 'اطلاعات برند',
    'تماس': 'راه‌های ارتباطی',
    'سئو': 'سئوی پیش‌فرض',
    'قیمت‌گذاری و پرداخت': 'قیمت‌گذاری و پرداخت',
  }

  const selectField = (name: string, value: string) => (
    <select
      id={`st-${name}`}
      name={name}
      defaultValue={value}
      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
    >
      {name === 'pricingMode' ? (
        <>
          <option value="estimate">برآوردی — هیچ قیمتی در سایت نمایش داده نمی‌شود (پیش‌فرض امن)</option>
          <option value="final">نهایی — قیمت پکیج‌های منتشرشده نمایش داده می‌شود</option>
        </>
      ) : (
        <>
          <option value="">وصل نشده — تا اتصال درگاه، پرداخت واقعی فعال نیست</option>
          <option value="zarinpal">زرین‌پال</option>
          <option value="idpay">آیدی‌پی</option>
          <option value="zibal">زیبال</option>
          <option value="other">سایر</option>
        </>
      )}
    </select>
  )

  return (
    <form action={formAction} className="space-y-8">
      {groups.map((group) => (
        <fieldset key={group} className="space-y-4">
          <legend className="mb-1 text-sm font-extrabold text-slate-800">{groupTitles[group]}</legend>

          {group === 'قیمت‌گذاری و پرداخت' ? (
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="st-pricingMode">حالت نمایش قیمت</Label>
                {selectField('pricingMode', initial.pricingMode || 'estimate')}
                <p className="text-xs text-slate-500">
                  تا تأیید نهایی تعرفه‌ها، روی «برآوردی» بماند؛ صفحات عمومی به‌جای قیمت، «نیازمند برآورد» نشان می‌دهند.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="st-paymentGateway">درگاه پرداخت</Label>
                {selectField('paymentGateway', initial.paymentGateway || '')}
                <p className="text-xs text-slate-500">
                  کلیدهای درگاه فقط در فایل <span dir="ltr">.env</span> سرور نگهداری می‌شوند و هرگز در کد یا مخزن قرار
                  نمی‌گیرند. تأیید پرداخت همیشه سمت سرور با API رسمی درگاه انجام می‌شود، نه با پارامترهای مرورگر.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {fields
                .filter((f) => f.group === group)
                .map((f) => (
                  <div key={f.key} className={f.textarea ? 'space-y-2 sm:col-span-2' : 'space-y-2'}>
                    <Label htmlFor={`st-${f.key}`}>{f.label}</Label>
                    {f.textarea ? (
                      <Textarea id={`st-${f.key}`} name={f.key} defaultValue={initial[f.key]} rows={2} placeholder={f.placeholder} />
                    ) : (
                      <Input
                        id={`st-${f.key}`}
                        name={f.key}
                        defaultValue={initial[f.key]}
                        placeholder={f.placeholder}
                        dir={f.dir}
                        className={f.dir === 'ltr' ? 'text-left' : ''}
                      />
                    )}
                    {f.hint && <p className="text-xs text-slate-500">{f.hint}</p>}
                  </div>
                ))}
            </div>
          )}
        </fieldset>
      ))}

      {state.ok && (
        <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700" role="status">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          تنظیمات ذخیره شد.
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
        className="brand-gradient inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold text-white shadow-md shadow-brand/25 focus-ring disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
        ذخیره تنظیمات
      </button>
    </form>
  )
}
