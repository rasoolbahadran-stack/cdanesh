import { NextResponse } from 'next/server'
import { AI_TOOLS, chatComplete, getTool } from '@/lib/ai'
import { rateLimit } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 120

const LIMIT = 10
const WINDOW_MS = 10 * 60 * 1000 // ۱۰ دقیقه

export async function POST(req: Request) {
  let body: { toolId?: string; input?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'درخواست نامعتبر است.' }, { status: 400 })
  }

  const ip = await getClientIp()
  const rl = rateLimit(`ai-tools:${ip}`, LIMIT, WINDOW_MS)
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'RATE_LIMITED', retryAfterSec: rl.retryAfterSec },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } }
    )
  }

  const toolId = typeof body.toolId === 'string' ? body.toolId : ''
  const tool = getTool(toolId)
  if (!tool) {
    return NextResponse.json({ ok: false, error: 'ابزار موردنظر یافت نشد.' }, { status: 404 })
  }

  const input = (body.input ?? {}) as Record<string, unknown>
  const cleaned: Record<string, string> = {}

  // اعتبارسنجی سمت سرور: الزامی‌ها + محدودیت طول
  for (const field of tool.fields) {
    const raw = input[field.name]
    const value = typeof raw === 'string' ? raw.trim().slice(0, field.maxLength) : ''
    if (field.required && !value) {
      return NextResponse.json(
        { ok: false, error: `پر کردن فیلد «${field.label}» الزامی است.`, fieldErrors: { [field.name]: 'این فیلد الزامی است.' } },
        { status: 422 }
      )
    }
    if (value) cleaned[field.name] = value
  }

  try {
    const messages = tool.buildPrompt(cleaned)
    const result = await chatComplete(messages, { maxTokens: tool.maxOutputTokens })
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'AI_TIMEOUT') {
      return NextResponse.json(
        { ok: false, error: 'پردازش بیش از حد طول کشید؛ لطفاً دوباره تلاش کنید.' },
        { status: 504 }
      )
    }
    return NextResponse.json(
      { ok: false, error: 'AI_UNAVAILABLE' },
      { status: 502 }
    )
  }
}
