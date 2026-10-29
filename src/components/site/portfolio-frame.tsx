'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLink, Maximize2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toFaDigits } from '@/lib/fa'

export interface PortfolioCardData {
  slug: string
  title: string
  category: string
  description: string
  imageUrl: string
  imageHeight: number
  link: string | null
  isConceptual: boolean
}

/**
 * قاب پیش‌نمایش زندهٔ نمونه‌کار (رفع ریشه‌ای طبق مشخصات):
 * · تصویر کامل Landing Page (از ابتدای صفحه تا انتهای محتوای واقعی) داخل قاب ثابت است.
 * · دسکتاپ: با ورود موس، تصویر داخل قاب از بالا به پایین به‌صورت نرم اسکرول می‌شود،
 *   دقیقاً روی انتهای واقعی تصویر می‌ایستد و با خروج موس به‌نرمی به بالا برمی‌گردد.
 * · هیچ ماسک/گرادیان/بلوری روی تصویر نیست؛ قاب هرگز اندازه‌اش تغییر نمی‌کند.
 * · جابه‌جایی به‌صورت داینامیک = ارتفاع تصویر − ارتفاع قاب محاسبه می‌شود.
 * · موبایل/لمسی: اسکرول طبیعی لمسی داخل قاب + دکمه نمای بزرگ.
 * · prefers-reduced-motion: انیمیشن خودکار غیرفعال (اسکرول دستی).
 */
