'use client'

// دکمه حذف/اقدام خطرناک با تأیید مرورگری — باید داخل <form action={serverAction}> باشد.
export function ConfirmButton({
  label,
  className = 'adm-btn danger',
  message = 'مطمئنید؟',
}: {
  label: string
  className?: string
  message?: string
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault()
      }}
    >
      {label}
    </button>
  )
}
