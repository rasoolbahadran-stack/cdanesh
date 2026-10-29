import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/site/breadcrumbs'
import FaqAccordion from '@/components/site/faq-accordion'
import { db } from '@/lib/db'

export const metadata: Metadata = {
  title: 'سؤالات متداول',
  description:
    'پاسخ سؤالات رایج درباره طراحی سایت، هزینه و زمان اجرا، سئو و تولید محتوا، هوش مصنوعی و تحویل و پشتیبانی کافه‌دانش.',
  alternates: { canonical: '/faq' },
  openGraph: { title: 'سؤالات متداول | کافه‌دانش', url: '/faq' },
}

/** ترتیب و عنوان فارسی گروه‌های سؤالات (بر اساس pageKey) */
const GROUP_TITLES: { key: string; title: string }[] = [
  { key: 'home', title: 'پرسش‌های عمومی' },
  { key: 'web-design', title: 'طراحی سایت' },
  { key: 'seo', title: 'سئو' },
  { key: 'content-production', title: 'تولید محتوا' },
  { key: 'ai-solutions', title: 'هوش مصنوعی و اتوماسیون' },
  { key: 'speed-optimization', title: 'بهینه‌سازی سرعت' },
  { key: 'uiux', title: 'طراحی UI/UX' },
  { key: 'e-commerce', title: 'فروشگاه اینترنتی' },
  { key: 'support', title: 'پشتیبانی و نگهداری' },
  { key: 'services', title: 'همکاری و سفارش' },
]

export default async function FaqPage() {
  const rows = await db.faq.findMany({
    where: { isActive: true, pageKey: { not: { startsWith: 'article:' } } },
    orderBy: [{ pageKey: 'asc' }, { sortOrder: 'asc' }],
  })

  const byKey = new Map<string, { q: string; a: string }[]>()
  for (const r of rows) {
    const list = byKey.get(r.pageKey) || []
    list.push({ q: r.question, a: r.answer })
    byKey.set(r.pageKey, list)
  }

  // گروه‌های شناخته‌شده در ترتیب تعریف‌شده + هر pageKey ناشناخته در انتها
  const known = GROUP_TITLES.filter((g) => byKey.has(g.key))
  const unknown = [...byKey.keys()].filter((k) => !GROUP_TITLES.some((g) => g.key === k))
  const groups = [
    ...known.map((g) => ({ ...g, items: byKey.get(g.key)! })),
    ...unknown.map((k) => ({ key: k, title: k, items: byKey.get(k)! })),
  ]

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs items={[{ label: 'سؤالات متداول' }]} />
          <span className="eyebrow reveal in">سؤالات متداول</span>
          <h1 className="h1 reveal in">
            پاسخ صادقانه به <span className="gold">سؤالات رایج</span>
          </h1>
          <p className="lead reveal in" data-delay="1">
            پرسش‌هایی که مشتریان پیش از شروع همکاری می‌پرسند — دسته‌بندی‌شده و بدون اغراق. اگر پاسخ
            سؤال شما اینجا نبود، از صفحه تماس بپرسید؛ در اولین فرصت پاسخ می‌دهیم.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="wrap">
          {groups.map((g, gi) => (
            <div className="faq-group" key={g.key}>
              <b>{g.title}</b>
              {/* فقط گروه اول Schema.org دارد */}
              <FaqAccordion items={g.items} schema={gi === 0} />
            </div>
          ))}
        </div>
      </section>

      <section className="section-tight">
        <div className="wrap">
          <div className="cta-banner reveal">
            <div>
              <h2>سؤال دیگری دارید؟</h2>
              <p>مستقیم بپرسید — در جلسه مشاوره رایگان، همان‌جا پاسخ می‌گیرید.</p>
            </div>
            <div className="cta-actions">
              <Link href="/contact" className="btn btn-dark btn-lg">
                پرسیدن سؤال
              </Link>
              <Link href="/request" className="btn btn-ghost btn-lg">
                ثبت درخواست پروژه
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
