'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

export interface PfCardData {
  slug: string
  title: string
  category: string
  summary: string
  imageUrl: string
  imageHeight: number
  chips: string[]
  isConceptual: boolean
}

/**
 * کارت نمونه‌کار — مرور زنده و کامل صفحه در Hover (رفع ریشه‌ای باگ گزارش‌شده):
 * ۱) اگر تصویر هنوز بارگیری نشده باشد، انیمیشن تا آماده‌شدن کامل تصویر صبر می‌کند
 *    (قبلاً هاورِ قبل از بارگیری = بدون حرکت بود که حس «اسکرول نمی‌شود» می‌داد).
 * ۲) مسیر حرکت هر بار «تازه» محاسبه می‌شود (ارتفاع واقعی تصویر − ارتفاع قاب) و در
 *    طول انیمیشن هم clamp می‌شود؛ تصویر دقیقاً روی آخرین ردیف فوتر می‌ایستد و
 *    هرگز فضای خالی/سیاه زیر تصویر دیده نمی‌شود.
 * ۳) سرعت متناسب با طول تصویر است (۲٫۴ تا ۶٫۵ ثانیه) تا انتها حس‌شدنی باشد.
 * ۴) خروج موس = بازگشت نرم به ابتدا؛ ورود مجدد = ادامه از همان‌جا (بدون پرش).
 * ۵) موبایل/لمسی: اسکرول طبیعی لمسی داخل قاب. reduce-motion: بدون انیمیشن.
 */
export default function PortfolioCard({ p, delay = 0 }: { p: PfCardData; delay?: number }) {
  const frameRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const scroller = frame.querySelector<HTMLElement>('.pf-scroll')
    const img = scroller?.querySelector('img')
    if (!scroller || !img) return

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!fine.matches || reduce.matches) return

    let raf: number | null = null
    let hovering = false
    let started = false
    let from = 0
    let to = 0
    let t0 = 0
    let dur = 1

    const distance = () => Math.max(0, img.offsetHeight - frame.clientHeight)
    const current = () => {
      const tr = getComputedStyle(scroller).transform
      if (!tr || tr === 'none') return 0
      try {
        const m = new DOMMatrixReadOnly(tr)
        return Math.abs(m.m42)
      } catch {
        return 0
      }
    }
    const apply = (y: number) => {
      // clamp دائمی روی مسیر مجاز — هیچ‌وقت زیر انتهای واقعی تصویر نمی‌رود
      scroller.style.transform = `translateY(${-Math.min(y, distance())}px)`
    }
    const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
    const step = (ts: number) => {
      const prog = Math.min((ts - t0) / dur, 1)
      apply(from + (to - from) * easeInOut(prog))
      raf = prog < 1 ? requestAnimationFrame(step) : null // توقف دقیق روی انتهای تصویر
    }
    const animate = (target: number, d: number) => {
      if (raf) cancelAnimationFrame(raf)
      from = current()
      to = target
      if (Math.abs(to - from) < 2) {
        apply(to)
        raf = null
        return
      }
      dur = d
      t0 = performance.now()
      raf = requestAnimationFrame(step)
    }

    /** شروع مرور — فقط وقتی تصویر واقعاً رندر شده است */
    const begin = () => {
      if (!hovering || started) return
      const dist = distance()
      if (dist < 40) return
      started = true
      animate(dist, Math.min(6500, Math.max(2400, dist * 0.6)))
    }

    const onEnter = () => {
      hovering = true
      started = false
      if (img.complete && img.naturalHeight > 0) {
        begin()
        return
      }
      // تصویر هنوز آماده نیست — به‌محض آماده‌شدن، مرور آغاز می‌شود
      if (typeof img.decode === 'function') {
        img.decode().then(begin).catch(() => {})
      } else {
        img.addEventListener('load', begin, { once: true })
      }
    }

    const onLeave = () => {
      hovering = false
      started = false
      const back = current()
      if (back < 2) {
        if (raf) cancelAnimationFrame(raf)
        raf = null
        apply(0)
        return
      }
      animate(0, Math.min(1500, Math.max(420, back * 0.45))) // بازگشت نرم متناسب با فاصله
    }

    const onResize = () => {
      if (raf) {
        cancelAnimationFrame(raf)
        raf = null
      }
      apply(Math.min(current(), distance()))
    }

    frame.addEventListener('mouseenter', onEnter)
    frame.addEventListener('mouseleave', onLeave)
    window.addEventListener('resize', onResize)
    return () => {
      frame.removeEventListener('mouseenter', onEnter)
      frame.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('resize', onResize)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const href = `/portfolio/${p.slug}`

  return (
    <article className="pf-card2 reveal" data-delay={delay || undefined} data-cat={p.category}>
      <a className="pf-frame" href={href} ref={frameRef} aria-label={`نمونه ${p.title} — مشاهده جزئیات پروژه`}>
        <div className="pf-scroll">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.imageUrl}
            alt={`نمای کامل صفحه اصلی ${p.title} — نمونه مفهومی`}
            width={1280}
            height={p.imageHeight}
            loading="lazy"
          />
        </div>
        {p.isConceptual && <span className="pf-badge">نمونه مفهومی</span>}
        <span className="pf-eye" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
        </span>
      </a>
      <div className="pf-meta">
        <div className="pf-tags">
          <span className="chip chip-gold">{p.category}</span>
          {p.chips.map((c) => (
            <span className="chip" key={c}>{c}</span>
          ))}
        </div>
        <h3>{p.title}</h3>
        <p>{p.summary}</p>
        <Link className="link-more" href={href}>
          جزئیات پروژه
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7" /></svg>
        </Link>
      </div>
    </article>
  )
}
