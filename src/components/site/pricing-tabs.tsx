'use client'

import Link from 'next/link'
import { useState } from 'react'

export interface PackageCardData {
  id: string
  slug: string | null
  name: string
  serviceType: string
  serviceLabel: string
  audience: string
  features: string[]
  priceMode: 'estimate' | 'final'
  priceText: string | null
  priceNote: string | null
  duration: string | null
  note: string | null
  featured: boolean
}

/**
 * تب‌های دسته‌بندی پکیج‌ها — نسخه کارا (data-tab قدیمی جاوااسکریپت نداشت)
 * همان ظاهر و کلاس‌های CSS تأییدشده حفظ شده است.
 */
export function PackagesTabs({ tabs }: { tabs: { key: string; label: string; cards: PackageCardData[] }[] }) {
  const [active, setActive] = useState(tabs[0]?.key ?? 'design')

  const check = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 13 4 4L19 7" /></svg>
  )

  return (
    <>
      <div className="pricing-tabs" role="tablist" aria-label="دسته‌بندی پکیج‌های خدمات">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={active === t.key ? 'active' : undefined}
            data-tab={t.key}
            role="tab"
            aria-selected={active === t.key}
            aria-controls={`pane-${t.key}`}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tabs.map((t) => (
        <div
          key={t.key}
          className={active === t.key ? 'pkg-pane active' : 'pkg-pane'}
          id={`pane-${t.key}`}
          role="tabpanel"
          aria-label={t.label}
        >
          {t.cards.length === 0 ? (
            <p className="muted small" style={{ textAlign: 'center', padding: '26px 0' }}>
              برای این حوزه، برآورد اختصاصی ارائه می‌شود — از{' '}
              <Link href="/request" style={{ color: 'var(--gold)' }}>فرم درخواست</Link> استفاده کنید.
            </p>
          ) : (
            <div className="pkg-grid">
              {t.cards.map((c) => (
                <article
                  key={c.id}
                  className={c.featured ? 'pkg-card featured reveal' : 'pkg-card reveal'}
                  {...(c.featured ? { 'data-delay': '1' } : {})}
                >
                  {c.featured && <span className="pkg-flag">پیشنهاد ما</span>}
                  <span className="pkg-cat">{c.serviceLabel}</span>
                  <h3>{c.name}</h3>
                  <p className="pkg-for">{c.audience}</p>
                  <div className="pkg-price">
                    {c.priceMode === 'final' && c.priceText ? (
                      <>
                        <b>{c.priceText}</b>
                        <span>{c.duration ?? 'طبق قرارداد'}</span>
                      </>
                    ) : (
                      <>
                        <b>دریافت برآورد قیمت</b>
                        <span>{c.priceNote ?? 'برآورد دقیق پس از جلسه نیازسنجی رایگان'}</span>
                      </>
                    )}
                  </div>
                  <ul className="pkg-feat">
                    {c.features.map((f) => (
                      <li key={f}>{check}{f}</li>
                    ))}
                  </ul>
                  <Link
                    href={c.slug ? `/request?pkg=${encodeURIComponent(c.slug)}` : '/request'}
                    className={c.featured ? 'btn btn-gold btn-block' : 'btn btn-ghost btn-block'}
                  >
                    درخواست این {c.serviceType.startsWith('ai') ? 'راهکار' : 'پکیج'}
                  </Link>
                  {c.note && <p className="pkg-note">{c.note}</p>}
                </article>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  )
}
