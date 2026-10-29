import type { Metadata, Viewport } from 'next'
import './globals.css'
import './cdanesh.css'
import { Toaster } from '@/components/ui/sonner'
import { SITE } from '@/lib/site'
import { getSiteSettings } from '@/lib/settings'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1, // نمایش استاندارد ۱۰۰٪ — بدون زوم مصنوعی
  themeColor: '#2e2455',
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings()
  return {
    metadataBase: new URL(SITE.url),
    title: {
      default: s.defaultMetaTitle,
      template: `%s | ${s.siteName}`,
    },
    description: s.defaultMetaDescription,
    applicationName: s.siteName,
    authors: [{ name: s.ownerName || s.siteName, url: s.website }],
    creator: s.siteName,
    openGraph: {
      type: 'website',
      locale: 'fa_IR',
      url: SITE.url,
      siteName: s.siteName,
      title: s.defaultMetaTitle,
      description: s.defaultMetaDescription,
      images: [{ url: s.ogImage, width: 1200, height: 630, alt: s.siteName }],
    },
    twitter: {
      card: 'summary_large_image',
      title: s.defaultMetaTitle,
      description: s.defaultMetaDescription,
      images: [s.ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    icons: {
      icon: '/img/logo.svg',
      apple: '/img/logo-180.png',
    },
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="antialiased">
        {children}
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  )
}
