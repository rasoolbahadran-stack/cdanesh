'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Loader2, Plus, Save } from 'lucide-react'
import { upsertFaqAction, type FaqFormState } from '@/lib/actions/faq-actions'

export interface FaqPageKeyOption {
  value: string
  label: string
}

export interface FaqEditItem {
  id: string
  pageKey: string
  question: string
  answer: string
  isActive: boolean
  sortOrder: number
}

/**
 * فرم سؤال متداول — هم برای افزودن (item=null) و هم برای ویرایش (item)
 */
export function FaqForm({
  item,
  pageKeys,
  defaultPageKey,
}: {
  item?: FaqEditItem
  pageKeys: FaqPageKeyOption[]
  defaultPageKey?: string
}) {
  const isEdit = Boolean(item)
  const [state, formAction, pending] = useActionState<FaqFormState, FormData>(
    upsertFaqAction,
    {}
  )
  const formRef = useRef<HTMLFormElement>(null)

  // در حالت افزودن، پس از ذخیره موفق فرم را خالی کن
  useEffect(() => {
    if (state.ok && !isEdit) formRef.current?.reset()
  }, [state, isEdit])

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      {isEdit && <input type="hidden" name="id" value={item!.id} />}

      <div className="adm-form-grid">
        <div className="field">
          <label htmlFor={`faq-page-${item?.id ?? 'new'}`}>
            صفحه مقصد <i>*</i>
          </label>
          <select
            id={`faq-page-${item?.id ?? 'new'}`}
            name="pageKey"
            defaultValue={item?.pageKey ?? defaultPageKey ?? 'home'}
            className="control"
            required
          >
            {pageKeys.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`faq-sort-${item?.id ?? 'new'}`}>ترتیب نمایش</label>
          <input
            id={`faq-sort-${item?.id ?? 'new'}`}
            name="sortOrder"
            type="number"
            min={0}
            max={999}
            defaultValue={item?.sortOrder ?? 0}
            className="control"
          />
        </div>
      </div>

      <div className="field field-full">
        <label htmlFor={`faq-q-${item?.id ?? 'new'}`}>
          پرسش <i>*</i>
        </label>
        <input
          id={`faq-q-${item?.id ?? 'new'}`}
          name="question"
          className="control"
          defaultValue={item?.question ?? ''}
          minLength={5}
          maxLength={250}
          required
          placeholder="مثلاً: طراحی سایت چقدر طول می‌کشد؟"
        />
      </div>

      <div className="field field-full">
        <label htmlFor={`faq-a-${item?.id ?? 'new'}`}>
          پاسخ <i>*</i>
        </label>
        <textarea
          id={`faq-a-${item?.id ?? 'new'}`}
          name="answer"
          className="control"
          defaultValue={item?.answer ?? ''}
          minLength={10}
          maxLength={2000}
          required
          rows={4}
          placeholder="پاسخ کامل و صادقانه — بدون وعده غیرواقعی"
        />
      </div>

      <label className="adm-check" style={{ borderBottom: 0 }}>
        <input
          type="checkbox"
          name="isActive"
          value="1"
          defaultChecked={item ? item.isActive : true}
        />
        <span>
          <b>فعال</b>
          <span>فقط سؤال‌های فعال در سایت نمایش داده می‌شوند.</span>
        </span>
      </label>

      {state.ok && (
        <p className="form-ok show" role="status" style={{ marginBottom: 0 }}>
          {isEdit ? 'تغییرات سؤال ذخیره شد.' : 'سؤال جدید اضافه شد.'}
        </p>
      )}
      {state.error && (
        <p className="form-err" role="alert" style={{ display: 'block', margin: 0 }}>
          {state.error}
        </p>
      )}

      <div>
        <button type="submit" className="btn btn-gold btn-sm" disabled={pending}>
          {pending ? (
            <Loader2 style={{ animation: 'spin 1s linear infinite' }} aria-hidden />
          ) : isEdit ? (
            <Save aria-hidden />
          ) : (
            <Plus aria-hidden />
          )}
          {pending ? 'در حال ذخیره…' : isEdit ? 'ذخیره تغییرات' : 'افزودن سؤال'}
        </button>
      </div>
    </form>
  )
}
