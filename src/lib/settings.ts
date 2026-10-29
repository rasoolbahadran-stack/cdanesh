import 'server-only'
import { cache } from 'react'
import { db } from '@/lib/db'
import { SITE } from '@/lib/site'

export interface SiteSettings {
  siteName: string
  siteTagline: string
  ownerName: string
  ownerTitle: string
  phone: string
  phoneDisplay: string
  phoneIntl: string
  website: string
  email: string
  address: string
  socials: { label: string; url: string }[]
  defaultMetaTitle: string
  defaultMetaDescription: string
  ogImage: string
  pricingMode: 'estimate' | 'final'
  paymentGateway: string
}

const DEFAULTS: Record<string, string> = {
  siteName: SITE.name,
  siteTagline: 'استودیو دیجیتال؛ طراحی سایت، سئو و راهکارهای هوشمند',
  ownerName: '',
  ownerTitle: '',
  phone: '',
  website: SITE.url,
  email: '',
  address: '',
  socials: '[]',
  defaultMetaTitle: 'کافه‌دانش | طراحی سایت، سئو و راهکارهای هوشمند',
  defaultMetaDescription:
    'استودیو دیجیتال کافه‌دانش؛ طراحی سایت اختصاصی، سئوی اصولی و راهکارهای هوش مصنوعی برای رشد واقعی کسب‌وکار شما.',
  ogImage: '/img/og-default.webp',
  pricingMode: 'estimate',
  paymentGateway: '',
}

/** تبدیل ۰۹۱۲۳۴۵۶۷۸۹ به لینک tel: با کد کشور (فقط برای لینک، شماره نمایشی همان موبایل است) */
function toIntl(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length === 11) return '+98' + digits.slice(1)
  return digits
}

function toDisplay(phone: string): string {
  return phone // نمایش یکسان در همه صفحات: 09165806207
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  let rows: { key: string; value: string }[] = []
  try {
    rows = await db.siteSetting.findMany()
  } catch {
    rows = []
  }
  const map: Record<string, string> = { ...DEFAULTS }
  for (const r of rows) if (r.value !== null && r.value !== undefined) map[r.key] = r.value

  let socials: { label: string; url: string }[] = []
  try {
    socials = JSON.parse(map.socials || '[]')
  } catch {
    socials = []
  }

  return {
    siteName: map.siteName,
    siteTagline: map.siteTagline,
    ownerName: map.ownerName,
    ownerTitle: map.ownerTitle,
    phone: map.phone,
    phoneDisplay: toDisplay(map.phone),
    phoneIntl: toIntl(map.phone),
    website: map.website,
    email: map.email,
    address: map.address,
    socials,
    defaultMetaTitle: map.defaultMetaTitle,
    defaultMetaDescription: map.defaultMetaDescription,
    ogImage: map.ogImage,
    pricingMode: map.pricingMode === 'final' ? 'final' : 'estimate',
    paymentGateway: map.paymentGateway,
  }
})
