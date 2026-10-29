/**
 * زیرساخت درگاه پرداخت زرین‌پال (طبق بند ۹ پرامپت پروژه)
 * ═══════════════════════════════════════════════════════════════
 * • تأیید پرداخت «فقط سمت سرور» و با API رسمی زرین‌پال انجام می‌شود
 *   (v4/payment/request.json و v4/payment/verify.json) — کلاینت هرگز
 *   مبلغ یا وضعیت پرداخت را تأیید نمی‌کند.
 * • مرچنت‌آیدی فقط از متغیر محیطی ZARINPAL_MERCHANT_ID خوانده می‌شود؛
 *   هرگز در کد/ریپو/کلاینت قرار نمی‌گیرد.
 * • این ماژول تا زمانی که مالک سایت مرچنت‌آیدی واقعی ندهد «فعال نمی‌شود»
 *   و هیچ‌جای سایت ادعا نمی‌کند پرداخت واقعی کار می‌کند.
 * • URLهای سندباکس/پرداخت واقعی با ZARINPAL_ENV=sandbox|production
 *   کنترل می‌شود (پیش‌فرض: sandbox).
 */

export type ZarinpalEnv = 'sandbox' | 'production'

const ENDPOINTS: Record<ZarinpalEnv, { request: string; verify: string; startPay: string }> = {
  sandbox: {
    request: 'https://sandbox.zarinpal.com/pg/v4/payment/request.json',
    verify: 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json',
    startPay: 'https://sandbox.zarinpal.com/pg/StartPay/{authority}',
  },
  production: {
    request: 'https://payment.zarinpal.com/pg/v4/payment/request.json',
    verify: 'https://payment.zarinpal.com/pg/v4/payment/verify.json',
    startPay: 'https://payment.zarinpal.com/pg/StartPay/{authority}',
  },
}

export interface PaymentRequestResult {
  ok: boolean
  authority?: string
  redirectUrl?: string
  error?: string
}

export interface PaymentVerifyResult {
  ok: boolean
  verified: boolean
  refId?: string
  error?: string
}

function env(): { merchant: string; mode: ZarinpalEnv } | { error: string } {
  const merchant = process.env.ZARINPAL_MERCHANT_ID?.trim()
  if (!merchant || merchant.length < 32) {
    return { error: 'ZARINPAL_MERCHANT_ID تنظیم نشده است — درگاه در دسترس نیست.' }
  }
  const mode = (process.env.ZARINPAL_ENV === 'production' ? 'production' : 'sandbox') as ZarinpalEnv
  return { merchant, mode }
}

/** مرحله ۱ — ایجاد درخواست پرداخت (سمت سرور) */
export async function requestPayment(amountToman: number, callbackUrl: string, description: string): Promise<PaymentRequestResult> {
  const e = env()
  if ('error' in e) return { ok: false, error: e.error }
  if (!Number.isInteger(amountToman) || amountToman < 10000) {
    return { ok: false, error: 'مبلغ نامعتبر است (حداقل ۱۰٬۰۰۰ تومان).' }
  }
  try {
    const res = await fetch(ENDPOINTS[e.mode].request, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        merchant_id: e.merchant,
        amount: amountToman, // تومان — طبق مستندات زرین‌پال v4
        callback_url: callbackUrl,
        description: description.slice(0, 255),
      }),
      cache: 'no-store',
    })
    const data = (await res.json()) as { data?: { authority?: string; code?: number }; errors?: unknown }
    const authority = data?.data?.authority
    if (res.ok && authority && String(authority).length >= 20) {
      return {
        ok: true,
        authority,
        redirectUrl: ENDPOINTS[e.mode].startPay.replace('{authority}', authority),
      }
    }
    return { ok: false, error: 'ایجاد تراکنش ناموفق بود.' }
  } catch {
    return { ok: false, error: 'ارتباط با درگاه برقرار نشد.' }
  }
}

/** مرحله ۲ — تأیید پرداخت پس از بازگشت کاربر (فقط با API رسمی، سمت سرور) */
export async function verifyPayment(amountToman: number, authority: string): Promise<PaymentVerifyResult> {
  const e = env()
  if ('error' in e) return { ok: false, verified: false, error: e.error }
  if (!/^AUV[A-Za-z0-9]{10,}$/.test(authority)) {
    return { ok: false, verified: false, error: 'شناسه تراکنش نامعتبر است.' }
  }
  try {
    const res = await fetch(ENDPOINTS[e.mode].verify, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        merchant_id: e.merchant,
        amount: amountToman,
        authority,
      }),
      cache: 'no-store',
    })
    const data = (await res.json()) as { data?: { code?: number; ref_id?: number } }
    const code = data?.data?.code
    // کد ۱۰۰ = تأییدشده، ۱۰۱ = قبلاً تأیید شده (قابل قبول برای جلوگیری از تأیید مضاعف)
    if (code === 100 || code === 101) {
      return { ok: true, verified: true, refId: data?.data?.ref_id ? String(data.data.ref_id) : undefined }
    }
    return { ok: false, verified: false, error: 'پرداخت تأیید نشد.' }
  } catch {
    return { ok: false, verified: false, error: 'ارتباط با درگاه برای تأیید برقرار نشد.' }
  }
}

/** آیا درگاه پیکربندی شده است؟ (برای نمایش شرطی در پنل — بدون ادعای فعال‌بودن) */
export function isGatewayConfigured(): boolean {
  const merchant = process.env.ZARINPAL_MERCHANT_ID?.trim()
  return !!merchant && merchant.length >= 32
}
