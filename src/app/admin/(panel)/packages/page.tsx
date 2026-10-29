import type { Metadata } from 'next'
import Link from 'next/link'
import { Tag } from 'lucide-react'
import { db } from '@/lib/db'
import { getSessionUser, hasRole } from '@/lib/auth'
import { getSiteSettings } from '@/lib/settings'
import { toFaDigits } from '@/lib/fa'
import { SERVICE_TYPE_LABELS } from '@/lib/site'
import {
  deletePackageAction,
  togglePackagePublishAction,
  savePackageAction,
} from '@/lib/actions/package-actions'
import { PackageForm, EMPTY_PACKAGE, type PackageFormValues } from '@/components/admin/package-form'
import { ConfirmButton } from '@/components/admin/confirm-button'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'پکیج‌ها و تعرفه' }

function parseJsonArr(raw: string): string[] {
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return []
  }
}

export default async function AdminPackagesPage() {
  const user = await getSessionUser()
  const canManage = hasRole(user, 'ADMIN')
  const s = await getSiteSettings()

  const rows = await db.package.findMany({ orderBy: [{ serviceType: 'asc' }, { sortOrder: 'asc' }] })

  if (!canManage) {
    return (
      <div className="adm-panel">
        <div className="adm-panel-head"><b>پکیج‌ها و تعرفه</b></div>
        <p className="adm-hint">مدیریت تعرفه‌ها فقط برای «مدیر کل» فعال است.</p>
      </div>
    )
  }

  const toFormValues = (p: (typeof rows)[number]): PackageFormValues => ({
    id: p.id,
    serviceType: p.serviceType,
    name: p.name,
    slug: p.slug ?? '',
    audience: p.audience ?? '',
    features: parseJsonArr(p.features).join('\n'),
    excluded: parseJsonArr(p.excluded).join('\n'),
    duration: p.duration ?? '',
    support: p.support ?? '',
    priceToman: p.priceToman ?? '',
    priceNote: p.priceNote ?? '',
    note: p.note ?? '',
    marketBasis: p.marketBasis ?? '',
    featured: p.featured,
    isPublished: p.isPublished,
  })

  return (
    <div>
      <div className="adm-topbar">
        <div>
          <h1>پکیج‌ها و تعرفه</h1>
          <p className="lead muted">
            {toFaDigits(rows.length)} پکیج — ساختار پکیج‌های صفحه اصلی و لینک «درخواست این پکیج» از همین‌جا مدیریت می‌شود.
          </p>
        </div>
      </div>

      {/* دروازهٔ تأیید تعرفه */}
      <div
        className="adm-panel"
        style={{
          marginBottom: 20,
          borderColor: s.pricingMode === 'final' ? 'rgba(52,168,83,.45)' : 'rgba(234,179,8,.5)',
        }}
      >
        <div className="adm-panel-head">
          <b>وضعیت قیمت‌گذاری</b>
          <span
            className="chip"
            style={
              s.pricingMode === 'final'
                ? { color: 'var(--ok,#34a853)', borderColor: 'rgba(52,168,83,.45)' }
                : { color: '#ca8a04', borderColor: 'rgba(234,179,8,.5)' }
            }
          >
            {s.pricingMode === 'final' ? 'نهایی — قیمت‌ها نمایش داده می‌شوند' : 'برآوردی — بدون نمایش قیمت'}
          </span>
        </div>
        {s.pricingMode !== 'final' ? (
          <p className="adm-hint" style={{ margin: 0 }}>
            تا وقتی حالت «برآوردی» است، در همه صفحات عمومی فقط عبارت «نیازمند برآورد» دیده می‌شود و قیمت‌های واردشده
            در هیچ صفحه‌ای منتشر نمی‌شوند. پس از تأیید نهایی تعرفه‌ها، از{' '}
            <Link href="/admin/settings" style={{ color: 'var(--gold)' }}>تنظیمات</Link> حالت را روی «نهایی» بگذارید.
          </p>
        ) : (
          <p className="adm-hint" style={{ margin: 0 }}>
            حالت نهایی فعال است؛ پکیج‌های دارای قیمت و «نمایش در سایت»، قیمت‌شان به‌صورت عمومی نمایش داده می‌شود.
          </p>
        )}
      </div>

      <div className="adm-grid2" style={{ marginBottom: 22 }}>
        <div className="form-card" style={{ padding: 26 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>افزودن پکیج جدید</h2>
          <PackageForm action={savePackageAction} initial={EMPTY_PACKAGE} />
        </div>
        <div className="adm-panel">
          <div className="adm-panel-head"><b>راهنمای سریع</b></div>
          <ul className="adm-hint" style={{ margin: 0, paddingRight: 18, display: 'grid', gap: 8 }}>
            <li>هر پکیج با «نوع خدمت» به تب‌های صفحه اصلی (طراحی سایت / سئو و محتوا / هوش مصنوعی) وصل می‌شود.</li>
            <li>«اسلاگ» لینک درخواست را می‌سازد: <span dir="ltr">/request?pkg=design-pro</span></li>
            <li>قیمت فقط وقتی عمومی می‌شود که هم «نمایش در سایت» فعال باشد و هم حالت قیمت‌گذاری در تنظیمات «نهایی» باشد.</li>
            <li>«مبنای مقایسه بازار» فقط داخلی است و هرگز در سایت نمایش داده نمی‌شود.</li>
          </ul>
        </div>
      </div>

      {rows.length === 0 && (
        <div className="adm-panel">
          <div className="adm-empty">
            <Tag style={{ width: 34, height: 34, margin: '0 auto 10px', opacity: 0.4 }} aria-hidden />
            هنوز پکیجی ثبت نشده است؛ اولین پکیج را از فرم بالا اضافه کنید.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 14 }}>
        {rows.map((p) => (
          <details key={p.id} className="faq-item" style={{ background: 'rgba(255,255,255,.02)' }}>
            <summary>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <b>{p.name}</b>
                <span className="chip">{SERVICE_TYPE_LABELS[p.serviceType] ?? p.serviceType}</span>
                {p.featured && <span className="chip chip-gold">پیشنهاد ما</span>}
                {p.isPublished ? (
                  <span className="chip" style={{ color: 'var(--ok,#34a853)', borderColor: 'rgba(52,168,83,.4)' }}>نمایش در سایت</span>
                ) : (
                  <span className="chip" style={{ color: 'var(--err)', borderColor: 'rgba(229,118,106,.4)' }}>پیش‌نویس</span>
                )}
                <span className="chip">
                  {p.priceToman && s.pricingMode === 'final' ? `${toFaDigits(Number(p.priceToman).toLocaleString('en-US'))} تومان` : 'نیازمند برآورد'}
                </span>
              </span>
              <span className="fx" aria-hidden />
            </summary>
            <div style={{ padding: '0 24px 22px' }}>
              <PackageForm action={savePackageAction} initial={toFormValues(p)} onDoneResetKey={p.updatedAt.toISOString()} />
              <div className="row-actions" style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <form action={togglePackagePublishAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="next" value={p.isPublished ? '0' : '1'} />
                  <button type="submit" className="adm-btn">
                    {p.isPublished ? 'خروج از نمایش سایت' : 'نمایش در سایت'}
                  </button>
                </form>
                <form action={deletePackageAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <ConfirmButton label="حذف پکیج" message={`پکیج «${p.name}» حذف شود؟`} />
                </form>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
