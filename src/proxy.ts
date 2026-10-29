import { NextResponse, type NextRequest, type NextResponse as NR } from 'next/server'
import { db } from '@/lib/db'

/**
 * میدل‌ور ریدایرکت‌های مدیریت‌شده از پنل (/admin/seo).
 * فقط مسیرهای فعال جدول Redirect اعمال می‌شوند؛ کش ۲۰ ثانیه‌ای برای سبک‌ماندن SQLite.
 * هر خطایی = عبور عادی (سایت هرگز به‌خاطر ریدایرکت از دسترس خارج نمی‌شود).
 */

type Row = { fromPath: string; toPath: string; statusCode: number }
let cache: { rows: Row[]; at: number } | null = null
const TTL = 20_000

export async function proxy(req: NextRequest): Promise<NR> {
  const { pathname } = req.nextUrl

  let rows: Row[] = []
  try {
    if (!cache || Date.now() - cache.at > TTL) {
      const data = await db.redirect.findMany({ where: { isActive: true } })
      cache = { rows: data, at: Date.now() }
    }
    rows = cache.rows
  } catch {
    return NextResponse.next()
  }

  const hit = rows.find((r) => r.fromPath === pathname)
  if (hit) {
    const status = (hit.statusCode === 302 || hit.statusCode === 307 || hit.statusCode === 308 ? hit.statusCode : 301) as 301 | 302 | 307 | 308
    return NextResponse.redirect(new URL(hit.toPath, req.url), status)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|img/|uploads/|fonts/|images/).*)'],
}
