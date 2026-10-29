'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import {
  createArticleAction,
  updateArticleAction,
  type ArticleFormState,
} from '@/lib/actions/article-actions'
import { parseSource, slugifyFa, type Block } from '@/lib/blocks'
import { STATUS_LABELS } from '@/lib/fa'

export interface EditorArticle {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  status: string
  categoryId: string | null
  tagNames: string[]
  coverImage: string | null
  coverAlt: string | null
  scheduledAt: string | null
  metaTitle: string | null
  metaDescription: string | null
  canonicalUrl: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogImage: string | null
  noindex: boolean
  relatedSlugs: string[]
  focusKeyword: string | null
}

const initialState: ArticleFormState = {}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <span role="alert" style={{ color: 'var(--err)', fontSize: 12 }}>
      {msg}
    </span>
  )
}

function renderPreviewBlock(b: Block, i: number) {
  if ('p' in b) return <p key={i} style={{ margin: '0 0 12px', lineHeight: 2.1 }}>{b.p}</p>
  if ('h2' in b)
    return (
      <h2 key={i} style={{ fontSize: 17, fontWeight: 800, margin: '20px 0 10px' }}>
        {b.h2}
      </h2>
    )
  if ('h3' in b)
    return (
      <h3 key={i} style={{ fontSize: 15, fontWeight: 700, margin: '16px 0 8px' }}>
        {b.h3}
      </h3>
    )
  if ('ul' in b)
    return (
      <ul key={i} style={{ margin: '0 0 12px', paddingRight: 22, lineHeight: 2.1 }}>
        {b.ul.map((li, n) => (
          <li key={n}>{li}</li>
        ))}
      </ul>
    )
  if ('ol' in b)
    return (
      <ol key={i} style={{ margin: '0 0 12px', paddingRight: 22, lineHeight: 2.1 }}>
        {b.ol.map((li, n) => (
          <li key={n}>{li}</li>
        ))}
      </ol>
    )
  if ('img' in b)
    return (
      <figure key={i} style={{ margin: '0 0 14px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.img.src} alt={b.img.alt} style={{ maxWidth: '100%', borderRadius: 12 }} />
        {b.img.cap ? (
          <figcaption style={{ fontSize: 12, color: 'var(--faint)', marginTop: 6 }}>{b.img.cap}</figcaption>
        ) : null}
      </figure>
    )
  if ('quote' in b)
    return (
      <blockquote
        key={i}
        style={{
          borderInlineStart: '3px solid var(--gold)',
          background: 'var(--gold-soft)',
          padding: '12px 16px',
          borderRadius: 10,
          margin: '0 0 12px',
          lineHeight: 2.1,
        }}
      >
        {b.quote}
      </blockquote>
    )
  return (
    <p key={i} style={{ margin: '0 0 12px', lineHeight: 2.1 }}>
      {b.cta.pre ? `${b.cta.pre} ` : ''}
      <a href={b.cta.link} style={{ color: 'var(--gold)', fontWeight: 700 }}>
        {b.cta.label}
      </a>
      {b.cta.post ? ` ${b.cta.post}` : ''}
    </p>
  )
}

export function ArticleEditor({
  mode,
  categories,
  article,
}: {
  mode: 'create' | 'edit'
  categories: { id: string; name: string }[]
  article?: EditorArticle
}) {
  const router = useRouter()
  const action = mode === 'create' ? createArticleAction : updateArticleAction
  const [state, formAction, pending] = useActionState(action, initialState)

  const [title, setTitle] = useState(article?.title ?? '')
  const [slug, setSlug] = useState(article?.slug ?? '')
  const [content, setContent] = useState(article?.content ?? '')
  const [status, setStatus] = useState(article?.status ?? 'DRAFT')
  const [coverImage, setCoverImage] = useState(article?.coverImage ?? '')
  const [metaTitle, setMetaTitle] = useState(article?.metaTitle ?? '')
  const [metaDescription, setMetaDescription] = useState(article?.metaDescription ?? '')
  const [showPreview, setShowPreview] = useState(false)

  const formRef = useRef<HTMLFormElement>(null)
  const statusRef = useRef<HTMLSelectElement>(null)

  const readMinutes = useMemo(() => {
    const words = content
      .replace(/[#*_>`~\[\]()\-!]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.trim().length > 1).length
    return Math.max(1, Math.round(words / 200))
  }, [content])

  const previewBlocks = useMemo(() => (showPreview ? parseSource(content) : []), [showPreview, content])

  // پس از ایجاد موفق، به صفحه ویرایش همان مقاله می‌رویم
  useEffect(() => {
    if (state.ok && mode === 'create' && state.articleId) {
      router.push(`/admin/articles/${state.articleId}`)
      router.refresh()
    }
  }, [state, mode, router])

  const fe = (key: string) => state.fieldErrors?.[key]

  const generateSlug = () => setSlug(slugifyFa(title))

  const saveAndPublish = () => {
    const sel = statusRef.current
    if (sel) sel.value = 'PUBLISHED'
    setStatus('PUBLISHED')
    formRef.current?.requestSubmit()
  }

  return (
    <form ref={formRef} action={formAction} id="article-form">
      {mode === 'edit' && article ? <input type="hidden" name="id" value={article.id} /> : null}

      {state.error ? (
        <div
          role="alert"
          className="form-ok show"
          style={{
            background: 'rgba(229, 118, 106, .1)',
            borderColor: 'rgba(229, 118, 106, .4)',
            color: 'var(--err)',
            display: 'flex',
            marginBottom: 18,
          }}
        >
          <span>{state.error}</span>
        </div>
      ) : null}

      {state.ok && mode === 'edit' ? (
        <div
          role="status"
          className="form-ok show"
          style={{ display: 'flex', marginBottom: 18 }}
        >
          <span>ذخیره شد.</span>
        </div>
      ) : null}

      <div className="adm-grid2">
        {/* ─── ستون اصلی ─────────────────────────────── */}
        <div className="adm-panel">
          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="f-title">
              عنوان مقاله <i>*</i>
            </label>
            <input
              id="f-title"
              className="control"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: راهنمای کامل سئوی سایت فروشگاهی"
              required
            />
            <FieldError msg={fe('title')} />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="f-slug">
              اسلاگ <i>*</i>
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                id="f-slug"
                className="control"
                name="slug"
                dir="ltr"
                style={{ textAlign: 'left', flex: 1, minWidth: 220 }}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ecommerce-seo-guide"
                required
              />
              <button className="btn btn-ghost btn-sm" type="button" onClick={generateSlug}>
                تولید از عنوان
              </button>
            </div>
            <span className="adm-hint">در آدرس مقاله استفاده می‌شود؛ حروف لاتین، عدد و خط تیره.</span>
            <FieldError msg={fe('slug')} />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label htmlFor="f-excerpt">خلاصه</label>
            <textarea
              id="f-excerpt"
              className="control"
              name="excerpt"
              rows={3}
              defaultValue={article?.excerpt ?? ''}
              placeholder="یک یا دو جمله معرفی برای نمایش در فهرست وبلاگ"
            />
            <FieldError msg={fe('excerpt')} />
          </div>

          <div className="adm-form-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label htmlFor="f-category">دسته‌بندی</label>
              <select id="f-category" className="control" name="categoryId" defaultValue={article?.categoryId ?? ''}>
                <option value="">بدون دسته</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="f-tags">برچسب‌ها</label>
              <input
                id="f-tags"
                className="control"
                name="tagNames"
                defaultValue={article?.tagNames.join('،') ?? ''}
                placeholder="سئو، تولید محتوا"
              />
              <span className="adm-hint">برچسب‌ها را با «،» جدا کنید (حداکثر ۸ برچسب).</span>
              <FieldError msg={fe('tagNames')} />
            </div>
          </div>

          <div className="field" style={{ marginBottom: 8 }}>
            <label htmlFor="f-content">
              محتوای مقاله <i>*</i>
            </label>
            <textarea
              id="f-content"
              className="control"
              name="content"
              rows={18}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="متن مقاله را خط به خط وارد کنید…"
              required
              style={{ minHeight: 380, lineHeight: 2.1 }}
            />
            <span className="adm-hint">
              راهنمای قالب: <b dir="ltr">## تیتر دوم</b>، <b dir="ltr">### تیتر سوم</b>،{' '}
              <b dir="ltr">- لیست</b>، <b dir="ltr">1. لیست شماره‌دار</b>، <b dir="ltr">{'> نقل‌قول'}</b>،{' '}
              <b dir="ltr">[img] src | alt | توضیح</b>، <b dir="ltr">[cta] متن قبل | برچسب | لینک | متن بعد</b>
            </span>
            <FieldError msg={fe('content')} />
          </div>

          <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? 'بستن پیش‌نمایش' : 'پیش‌نمایش زنده'}
          </button>
          {showPreview ? (
            <div className="adm-preview" style={{ marginTop: 12 }}>
              {previewBlocks.length === 0 ? (
                <span className="muted small">متنی برای پیش‌نمایش نیست.</span>
              ) : (
                previewBlocks.map(renderPreviewBlock)
              )}
            </div>
          ) : null}
        </div>

        {/* ─── ستون کنار (چسبان) ──────────────────────── */}
        <div style={{ alignSelf: 'start', position: 'sticky', top: 20 }}>
          <div className="adm-panel">
            <div className="field" style={{ marginBottom: 14 }}>
              <label htmlFor="f-status">وضعیت</label>
              <select
                id="f-status"
                ref={statusRef}
                className="control"
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="DRAFT">{STATUS_LABELS.DRAFT}</option>
                <option value="PUBLISHED">{STATUS_LABELS.PUBLISHED}</option>
                <option value="SCHEDULED">{STATUS_LABELS.SCHEDULED}</option>
              </select>
            </div>

            {status === 'SCHEDULED' ? (
              <div className="field" style={{ marginBottom: 14 }}>
                <label htmlFor="f-scheduled">زمان انتشار</label>
                <input
                  id="f-scheduled"
                  className="control"
                  type="datetime-local"
                  name="scheduledAt"
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                  defaultValue={toLocalInput(article?.scheduledAt)}
                />
                <span className="adm-hint">زمان‌بندی با دقت دقیقه اجرا می‌شود.</span>
                <FieldError msg={fe('scheduledAt')} />
              </div>
            ) : null}

            <div className="field" style={{ marginBottom: 14 }}>
              <label htmlFor="f-cover">تصویر شاخص</label>
              <input
                id="f-cover"
                className="control"
                name="coverImage"
                dir="ltr"
                style={{ textAlign: 'left' }}
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="/img/cover-blog.webp"
              />
              <span className="adm-hint">از بخش رسانه‌ها آدرس تصویر را کپی کنید.</span>
              {coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverImage}
                  alt="پیش‌نمایش تصویر شاخص"
                  style={{
                    width: '100%',
                    height: 120,
                    objectFit: 'cover',
                    borderRadius: 12,
                    marginTop: 8,
                    border: '1px solid var(--line)',
                  }}
                />
              ) : null}
              <FieldError msg={fe('coverImage')} />
            </div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label htmlFor="f-cover-alt">Alt تصویر شاخص</label>
              <input
                id="f-cover-alt"
                className="control"
                name="coverAlt"
                defaultValue={article?.coverAlt ?? ''}
                placeholder="توصیف متن‌جا تصویر"
              />
            </div>

            <div className="field" style={{ marginBottom: 16 }}>
              <label>زمان مطالعه (تخمینی)</label>
              <span className="chip chip-gold">{readMinutes} دقیقه</span>
              <span className="adm-hint">بر پایه ۲۰۰ واژه در دقیقه؛ هنگام ذخیره در دیتابیس ثبت می‌شود.</span>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <button className="btn btn-gold btn-block" type="submit" disabled={pending}>
                {pending ? 'در حال ذخیره…' : 'ذخیره'}
              </button>
              <button className="btn btn-ghost btn-block" type="button" onClick={saveAndPublish} disabled={pending}>
                ذخیره و انتشار
              </button>
              <Link className="btn btn-ghost btn-block" href="/admin/articles">
                انصراف و بازگشت
              </Link>
            </div>
          </div>

          {/* ─── سئو ─────────────────────────────────── */}
          <details className="adm-panel" style={{ marginTop: 14 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>سئو و اشتراک‌گذاری</summary>
            <div style={{ marginTop: 14 }}>
              <div className="field" style={{ marginBottom: 14 }}>
                <label htmlFor="f-meta-title">
                  عنوان سئو <span className="muted" style={{ fontWeight: 400 }}>(حداکثر ۷۰)</span>
                </label>
                <input
                  id="f-meta-title"
                  className="control"
                  name="metaTitle"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  maxLength={200}
                />
                <span
                  className="adm-hint"
                  style={{ color: metaTitle.length > 70 ? 'var(--err)' : 'var(--faint)' }}
                  dir="ltr"
                >
                  {metaTitle.length} / 70
                </span>
              </div>

              <div className="field" style={{ marginBottom: 14 }}>
                <label htmlFor="f-meta-desc">
                  توضیحات متا <span className="muted" style={{ fontWeight: 400 }}>(حداکثر ۱۷۰)</span>
                </label>
                <textarea
                  id="f-meta-desc"
                  className="control"
                  name="metaDescription"
                  rows={3}
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  maxLength={400}
                />
                <span
                  className="adm-hint"
                  style={{ color: metaDescription.length > 170 ? 'var(--err)' : 'var(--faint)' }}
                  dir="ltr"
                >
                  {metaDescription.length} / 170
                </span>
              </div>

              <div className="field" style={{ marginBottom: 14 }}>
                <label htmlFor="f-keyword">کلمه کلیدی هدف</label>
                <input
                  id="f-keyword"
                  className="control"
                  name="focusKeyword"
                  defaultValue={article?.focusKeyword ?? ''}
                  placeholder="سئوی فروشگاه اینترنتی"
                />
              </div>

              <div className="field" style={{ marginBottom: 14 }}>
                <label htmlFor="f-canonical">Canonical URL</label>
                <input
                  id="f-canonical"
                  className="control"
                  name="canonicalUrl"
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                  defaultValue={article?.canonicalUrl ?? ''}
                  placeholder="https://www.cdanesh.ir/blog/…"
                />
              </div>

              <div className="field" style={{ marginBottom: 14 }}>
                <label htmlFor="f-og-title">OG Title</label>
                <input
                  id="f-og-title"
                  className="control"
                  name="ogTitle"
                  defaultValue={article?.ogTitle ?? ''}
                />
              </div>

              <div className="field" style={{ marginBottom: 14 }}>
                <label htmlFor="f-og-desc">OG Description</label>
                <textarea
                  id="f-og-desc"
                  className="control"
                  name="ogDescription"
                  rows={2}
                  defaultValue={article?.ogDescription ?? ''}
                />
              </div>

              <div className="field" style={{ marginBottom: 14 }}>
                <label htmlFor="f-og-image">OG Image</label>
                <input
                  id="f-og-image"
                  className="control"
                  name="ogImage"
                  dir="ltr"
                  style={{ textAlign: 'left' }}
                  defaultValue={article?.ogImage ?? ''}
                  placeholder="/img/og-default.jpg"
                />
              </div>

              <label className="adm-check" htmlFor="f-noindex">
                <input
                  id="f-noindex"
                  type="checkbox"
                  name="noindex"
                  value="1"
                  defaultChecked={article?.noindex ?? false}
                />
                <span>
                  <b>noindex — از نتایج جست‌وجو حذف شود</b>
                </span>
              </label>

              <div className="field" style={{ marginTop: 14 }}>
                <label htmlFor="f-related">مقالات مرتبط</label>
                <input
                  id="f-related"
                  className="control"
                  name="relatedSlugs"
                  defaultValue={article?.relatedSlugs.join('،') ?? ''}
                  placeholder="slug-one، slug-two"
                />
                <span className="adm-hint">اسلاگ مقالات را با «،» جدا کنید (حداکثر ۵).</span>
                <FieldError msg={fe('relatedSlugs')} />
              </div>
            </div>
          </details>
        </div>
      </div>
    </form>
  )
}
