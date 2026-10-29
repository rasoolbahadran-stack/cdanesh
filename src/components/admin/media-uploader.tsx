'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, ImagePlus, Loader2 } from 'lucide-react'

/**
 * آپلودر رسانه پنل — ارسال به /api/admin/media (multipart) و نمایش نتیجه
 * پس از موفقیت، گرید رسانه‌ها با router.refresh() به‌روز می‌شود.
 */
export function MediaUploader() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ url: string; id: string } | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    const form = e.currentTarget
    if (!file) {
      setError('فایل تصویر را انتخاب کنید.')
      return
    }
    setBusy(true)
    setError('')
    setDone(null)
    setCopied(false)

    try {
      const fd = new FormData(form)
      fd.set('file', file)
      const res = await fetch('/api/admin/media', { method: 'POST', body: fd })
      const data = (await res.json()) as { ok?: boolean; url?: string; id?: string; error?: string }
      if (res.ok && data.ok && data.url && data.id) {
        setDone({ url: data.url, id: data.id })
        form.reset()
        router.refresh()
      } else {
        setError(data.error ?? 'آپلود ناموفق بود.')
      }
    } catch {
      setError('خطای شبکه در آپلود.')
    } finally {
      setBusy(false)
    }
  }

  async function copyUrl() {
    if (!done) return
    try {
      await navigator.clipboard.writeText(done.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // دسترسی کلیپ‌بورد رد شد
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-card" style={{ padding: 26 }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>آپلود تصویر جدید</h2>

      <div className="field" style={{ marginBottom: 14 }}>
        <label htmlFor="mu-file">
          فایل تصویر <i>*</i>
        </label>
        <input
          id="mu-file"
          ref={fileRef}
          type="file"
          name="file"
          accept="image/webp,image/png,image/jpeg,image/gif,image/svg+xml"
          className="control"
          style={{ padding: '10px 14px' }}
          required
        />
        <span className="adm-hint">
          حداکثر ۵ مگابایت — PNG/JPEG/GIF به‌صورت خودکار به WebP با کیفیت ۸۲ تبدیل می‌شود؛ SVG و
          WebP دست‌نخورده ذخیره می‌شوند.
        </span>
      </div>

      <div className="field" style={{ marginBottom: 14 }}>
        <label htmlFor="mu-alt">متن جایگزین (Alt)</label>
        <input
          id="mu-alt"
          name="alt"
          className="control"
          maxLength={300}
          placeholder="توضیح کوتاه تصویر برای سئو و دسترس‌پذیری"
        />
      </div>

      {error && (
        <p className="form-err" role="alert" style={{ display: 'block', marginBottom: 12 }}>
          {error}
        </p>
      )}

      {done && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid rgba(88,201,139,.4)',
            background: 'rgba(88,201,139,.08)',
            marginBottom: 12,
          }}
        >
          <Check style={{ width: 16, height: 16, color: 'var(--ok)', flexShrink: 0 }} aria-hidden />
          <code dir="ltr" style={{ fontSize: 11.5, minWidth: 0, overflowWrap: 'anywhere' }}>
            {done.url}
          </code>
          <button type="button" className="adm-btn" onClick={copyUrl}>
            {copied ? (
              'کپی شد ✓'
            ) : (
              <>
                <Copy aria-hidden /> کپی آدرس
              </>
            )}
          </button>
        </div>
      )}

      <button type="submit" className="btn btn-gold btn-sm" disabled={busy}>
        {busy ? (
          <Loader2 style={{ animation: 'spin 1s linear infinite' }} aria-hidden />
        ) : (
          <ImagePlus aria-hidden />
        )}
        {busy ? 'در حال آپلود…' : 'آپلود'}
      </button>
    </form>
  )
}
