'use client'

import { useEffect } from 'react'

/**
 * رفتارهای سراسری سایت: منوی موبایل (Drawer)، انیمیشن ظهور، سال شمسی
 * معادل سایت استاتیک — بدون وابستگی به jQuery.
 */
export default function SiteChrome() {
  useEffect(() => {
    const body = document.body

    // ─── Drawer ──────────────────────────────────────────────────
    const toggle = document.querySelector<HTMLButtonElement>('.menu-toggle')
    const close = document.querySelector<HTMLButtonElement>('.drawer-close')
    const veil = document.querySelector<HTMLElement>('.drawer-veil')

    const openDrawer = () => {
      body.classList.add('drawer-open')
      toggle?.setAttribute('aria-expanded', 'true')
    }
    const closeDrawer = () => {
      body.classList.remove('drawer-open')
      toggle?.setAttribute('aria-expanded', 'false')
    }

    toggle?.addEventListener('click', () =>
      body.classList.contains('drawer-open') ? closeDrawer() : openDrawer(),
    )
    close?.addEventListener('click', closeDrawer)
    veil?.addEventListener('click', closeDrawer)
    document.querySelectorAll<HTMLAnchorElement>('.drawer a').forEach((a) =>
      a.addEventListener('click', closeDrawer),
    )
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer()
    }
    document.addEventListener('keydown', onKey)

    // ─── Reveal (ظهور با اسکرول) ────────────────────────────────
    const reveals = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
    if ('IntersectionObserver' in window && reveals.length) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            if (en.isIntersecting) {
              const el = en.target as HTMLElement
              const delay = el.dataset.delay || '0'
              el.style.transitionDelay = `${Number(delay) * 90}ms`
              el.classList.add('in')
              io.unobserve(el)
            }
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
      )
      reveals.forEach((r) => io.observe(r))
      return () => {
        io.disconnect()
        document.removeEventListener('keydown', onKey)
      }
    } else {
      reveals.forEach((r) => r.classList.add('in'))
    }

    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return null
}
