import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/auth'
import { REQUEST_SERVICE_TYPES } from '@/lib/site'

export const runtime = 'nodejs'

const LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000 // ساعتی ۵ درخواست

const phoneSchema = z
  .string()
  .trim()
  .transform((val) => {
    // تبدیل ارقام فارسی/عربی به لاتین و حذف جداکننده‌ها
    let s = val.replace(/[\s-()]/g, '')
    s = s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    s = s.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    if (s.startsWith('+98')) s = '0' + s.slice(3)
    else if (s.startsWith('0098')) s = '0' + s.slice(4)
    else if (s.startsWith('98') && s.length >= 11) s = '0' + s.slice(2)
    return s
  })
  .refine((val) => /^09\d{9}$/.test(val) || /^0\d{10}$/.test(val), {
    message: 'شماره تماس معتبر وارد کنید (مثلاً ۰۹۱۲۳۴۵۶۷۸۹).',
  })

const requestSchema = z.object({
  name: z.string().trim().min(2, 'نام باید حداقل ۲ حرف باشد.').max(80),
  phone: phoneSchema,
  email: z
    .union([z.string().trim().email('ایمیل معتبر وارد کنید.').max(120), z.literal('')])
    .optional(),
  serviceType: z.enum(REQUEST_SERVICE_TYPES),
  subject: z.string().trim().max(150).optional(),
  message: z.string().trim().min(10, 'توضیحات باید حداقل ۱۰ حرف باشد.').max(3000),
})

export async function POST(req: Request) {
  const ip = await getClientIp()
  const rl = rateLimit(`req:${ip}`, LIMIT, WINDOW_MS)
  if (!rl.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `درخواست‌های زیادی ارسال کرده‌اید؛ حدود ${Math.ceil(rl.retryAfterSec / 60)} دقیقه دیگر تلاش کنید.`,
      },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 })
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return NextResponse.json(
      { ok: false, error: 'لطفاً خطاهای فرم را برطرف کنید.', fieldErrors },
      { status: 422 }
    )
  }

  const data = parsed.data

  try {
    await db.serviceRequest.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        serviceType: data.serviceType,
        subject: data.subject || null,
        message: data.message,
      },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'خطای داخلی سرور؛ لطفاً کمی بعد دوباره تلاش کنید.' },
      { status: 500 }
    )
  }
}
