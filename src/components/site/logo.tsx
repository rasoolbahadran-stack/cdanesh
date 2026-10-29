import Link from 'next/link'

export function Logo({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 focus-ring rounded-lg" aria-label="کافه‌دانش — صفحه اصلی">
      <span className="brand-gradient flex h-10 w-10 items-center justify-center rounded-xl text-base font-extrabold text-white shadow-md shadow-brand/25">
        KD
      </span>
      <span
        className={`text-xl font-extrabold ${
          variant === 'dark' ? 'text-white' : 'brand-gradient-text'
        }`}
      >
        کافه‌دانش
      </span>
    </Link>
  )
}
