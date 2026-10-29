'use client'

import { useActionState } from 'react'
import { loginAction, type LoginState } from '@/lib/actions/auth-actions'

const initialState: LoginState = {}

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState)

  return (
    <>
      {state.error ? (
        <div
          role="alert"
          className="form-ok show"
          style={{
            background: 'rgba(229, 118, 106, .1)',
            borderColor: 'rgba(229, 118, 106, .4)',
            color: 'var(--err)',
            display: 'flex',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ width: 17, height: 17, flexShrink: 0, marginTop: 4 }}
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span>{state.error}</span>
        </div>
      ) : null}

      <form action={formAction} noValidate>
        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="auser">
            نام کاربری <i>*</i>
          </label>
          <input
            className="control"
            id="auser"
            name="username"
            autoComplete="username"
            placeholder="username"
            dir="ltr"
            style={{ textAlign: 'left' }}
            required
            disabled={pending}
          />
        </div>
        <div className="field" style={{ marginBottom: 24 }}>
          <label htmlFor="apass">
            رمز عبور <i>*</i>
          </label>
          <input
            className="control"
            id="apass"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            dir="ltr"
            style={{ textAlign: 'left' }}
            required
            disabled={pending}
          />
        </div>
        <button className="btn btn-gold btn-block btn-lg" type="submit" disabled={pending}>
          {pending ? 'در حال بررسی…' : 'ورود به پنل'}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ width: 18, height: 18 }}
          >
            <path d="M19 12H5m7-7-7 7 7 7" />
          </svg>
        </button>
      </form>

      <p className="form-note">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="4" y="10" width="16" height="11" rx="2.5" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        <span>
          برای حفاظت از حساب، پس از <b>۵ تلاش ناموفق</b> ورود به مدت <b>۱۵ دقیقه</b> موقتاً قفل می‌شود.
          همه تلاش‌های ورود ثبت می‌شوند.
        </span>
      </p>
    </>
  )
}
