import Link from 'next/link'

/** بنر CTA پایین صفحات — متن تأییدشده همکاری */
export default function CtaBanner({
  title = 'پروژه بعدی ما، پروژه شماست؟',
  text = 'از یک گفت‌وگوی هدفمند برای شناخت نیازها و تعیین مسیر همکاری شروع می‌کنیم.',
  primary = { href: '/request', label: 'شروع پروژه' },
  secondary,
}: {
  title?: string
  text?: string
  primary?: { href: string; label: string }
  secondary?: { href: string; label: string }
}) {
  return (
    <section className="section-tight">
      <div className="wrap">
        <div className="cta-banner reveal">
          <div>
            <h2>{title}</h2>
            <p>{text}</p>
          </div>
          <div className="cta-actions">
            <Link className="btn btn-dark btn-lg" href={primary.href}>
              {primary.label}
            </Link>
            {secondary && (
              <Link className="btn btn-ghost btn-lg" href={secondary.href}>
                {secondary.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
