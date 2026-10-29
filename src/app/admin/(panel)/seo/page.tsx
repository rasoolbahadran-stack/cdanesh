import type { Metadata } from 'next'
import Link from 'next/link'
import { Compass, SearchCheck } from 'lucide-react'
import { db } from '@/lib/db'
import { getSiteSettings } from '@/lib/settings'
import { toFaDigits } from '@/lib/fa'
import {
  createRedirectAction,
  deleteRedirectAction,
  toggleRedirectAction,
} from '@/lib/actions/seo-actions'
import { RedirectForm } from '@/components/admin/redirect-form'
import { ConfirmButton } from '@/components/admin/confirm-button'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'سئو' }

function Ok({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className="chip"
      style={
        ok
          ? { color: 'var(--ok,#34a853)', borderColor: 'rgba(52,168,83,.4)' }
          : { color: 'var(--err)', borderColor: 'rgba(229,118,106,.4)' }
      }
    >
      {ok ? '✓' : '✗'} {label}
    </span>
  )
}

export default async function AdminSeoPage() {
  const [articles, portfolio, pages, redirects, s] = await Promise.all([
    db.article.findMany({
      select: {
        id: true, slug: true, title: true, status: true, metaTitle: true,
        metaDescription: true, focusKeyword: true, noindex: true, canonicalUrl: true, ogImage: true,
      },
      orderBy: { updatedAt: 'desc' },
    }),
    db.portfolioItem.findMany({
      select: { id: true, slug: true, title: true, metaTitle: true, metaDescription: true },
      orderBy: { sortOrder: 'asc' },
    }),
    db.pageContent.findMany({ orderBy: { key: 'asc' } }),
    db.redirect.findMany({ orderBy: { fromPath: 'asc' } }),
    getSiteSettings(),
  ])

  const published = articles.filter((a) => a.status === 'PUBLISHED')
  const missing = (list: typeof articles, key: 'metaTitle' | 'metaDescription' | 'focusKeyword') =>
    list.filter((a) => !a[key]).length

  const stat = (n: number, okWhenZero = true) => (okWhenZero ? n === 0 : n > 0)

  return (
    <div>
      <div className="adm-topbar">
        <div>
          <h1>مدیریت سئو</h1>
          <p className="lead muted">
            وضعیت متادیتای همهٔ صفحات، ریدایرکت‌ها و نقشهٔ سایت — به سبک ابزارهای سئوی محبوب، متناسب با معماری Next.js.
          </p>
        </div>
      </div>

      {/* ─── خلاصه وضعیت ─── */}
      <div className="adm-grid2" style={{ marginBottom: 20 }}>
        <div className="adm-panel">
          <div className="adm-panel-head"><b>متاهای پیش‌فرض سایت</b></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Ok ok={!!s.defaultMetaTitle} label="عنوان پیش‌فرض" />
            <Ok ok={!!s.defaultMetaDescription} label="توضیحات پیش‌فرض" />
            <Ok ok={!!s.ogImage} label="تصویر OG" />
            <span className="chip">حالت قیمت‌گذاری: {s.pricingMode === 'final' ? 'نهایی' : 'برآوردی'}</span>
          </div>
          <p className="adm-hint" style={{ margin: '10px 0 0' }}>
            ویرایش پیش‌فرض‌ها در <Link href="/admin/settings" style={{ color: 'var(--gold)' }}>تنظیمات</Link>.
          </p>
        </div>
        <div className="adm-panel">
          <div className="adm-panel-head"><b>فنی</b></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <a className="chip" href="/sitemap.xml" target="_blank" rel="noreferrer">نقشهٔ سایت ↗</a>
            <a className="chip" href="/robots.txt" target="_blank" rel="noreferrer">robots.txt ↗</a>
            <span className="chip">Structured Data: خودکار (JSON-LD)</span>
            <span className="chip">Breadcrumb: خودکار</span>
          </div>
          <p className="adm-hint" style={{ margin: '10px 0 0' }}>
            نقشهٔ سایت و robots به‌صورت خودکار از محتوای منتشرشده ساخته می‌شوند؛ صفحات پنل همیشه noindex هستند.
          </p>
        </div>
      </div>

      {/* ─── مقاله‌ها ─── */}
      <section className="adm-panel" style={{ marginBottom: 20 }}>
        <div className="adm-panel-head">
          <b>وضعیت سئوی مقاله‌ها</b>
          <span className="chip">{toFaDigits(published.length)} منتشرشده از {toFaDigits(articles.length)}</span>
        </div>
        <div className="adm-hint" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 12 }}>
          <span>بدون عنوان سئو: <b>{toFaDigits(missing(articles, 'metaTitle'))}</b></span>
          <span>بدون توضیحات متا: <b>{toFaDigits(missing(articles, 'metaDescription'))}</b></span>
          <span>بدون کلمهٔ کلیدی هدف: <b>{toFaDigits(missing(articles, 'focusKeyword'))}</b></span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="adm-table" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th>مقاله</th>
                <th>عنوان سئو</th>
                <th>توضیحات متا</th>
                <th>کلیدواژه</th>
                <th>Canonical</th>
                <th>Index</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link href={`/admin/articles/${a.id}`} style={{ fontWeight: 700 }}>{a.title}</Link>
                    <div className="muted small" dir="ltr" style={{ textAlign: 'left' }}>/{a.slug}</div>
                  </td>
                  <td><Ok ok={!!a.metaTitle} label={a.metaTitle ? `${a.metaTitle.length} نویسه` : 'ناموجود'} /></td>
                  <td><Ok ok={!!a.metaDescription} label={a.metaDescription ? `${a.metaDescription.length} نویسه` : 'ناموجود'} /></td>
                  <td><Ok ok={!!a.focusKeyword} label={a.focusKeyword ?? 'ناموجود'} /></td>
                  <td><Ok ok={!a.canonicalUrl} label={a.canonicalUrl ? 'سفارشی' : 'خودکار'} /></td>
                  <td>
                    {a.noindex ? (
                      <span className="chip" style={{ color: '#ca8a04', borderColor: 'rgba(234,179,8,.5)' }}>noindex</span>
                    ) : (
                      <span className="chip" style={{ color: 'var(--ok,#34a853)', borderColor: 'rgba(52,168,83,.4)' }}>index</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── نمونه‌کارها و صفحات ثابت ─── */}
      <div className="adm-grid2" style={{ marginBottom: 20 }}>
        <section className="adm-panel">
          <div className="adm-panel-head"><b>متادیتای نمونه‌کارها</b></div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
            {portfolio.map((p) => (
              <li key={p.id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
                <b style={{ fontSize: 13 }}>{p.title}</b>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  <Ok ok={!!p.metaTitle} label="عنوان" />
                  <Ok ok={!!p.metaDescription} label="توضیحات" />
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="adm-panel">
          <div className="adm-panel-head"><b>متادیتای صفحات ثابت (درباره/حریم/قوانین)</b></div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
            {pages.map((p) => (
              <li key={p.id} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
                <b style={{ fontSize: 13 }}>{p.title}</b>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  <Ok ok={!!p.metaTitle} label="عنوان" />
                  <Ok ok={!!p.metaDescription} label="توضیحات" />
                </div>
              </li>
            ))}
          </ul>
          <p className="adm-hint" style={{ margin: '12px 0 0' }}>
            صفحات خدمات و صفحه اصلی متای خودکار از تنظیمات می‌گیرند.
          </p>
        </section>
      </div>

      {/* ─── ریدایرکت‌ها ─── */}
      <section className="adm-panel">
        <div className="adm-panel-head">
          <b><Compass className="inline align-[-3px] me-1.5" style={{ width: 16, height: 16 }} aria-hidden /> مدیریت ریدایرکت‌ها</b>
          <span className="chip">{toFaDigits(redirects.length)} ریدایرکت</span>
        </div>
        <div style={{ padding: 18 }}>
          <RedirectForm action={createRedirectAction} />

          {redirects.length > 0 && (
            <div style={{ overflowX: 'auto', marginTop: 16 }}>
              <table className="adm-table" style={{ minWidth: 620 }}>
                <thead>
                  <tr>
                    <th>مبدأ</th>
                    <th>مقصد</th>
                    <th>کد</th>
                    <th>وضعیت</th>
                    <th> </th>
                  </tr>
                </thead>
                <tbody>
                  {redirects.map((r) => (
                    <tr key={r.id}>
                      <td dir="ltr" style={{ textAlign: 'left' }}>{r.fromPath}</td>
                      <td dir="ltr" style={{ textAlign: 'left' }}>{r.toPath}</td>
                      <td>{r.statusCode}</td>
                      <td>
                        {r.isActive ? (
                          <span className="chip" style={{ color: 'var(--ok,#34a853)', borderColor: 'rgba(52,168,83,.4)' }}>فعال</span>
                        ) : (
                          <span className="chip" style={{ color: 'var(--err)', borderColor: 'rgba(229,118,106,.4)' }}>غیرفعال</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <form action={toggleRedirectAction}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="next" value={r.isActive ? '0' : '1'} />
                            <button type="submit" className="adm-btn">{r.isActive ? 'غیرفعال' : 'فعال'}</button>
                          </form>
                          <form action={deleteRedirectAction}>
                            <input type="hidden" name="id" value={r.id} />
                            <ConfirmButton label="حذف" message={`ریدایرکت «${r.fromPath}» حذف شود؟`} />
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="adm-hint" style={{ margin: '14px 0 0', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <SearchCheck style={{ width: 15, height: 15, flexShrink: 0, marginTop: 2 }} aria-hidden />
            <span>
              ریدایرکت‌ها سمت سرور با میدل‌ور اعمال می‌شوند (حداکثر ۶۰ ثانیه پس از ذخیره). فیلد «کلمهٔ کلیدی هدف» هر مقاله
              فقط برای مدیریت استراتژی محتواست — تگ‌های keywords تأثیری در رتبه گوگل ندارند و چنین ادعایی هم نمی‌کنیم.
            </span>
          </p>
        </div>
      </section>
    </div>
  )
}
