// ─── محدودسازی نرخ درخواست در حافظه (برای APIهای عمومی) ─────────

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// پاک‌سازی دوره‌ای برای جلوگیری از رشد حافظه
const SWEEP_INTERVAL_MS = 10 * 60 * 1000
let lastSweep = Date.now()

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSec: number
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const existing = buckets.get(key)
  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 }
  }

  existing.count += 1
  if (existing.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil((existing.resetAt - now) / 1000),
    }
  }
  return { allowed: true, remaining: limit - existing.count, retryAfterSec: 0 }
}
