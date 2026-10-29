import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import { publishDueScheduledArticles } from '@/lib/articles'
import { deleteArticleAction, setArticleStatusAction } from '@/lib/actions/article-actions'
import { faNumber, jalaliDateShort, STATUS_LABELS } from '@/lib/fa'
import { ConfirmButton } from '@/components/admin/confirm-button'
import { StatusChip } from '@/components/admin/status-chip'

export const metadata: Metadata = { title: 'مقالات' }
export const dynamic = 'force-dynamic'

const PER_PAGE = 15
const STATUSES = ['PUBLISHED', 'DRAFT', 'SCHEDULED'] as const

type ArticleStatus = (typeof STATUSES)[number]

function buildUrl(params: { q?: string; status?: string; cat?: string; page: number }) {
  const sp = new URLSearchParams()
  if (params.q) sp.set('q', params.q)
  if (params.status) sp.set('status', params.status)
  if (params.cat) sp.set('cat', params.cat)
  sp.set('page', String(params.page))
  return `/admin/articles?${sp.toString()}`
}

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; cat?: string; page?: string }>
}) {
  await publishDueScheduledArticles()

  const { q, status, cat, page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const validStatus: ArticleStatus | undefined = STATUSES.includes(status as ArticleStatus)
    ? (status as ArticleStatus)
    : undefined
  const query = (q ?? '').trim()
  const categoryId = (cat ?? '').trim() || undefined

  const where = {
    ...(query ? { OR: [{ title: { contains: query } }, { slug: { contains: query } }] } : {}),
    ...(validStatus ? { status: validStatus } : {}),
    ...(categoryId ? { categoryId } : {}),
  }

  const [articles, total, categories] = await Promise.all([
    db.article.findMany({
      where,
      include: { category: { select: { name: true } }, author: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    db.article.count({ where }),
    db.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], select: { id: true, name: true } }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const hasQuery = Boolean(query || validStatus || categoryId)

  return (
    <>
      <div className="adm-topbar">
        <div>
          <h1>مقالات</h1>
          <p className="lead">
            {hasQuery ? `${faNumber(total)} نتیجه یافت شد` : `مجموع: ${faNumber(total)} مقاله`}
          </p>
        </div>
        <div className="adm-actions">
          <Link className="btn btn-gold btn-sm" href="/admin/articles/new">
            + مقاله جدید
          </Link>
        </div>
      </div>

      <div className="adm-panel">
        <div className="adm-toolbar">
          <form method="get" action="/admin/articles" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {validStatus ? <input type="hidden" name="status" value={validStatus} /> : null}
            {categoryId ? <input type="hidden" name="cat" value={categoryId} /> : null}
            <input
              className="control"
              type="search"
              name="q"
              defaultValue={query}
              placeholder="جست‌وجو در عنوان یا اسلاگ…"
              aria-label="جست‌وجوی مقاله"
            />
            <button className="btn btn-ghost btn-sm" type="submit">
              جست‌وجو
            </button>
          </form>
          <form method="get" action="/admin/articles" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {query ? <input type="hidden" name="q" value={query} /> : null}
            {validStatus ? <input type="hidden" name="status" value={validStatus} /> : null}
            <select className="control" name="cat" defaultValue={categoryId ?? ''} aria-label="فیلتر دسته‌بندی">
              <option value="">همه دسته‌ها</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button className="btn btn-ghost btn-sm" type="submit">
              اعمال
            </button>
          </form>
        </div>

        <div className="adm-toolbar" style={{ marginBottom: 6 }}>
          <Link className="chip" href={buildUrl({ q: query, cat: categoryId, page: 1 })}>
            همه
          </Link>
          {STATUSES.map((s) => (
            <Link
              key={s}
              className={validStatus === s ? 'chip chip-gold' : 'chip'}
              href={buildUrl({ q: query, status: s, cat: categoryId, page: 1 })}
            >
              {STATUS_LABELS[s]}
            </Link>
          ))}
        </div>

        {articles.length === 0 ? (
          <div className="adm-empty">
            {hasQuery ? 'نتیجه‌ای برای این جست‌وجو یافت نشد.' : 'هنوز مقاله‌ای ثبت نشده است.'}
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>عنوان</th>
                  <th>دسته</th>
                  <th>نویسنده</th>
                  <th>وضعیت</th>
                  <th>تاریخ</th>
                  <th>بازدید</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600, minWidth: 220 }}>
                      <Link href={`/admin/articles/${a.id}`} style={{ color: 'var(--txt)' }}>
                        {a.title}
                      </Link>
                      <span className="muted" dir="ltr" style={{ display: 'block', fontSize: 11.5, marginTop: 3 }}>
                        /{a.slug}
                      </span>
                    </td>
                    <td className="muted">{a.category?.name ?? '—'}</td>
                    <td className="muted">{a.author.name}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <StatusChip status={a.status} />
                      {a.status === 'SCHEDULED' && a.scheduledAt ? (
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--faint)', marginTop: 3 }}>
                          {jalaliDateShort(a.scheduledAt)}
                        </span>
                      ) : null}
                    </td>
                    <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                      {jalaliDateShort(a.publishedAt ?? a.updatedAt)}
                    </td>
                    <td className="muted">{faNumber(a.views)}</td>
                    <td>
                      <div className="row-actions">
                        <Link className="adm-btn primary" href={`/admin/articles/${a.id}`}>
                          ویرایش
                        </Link>
                        {a.status === 'PUBLISHED' ? (
                          <form action={setArticleStatusAction}>
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="status" value="DRAFT" />
                            <button className="adm-btn" type="submit">
                              لغو انتشار
                            </button>
                          </form>
                        ) : (
                          <form action={setArticleStatusAction}>
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="status" value="PUBLISHED" />
                            <button className="adm-btn" type="submit">
                              انتشار
                            </button>
                          </form>
                        )}
                        <form action={deleteArticleAction}>
                          <input type="hidden" name="id" value={a.id} />
                          <ConfirmButton label="حذف" message={`مقاله «${a.title}» حذف شود؟`} />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <nav className="pagination" aria-label="صفحه‌بندی">
          {page > 1 ? (
            <Link href={buildUrl({ q: query, status: validStatus, cat: categoryId, page: page - 1 })}>
              قبلی
            </Link>
          ) : (
            <span className="page-disabled">قبلی</span>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) =>
            p === page ? (
              <span key={p} className="page-current">
                {faNumber(p)}
              </span>
            ) : (
              <Link key={p} href={buildUrl({ q: query, status: validStatus, cat: categoryId, page: p })}>
                {faNumber(p)}
              </Link>
            )
          )}
          {page < totalPages ? (
            <Link href={buildUrl({ q: query, status: validStatus, cat: categoryId, page: page + 1 })}>
              بعدی
            </Link>
          ) : (
            <span className="page-disabled">بعدی</span>
          )}
        </nav>
      ) : null}
    </>
  )
}
