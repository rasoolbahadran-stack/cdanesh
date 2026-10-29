import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'
import sharp from 'sharp'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { logActivity } from '@/lib/activity'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const ALLOWED_MIME = [
  'image/webp',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/svg+xml',
] as const

const MAX_SIZE = 5 * 1024 * 1024 // ۵ مگابایت

/** POST /api/admin/media — آپلود تصویر (multipart: file, alt) */
export async function POST(req: NextRequest) {
  // احراز هویت
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ ok: false, error: 'ابتدا وارد حساب شوید.' }, { status: 401 })
  }

  // محدودسازی نرخ: حداکثر ۲۰ آپلود در دقیقه برای هر کاربر
  const rl = rateLimit(`media-upload:${user.id}`, 20, 60_000)
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: `آپلود زیاد است؛ ${rl.retryAfterSec} ثانیه دیگر تلاش کنید.` },
      { status: 429 }
    )
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, error: 'داده فرم نامعتبر است.' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: 'فایل تصویر انتخاب نشده است.' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { ok: false, error: 'حجم فایل بیش از ۵ مگابایت است.' },
      { status: 400 }
    )
  }

  const mime = (file.type || '').toLowerCase()
  if (!(ALLOWED_MIME as readonly string[]).includes(mime)) {
    return NextResponse.json(
      { ok: false, error: 'فرمت مجاز نیست؛ فقط WebP، PNG، JPEG، GIF و SVG پذیرفته می‌شود.' },
      { status: 400 }
    )
  }

  const alt = String(form.get('alt') ?? '').trim().slice(0, 300) || null

  try {
    const now = new Date()
    const yyyy = String(now.getFullYear())
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dirRel = `/uploads/${yyyy}/${mm}`
    const dirAbs = path.join(process.cwd(), 'public', dirRel)
    await mkdir(dirAbs, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    const base = `${Date.now()}-${randomBytes(4).toString('hex')}`

    let ext: string
    let output: Buffer
    let storedMime: string
    let width: number | null = null
    let height: number | null = null

    if (mime === 'image/svg+xml') {
      // SVG دست‌نخورده ذخیره می‌شود (بدون تبدیل و بدون ابعاد)
      ext = 'svg'
      output = buffer
      storedMime = 'image/svg+xml'
    } else if (mime === 'image/webp') {
      ext = 'webp'
      output = buffer
      storedMime = 'image/webp'
      try {
        const meta = await sharp(buffer).metadata()
        width = meta.width ?? null
        height = meta.height ?? null
      } catch {
        // بدون ابعاد ذخیره می‌شود
      }
    } else {
      // PNG / JPEG / GIF → WebP با کیفیت ۸۲ (شفافیت PNG و انیمیشن GIF حفظ می‌شود)
      try {
        output = await sharp(buffer, { animated: mime === 'image/gif' })
          .webp({ quality: 82 })
          .toBuffer()
        ext = 'webp'
        storedMime = 'image/webp'
        const meta = await sharp(output).metadata()
        width = meta.width ?? null
        height = meta.height ?? null
      } catch {
        return NextResponse.json(
          { ok: false, error: 'پردازش تصویر ناموفق بود؛ فایل سالم را دوباره تلاش کنید.' },
          { status: 400 }
        )
      }
    }

    const filename = `${base}.${ext}`
    const relPath = `${dirRel}/${filename}`
    await writeFile(path.join(dirAbs, filename), output)

    const row = await db.media.create({
      data: {
        filename,
        originalName: file.name.slice(0, 200) || filename,
        path: relPath,
        mimeType: storedMime,
        size: output.length,
        width,
        height,
        alt,
        uploadedById: user.id,
      },
    })

    await logActivity({
      userId: user.id,
      action: 'media.upload',
      entityType: 'Media',
      entityId: row.id,
      details: `${row.originalName} (${Math.round(output.length / 1024)}KB)`,
    })

    return NextResponse.json({ ok: true, url: relPath, id: row.id })
  } catch {
    return NextResponse.json(
      { ok: false, error: 'خطای سرور در ذخیره فایل.' },
      { status: 500 }
    )
  }
}
