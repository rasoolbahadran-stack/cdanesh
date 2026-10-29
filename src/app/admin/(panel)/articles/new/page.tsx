import type { Metadata } from 'next'
import Link from 'next/link'
import { db } from '@/lib/db'
import { ArticleEditor } from '@/components/admin/article-editor'

export const metadata: Metadata = { title: 'مقاله جدید', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function NewArticlePage() {
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true },
  })

  return (
    <>
      <div className="adm-topbar">
        <div>
          <h1>مقاله جدید</h1>
          <p className="lead">پس از ذخیره، به صفحه ویرایش همان مقاله منتقل می‌شوید.</p>
        </div>
        <div className="adm-actions">
          <Link className="btn btn-ghost btn-sm" href="/admin/articles">
            ← فهرست مقالات
          </Link>
        </div>
      </div>

      <ArticleEditor mode="create" categories={categories} />
    </>
  )
}
