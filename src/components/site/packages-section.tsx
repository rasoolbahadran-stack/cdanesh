import { db } from '@/lib/db'
import { getSiteSettings } from '@/lib/settings'
import { SERVICE_TYPE_LABELS } from '@/lib/site'
import { toFaDigits } from '@/lib/fa'
import { PackagesTabs, type PackageCardData } from './pricing-tabs'

/** نگاشت serviceType به تب‌های صفحه اصلی (ساختار تأییدشده استاتیک) */
const TAB_DEFS: { key: string; label: string; types: string[] }[] = [
  { key: 'design', label: 'طراحی سایت', types: ['web-design', 'e-commerce'] },
  { key: 'seo', label: 'سئو و محتوا', types: ['seo', 'content'] },
  { key: 'ai', label: 'هوش مصنوعی و اتوماسیون', types: ['ai-solutions'] },
]

function toFaPrice(raw: string): string {
  const n = Number(raw.replace(/[^\d]/g, ''))
  if (!Number.isFinite(n) || n <= 0) return raw
  return `${toFaDigits(n.toLocaleString('en-US'))} تومان`
}

/**
 * بخش «پکیج‌های خدمات» صفحه اصلی — داده‌محور از دیتابیس و پنل مدیریت.
 * تا وقتی pricingMode=estimate باشد، هیچ قیمتی نمایش داده نمی‌شود (فقط «نیازمند برآورد»).
 */
export default async function PackagesSection() {
  const [rows, s] = await Promise.all([
    db.package.findMany({ where: { isPublished: true }, orderBy: { sortOrder: 'asc' } }),
    getSiteSettings(),
  ])

  const tabs = TAB_DEFS.map((t) => ({
    key: t.key,
    label: t.label,
    cards: rows
      .filter((p) => t.types.includes(p.serviceType))
      .map<PackageCardData>((p) => {
        let features: string[] = []
        try { features = JSON.parse(p.features) } catch { features = [] }
        return {
          id: p.id,
          slug: p.slug,
          name: p.name,
          serviceType: p.serviceType,
          serviceLabel: SERVICE_TYPE_LABELS[p.serviceType] ?? p.serviceType,
          audience: p.audience ?? '',
          features,
          priceMode: s.pricingMode,
          priceText: s.pricingMode === 'final' && p.priceToman ? toFaPrice(p.priceToman) : null,
          priceNote: p.priceNote,
          duration: p.duration,
          note: p.note,
          featured: p.featured,
        }
      }),
  }))

  return (
    <section className="section" id="pricing">
      <div className="wrap">
        <div className="section-head reveal">
          <span className="eyebrow">پکیج‌های خدمات</span>
          <h2 className="h2">پکیج‌های شفاف با <span className="gold">قیمت شروع مشخص</span></h2>
          <p className="lead">قیمت‌های طراحی سایت نقطه شروع همکاری‌اند؛ برآورد دقیق و مکتوب پس از جلسه نیازسنجی رایگان اعلام می‌شود — بدون هزینه پنهان.</p>
        </div>

        <PackagesTabs tabs={tabs} />

        <p className="muted small" style={{ textAlign: 'center', marginTop: '30px', maxWidth: '680px', marginInline: 'auto' }}>
          برآورد دقیق هزینه و زمان تحویل، پس از جلسه نیازسنجی رایگان به‌صورت مکتوب ارائه می‌شود — بدون هزینه پنهان.
        </p>
      </div>
    </section>
  )
}
