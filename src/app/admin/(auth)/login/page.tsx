import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { LoginForm } from '@/components/admin/login-form'

export const metadata: Metadata = {
  title: 'ورود به پنل مدیریت',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AdminLoginPage() {
  const user = await getSessionUser()
  if (user) redirect('/admin')

  return (
    <div className="login-veil">
      <div style={{ width: 'min(430px, 100%)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 26 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="نشان کافه‌دانش"
            width={54}
            height={54}
            style={{ borderRadius: 16, boxShadow: '0 14px 34px -14px rgba(227, 185, 83, .55)' }}
          />
          <span className="brand-name" style={{ marginTop: 12, fontSize: 20 }}>
            کافه‌دانش
            <small style={{ letterSpacing: 3 }}>ADMIN PANEL</small>
          </span>
        </div>

        <div className="form-card" style={{ padding: '34px 30px' }}>
          <h1 className="h3" style={{ textAlign: 'center', marginBottom: 24 }}>
            ورود به پنل مدیریت
          </h1>
          <LoginForm />
        </div>

        <p className="muted small" style={{ textAlign: 'center', marginTop: 18 }}>
          <Link href="/" style={{ color: 'var(--gold)' }}>
            ← بازگشت به سایت
          </Link>
        </p>
      </div>
    </div>
  )
}
