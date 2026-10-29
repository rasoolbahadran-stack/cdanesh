import { NextResponse } from 'next/server'
import { z } from 'zod'
import { buildArticleGenPrompt, extractJson, ARTICLE_GEN_MAX } from '@/lib/ai'
import { chatComplete } from '@/lib/ai'
import { db } from '@/lib/db'
import { getSessionUser, hasRole, getClientIp } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { logActivity } from '@/lib/activity'

export const runtime = 'nodejs'
export const maxDuration = 180

const schema = z.object({
  topic: z.string().trim().min(5, 'موضوع باید حداقل ۵ حرف باشد.').max(ARTICLE_GEN_MAX.topic),
  keyword: z.string().trim().min(2, 'کلمه کلیدی را وارد کنید.').max(ARTICLE_GEN_MAX.keyword),
  audience: z.string().trim().min(2, 'مخاطب هدف را وارد کنید.').max(ARTICLE_GEN_MAX.audience),
  tone: z.string().trim().min(2).max(ARTICLE_GEN_MAX.tone),
  goal: z.string().trim().max(ARTICLE_GEN_MAX.goal).optional().default(''),
})

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user || !hasRole(user, 'AUTHOR')) {
    return NextResponse.json({ ok: false, error: 'دسترسی غیرمجاز.' }, { status: 401 })
  }

  const ip = await getClientIp()
  const rl = rateLimit(`ai-gen:${user.id}`, 6, 10 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: `تعداد تولید زیاد است؛ حدود ${Math.ceil(rl.retryAfterSec / 60)} دقیقه دیگر تلاش کنید.` },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      if (!fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return NextResponse.json({ ok: false, error: 'ورودی‌ها را کامل کنید.', fieldErrors }, { status: 422 })
  }

  try {
    const text = await chatComplete(buildArticleGenPrompt(parsed.data), { maxTokens: 6000 })
    const json = extractJson(text)
    if (!json) {
      return NextResponse.json(
        { ok: false, error: 'خروجی مدل قابل تفسیر نبود؛ دوباره تلاش کنید یا ورودی را دقیق‌تر کنید.' },
        { status: 502 }
      )
    }
    await logActivity({
      userId: user.id,
      action: 'ai.article.generate',
      entityType: 'Article',
      details: `موضوع: ${parsed.data.topic}`,
      ip,
    })
    return NextResponse.json({ ok: true, draft: json })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'AI_TIMEOUT') {
      return NextResponse.json(
        { ok: false, error: 'زمان پردازش به پایان رسید؛ دوباره تلاش کنید.' },
        { status: 504 }
      )
    }
    return NextResponse.json(
      { ok: false, error: 'سرویس هوش مصنوعی موقتاً در دسترس نیست.' },
      { status: 502 }
    )
  }
}
