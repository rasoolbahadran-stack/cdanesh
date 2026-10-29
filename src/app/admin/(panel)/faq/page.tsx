import type { Metadata } from 'next'
import { HelpCircle } from 'lucide-react'
import { db } from '@/lib/db'
import { getSessionUser, hasRole } from '@/lib/auth'
import { deleteFaqAction, toggleFaqAction } from '@/lib/actions/faq-actions'
import { FaqForm, type FaqPageKeyOption } from '@/components/admin/faq-form'
import { ConfirmButton } from '@/components/admin/confirm-button'
import { toFaDigits } from '@/lib/fa'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'سؤالات متداول' }

/** عناوین فارسی گروه‌های سؤال بر اساس pageKey */
const PAGE_TITLES: Record<string, string> = {
  home: 'پرسش‌های عمومی',
  'web-design': 'طراحی سایت',
  seo: 'سئو',
  'content-production': 'تولید محتوا',
  'ai-solutions': 'هوش مصنوعی و اتوماسیون',
  'speed-optimization': 'بهینه‌سازی سرعت',
  uiux: 'طراحی UI/UX',
  'e-commerce': 'فروشگاه اینترنتی',
  support: 'پشتیبانی و نگهداری',
  services: 'همکاری و سفارش',
  request: 'ثبت درخواست',
  contact: 'تماس',
}

const PAGE_ORDER = Object.keys(PAGE_TITLES)

export default async function AdminFaqPage() {
  const user = await getSessionUser()
  const canEdit = hasRole(user, 'EDITOR')

  const rows = await db.faq.findMany({
    orderBy: [{ pageKey: 'asc' }, { sortOrder: 'asc' }],
  })

  // گروه‌بندی بر اساس pageKey با ترتیب مشخص
  const groups = new Map<string, typeof rows>()
  for (const r of rows) {
    const list = groups.get(r.pageKey) ?? []
    list.push(r)
    groups.set(r.pageKey, list)
  }
  const keys = [...groups.keys()].sort((a, b) => {
    const ai = PAGE_ORDER.indexOf(a)
    const bi = PAGE_ORDER.indexOf(b)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    // کلیدهای ناشناخته (شامل مقاله‌ها) در انتها، الفبایی
    return a.localeCompare(b)
  })

  const pageKeyOptions: FaqPageKeyOption[] = PAGE_ORDER.map((k) => ({
    value: k,
    label: PAGE_TITLES[k],
  }))

  const groupTitle = (key: string) =>
    PAGE_TITLES[key] ?? (key.startsWith('article:') ? `مقاله: ${key.slice('article:'.length)}` : key)

  return (
    <div>
      <div className="adm-topbar">
        <div>
          <h1>سؤالات متداول</h1>
          <p className="lead muted">
            {toFaDigits(rows.length)} سؤال ثبت‌شده — سؤال‌های فعال در صفحات عمومی سایت نمایش داده می‌شوند.
          </p>
        </div>
      </div>

      {canEdit && (
        <div className="adm-grid2" style={{ marginBottom: 22 }}>
          <div className="form-card" style={{ padding: 26 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 18 }}>افزودن سؤال جدید</h2>
            <FaqForm pageKeys={pageKeyOptions} />
          </div>
          <div className="adm-panel">
            <div className="adm-panel-head">
              <b>راهنمای گروه‌ها</b>
            </div>
            <p className="adm-hint" style={{ margin: 0, fontSize: 13 }}>
              هر سؤال با «صفحه مقصد» به یکی از صفحات سایت وصل می‌شود و پایین همان صفحه نمایش داده
              می‌شود. سؤال‌های مربوط به مقالات وبلاگ هنگام ویرایش مقاله ساخته می‌شوند و از این‌جا فقط
              قابل مشاهده‌اند (خواندنی).
            </p>
            <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
              {keys.length === 0 ? (
                <p className="muted small">هنوز گروهی وجود ندارد.</p>
              ) : (
                keys.map((k) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="chip">{groupTitle(k)}</span>
                    <span className="adm-badge-count">{toFaDigits(groups.get(k)!.length)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {rows.length === 0 && (
        <div className="adm-panel">
          <div className="adm-empty">
            <HelpCircle style={{ width: 34, height: 34, margin: '0 auto 10px', opacity: 0.4 }} aria-hidden />
            هنوز سؤالی ثبت نشده است؛ اولین سؤال را از فرم بالا اضافه کنید.
          </div>
        </div>
      )}

      {keys.map((key) => {
        const list = groups.get(key)!
        const isArticleKey = key.startsWith('article:')
        return (
          <section key={key} className="adm-panel" style={{ marginBottom: 18 }}>
            <div className="adm-panel-head">
              <b>{groupTitle(key)}</b>
              <span className="chip">{toFaDigits(list.length)} سؤال</span>
            </div>

            {isArticleKey ? (
              <ul style={{ display: 'grid', gap: 10, margin: 0, padding: 0, listStyle: 'none' }}>
                {list.map((r) => (
                  <li key={r.id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
                    <b style={{ fontSize: 13.5 }}>{r.question}</b>
                    <p className="muted small" style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>
                      {r.answer}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {list.map((r) => (
                  <details key={r.id} className="faq-item" style={{ background: 'rgba(255,255,255,.02)' }}>
                    <summary>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        {r.question}
                        {!r.isActive && (
                          <span
                            className="chip"
                            style={{ color: 'var(--err)', borderColor: 'rgba(229,118,106,.4)' }}
                          >
                            غیرفعال
                          </span>
                        )}
                      </span>
                      <span className="fx" aria-hidden />
                    </summary>
                    {canEdit ? (
                      <div style={{ padding: '0 24px 22px' }}>
                        <FaqForm
                          item={{
                            id: r.id,
                            pageKey: r.pageKey,
                            question: r.question,
                            answer: r.answer,
                            isActive: r.isActive,
                            sortOrder: r.sortOrder,
                          }}
                          pageKeys={pageKeyOptions}
                        />
                        <div className="row-actions" style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                          <form action={toggleFaqAction}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="isActive" value={r.isActive ? '0' : '1'} />
                            <button type="submit" className="adm-btn">
                              {r.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                            </button>
                          </form>
                          <form action={deleteFaqAction}>
                            <input type="hidden" name="id" value={r.id} />
                            <ConfirmButton
                              label="حذف"
                              message={`این سؤال حذف شود؟ «${r.question.slice(0, 60)}»`}
                            />
                          </form>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '0 24px 22px' }}>
                        <p className="muted small" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                          {r.answer}
                        </p>
                      </div>
                    )}
                  </details>
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
