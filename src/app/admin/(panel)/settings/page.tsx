import { db } from '@/lib/db'
import { saveSettingsAction } from '@/lib/actions/admin-actions'
import { SettingsForm } from '@/components/admin/settings-form'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const rows = await db.siteSetting.findMany()
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">تنظیمات سایت</h1>
        <p className="mt-1 text-sm text-slate-500">
          برند، تماس، سئوی پیش‌فرض، قیمت‌گذاری و پرداخت — فقط اطلاعات واقعی وارد کنید؛ فیلدهای خالی در سایت نمایش داده نمی‌شوند.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <SettingsForm
          action={saveSettingsAction}
          initial={{
            siteName: settings.siteName ?? '',
            siteTagline: settings.siteTagline ?? '',
            ownerName: settings.ownerName ?? '',
            ownerTitle: settings.ownerTitle ?? '',
            phone: settings.phone ?? '',
            website: settings.website ?? '',
            email: settings.email ?? '',
            address: settings.address ?? '',
            defaultMetaTitle: settings.defaultMetaTitle ?? '',
            defaultMetaDescription: settings.defaultMetaDescription ?? '',
            ogImage: settings.ogImage ?? '',
            pricingMode: settings.pricingMode ?? 'estimate',
            paymentGateway: settings.paymentGateway ?? '',
          }}
        />
      </div>
    </div>
  )
}
