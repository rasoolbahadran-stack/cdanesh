import { StructuredData } from '@/components/site/structured-data'

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
}: {
  eyebrow?: string
  title: string
  description?: string
  align?: 'center' | 'start'
}) {
  return (
    <div className={align === 'center' ? 'mx-auto mb-12 max-w-2xl text-center' : 'mb-10 max-w-2xl'}>
      {eyebrow && (
        <span className="mb-3 inline-block rounded-full bg-brand/8 px-4 py-1.5 text-xs font-semibold text-brand">
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl font-extrabold leading-snug text-slate-900 sm:text-3xl">{title}</h2>
      {description && <p className="mt-4 text-[15px] leading-8 text-slate-600">{description}</p>}
    </div>
  )
}

// ─── بنر CTA پایین صفحات ────────────────────────────────────────

import Link from 'next/link'

export function CtaBanner({
  title,
  description,
  primaryLabel = 'درخواست مشاوره',
  primaryHref = '/request',
  secondaryLabel,
  secondaryHref,
}: {
  title: string
  description: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
}) {
  return (
    <section className="section-container pb-16" aria-labelledby="cta-heading">
      <div className="brand-gradient relative overflow-hidden rounded-3xl px-6 py-12 text-center text-white sm:px-12 sm:py-16">
        <div
          className="pointer-events-none absolute -top-24 -start-24 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-24 -end-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div className="relative">
          <h2 id="cta-heading" className="text-2xl font-extrabold sm:text-3xl">
            {title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-8 text-white/90">{description}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={primaryHref}
              className="w-full rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-brand shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl focus-ring sm:w-auto"
            >
              {primaryLabel}
            </Link>
            {secondaryLabel && secondaryHref && (
              <Link
                href={secondaryHref}
                className="w-full rounded-xl border-2 border-white/70 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10 focus-ring sm:w-auto"
              >
                {secondaryLabel}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── آکاردئون پرسش‌های متداول + داده ساختاریافته ─────────────────

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export interface FaqItem {
  question: string
  answer: string
}

export function FaqSection({
  faqs,
  withSchema = true,
  title = 'پرسش‌های متداول',
}: {
  faqs: FaqItem[]
  withSchema?: boolean
  title?: string
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }

  return (
    <section className="section-container pb-16" aria-labelledby="faq-heading">
      {withSchema && <StructuredData data={schema} />}
      <div className="mx-auto max-w-3xl">
        <h2 id="faq-heading" className="mb-8 text-center text-2xl font-extrabold text-slate-900 sm:text-3xl">
          {title}
        </h2>
        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="rounded-xl border border-slate-200 bg-white px-5 shadow-none data-[state=open]:border-brand/30"
            >
              <AccordionTrigger className="py-4 text-start text-[15px] font-semibold text-slate-800 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-7 text-slate-600">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
