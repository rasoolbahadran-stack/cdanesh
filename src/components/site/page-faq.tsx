import { getFaqForPage } from '@/lib/content'
import FaqAccordion from './faq-accordion'
import CtaBanner from './cta-banner'

/**
 * بخش سؤالات متداول اختصاصی صفحه (از دیتابیس) + CTA پایانی
 */
export default async function PageFaq({ pageKey, ctaHref }: { pageKey: string; ctaHref?: string }) {
  const items = await getFaqForPage(pageKey)
  if (!items.length) return null
  return (
    <section className="section-tight">
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: 34 }}>
          <span className="eyebrow">پرسش و پاسخ</span>
          <h2 className="h2" style={{ marginTop: 10 }}>سؤالات متداول این خدمت</h2>
        </div>
        <FaqAccordion items={items} />
      </div>
    </section>
  )
}

export function FaqCta({ ctaHref = '/request' }: { ctaHref?: string }) {
  return (
    <CtaBanner
      title="پاسخ سؤال‌تان را پیدا نکردید؟"
      text="سؤال خود را مستقیم بپرسید؛ پاسخ روشن و بدون اغراق می‌دهیم."
      primary={{ href: ctaHref, label: 'پرسیدن سؤال' }}
      secondary={{ href: '/contact', label: 'تماس با ما' }}
    />
  )
}
