import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/site/site-header'
import SiteFooter from '@/components/site/site-footer'

export const metadata: Metadata = {
  title: 'صفحه پیدا نشد',
  description: 'صفحه موردنظر شما در کافه‌دانش یافت نشد.',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <div className="nf-wrap">
          <div className="nf-code" aria-hidden="true">
            ۴۰۴
          </div>
          <h1 className="h2" style={{ marginBottom: '10px' }}>
            این صفحه پیدا نشد
          </h1>
          <p className="lead" style={{ maxWidth: '480px', marginBottom: '32px' }}>
            آدرسی که وارد کرده‌اید وجود ندارد یا جابه‌جا شده است. از این‌جا ادامه بدهید:
          </p>
          <div style={{ display: 'flex', gap: '13px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/" className="btn btn-gold btn-lg">
              صفحه اصلی
            </Link>
            <Link href="/blog" className="btn btn-ghost btn-lg">
              مجله مقالات
            </Link>
            <Link href="/portfolio" className="btn btn-ghost btn-lg">
              نمونه‌کارها
            </Link>
          </div>
          <p className="muted small" style={{ marginTop: '40px' }}>
            کافه‌دانش — استودیو دیجیتال
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