export function PortfolioFrame({ item, priority = false }: { item: PortfolioCardData; priority?: boolean }) {
  const [zoomOpen, setZoomOpen] = useState(false)
  const viewportRef = useRef<HTMLDivElement>(null)
  const imgWrapRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const offsetRef = useRef(0)

  const [autoScroll, setAutoScroll] = useState(false)
  useEffect(() => {
    const mqHover = window.matchMedia('(hover: hover) and (pointer: fine)')
    const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setAutoScroll(mqHover.matches && !mqReduce.matches)
    update()
    mqHover.addEventListener('change', update)
    mqReduce.addEventListener('change', update)
    return () => {
      mqHover.removeEventListener('change', update)
      mqReduce.removeEventListener('change', update)
    }
  }, [])

  /** بیشینهٔ جابه‌جایی مجاز = ارتفاع واقعی تصویر رندرشده − ارتفاع قاب */
  const maxOffset = useCallback((): number => {
    const vp = viewportRef.current
    const im = imgWrapRef.current
    if (!vp || !im) return 0
    return Math.max(0, Math.round(im.offsetHeight - vp.clientHeight))
  }, [])

  const stopAnim = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const applyOffset = useCallback((v: number) => {
    offsetRef.current = v
    if (imgWrapRef.current) {
      imgWrapRef.current.style.transform = `translate3d(0, ${-v}px, 0)`
    }
  }, [])

  const animateTo = useCallback(
    (to: number, duration: number, ease: (t: number) => number) => {
      stopAnim()
      const vp = viewportRef.current
      if (!vp) return
      if (duration <= 0) {
        applyOffset(to)
        return
      }
      const from = offsetRef.current
      const t0 = performance.now()
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / duration)
        applyOffset(from + (to - from) * ease(p))
        if (p < 1) rafRef.current = requestAnimationFrame(step)
        else rafRef.current = null
      }
      rafRef.current = requestAnimationFrame(step)
    },
    [applyOffset, stopAnim]
  )

  // ورود موس: شروع اسکرول نرم از بالا تا انتهای واقعی تصویر
  const handleEnter = useCallback(() => {
    if (!autoScroll) return
    // اگر انیمیشن بازگشت در جریان است، از موقعیت فعلی ادامه نده؛ از بالا شروع کن (رفتار تمیز)
    const dist = maxOffset()
    if (dist <= 0) return
    applyOffset(0)
    viewportRef.current?.scrollTo({ top: 0 })
    // سرعت خوانا: ~۰٫۲ پیکسل بر میلی‌ثانیه با کف/سقف معقول
    const duration = Math.min(9000, Math.max(2800, Math.round(dist * 5)))
    animateTo(dist, duration, (t) => t) // خطی: حس اسکرول یکنواخت
  }, [animateTo, applyOffset, autoScroll, maxOffset])

  // خروج موس: بازگشت نرم به بالا
  const handleLeave = useCallback(() => {
    if (!autoScroll) return
    stopAnim()
    animateTo(0, 750, (t) => 1 - Math.pow(1 - t, 3)) // ease-out مکعبی
  }, [animateTo, autoScroll, stopAnim])

  // پاک‌سازی هنگام حذف کامپوننت
  useEffect(() => stopAnim, [stopAnim])

  return (
    <article className="card-hover group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* هدر قاب مرورگر */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <div className="mx-2 flex-1 rounded-md bg-white px-3 py-1 text-start text-[11px] text-slate-400" dir="ltr">
          {item.link ? new URL(item.link).hostname : `cdanesh.ir/demo/${item.slug}`}
        </div>
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white hover:text-brand focus-ring"
          aria-label={`نمایش بزرگ‌تر نمونه‌کار ${item.title}`}
        >
          <Maximize2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {/* پنجرهٔ تصویر: در دسکتاپ هاور-اسکرول خودکار، در لمس اسکرول طبیعی */}
      <div
        ref={viewportRef}
        onPointerEnter={handleEnter}
        onPointerLeave={handleLeave}
        className="relative max-h-[420px] overflow-y-auto overscroll-contain bg-slate-100 sm:max-h-[480px]"
        style={autoScroll ? { overflow: 'hidden' } : undefined}
        role="region"
        aria-label={`پیش‌نمایش وب‌سایت ${item.title}`}
      >
        <div ref={imgWrapRef} className="relative w-full will-change-transform">
          <Image
            src={item.imageUrl}
            alt={`نمای کامل صفحه وب‌سایت ${item.title}`}
            width={1280}
            height={item.imageHeight}
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 560px"
            className="block w-full"
          />
        </div>
      </div>

      {/* اطلاعات پروژه */}
      <div className="p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand/8 px-3 py-1 text-xs font-semibold text-brand">
            {item.category}
          </span>
          {item.isConceptual && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
              نمونه مفهومی
            </span>
          )}
        </div>
        <h3 className="mb-1.5 text-lg font-bold text-slate-900">{item.title}</h3>
        <p className="text-sm leading-6.5 text-slate-600">{item.description}</p>
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand-dark focus-ring"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            مشاهده پروژه
          </a>
        )}
      </div>

      {/* نمایش بزرگ‌تر (اختیاری، به انتخاب کاربر) */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-w-4xl overflow-hidden p-0">
          <DialogHeader className="border-b border-slate-100 px-6 py-4">
            <DialogTitle className="text-start text-base font-bold text-slate-900">
              پیش‌نمایش کامل: {item.title}
            </DialogTitle>
            <p className="mt-1 text-xs text-slate-500">
              با اسکرول، کل صفحه را از بالا به پایین مشاهده کنید
            </p>
          </DialogHeader>
          <div
            className="custom-scrollbar max-h-[75vh] overflow-y-auto overscroll-contain bg-slate-100"
            role="region"
            aria-label="نمای بزرگ‌شدهٔ نمونه‌کار"
          >
            <Image
              src={item.imageUrl}
              alt={`نمای کامل صفحه وب‌سایت ${item.title} — نسخه بزرگ‌تر`}
              width={1280}
              height={item.imageHeight}
              sizes="(max-width: 900px) 100vw, 900px"
              className="w-full"
            />
          </div>
          <div className="border-t border-slate-100 px-6 py-3 text-xs text-slate-400">
            {toFaDigits(Math.round(item.imageHeight / 1080))} صفحه طولانی — کیفیت کامل حفظ شده است
          </div>
        </DialogContent>
      </Dialog>
    </article>
  )
}
