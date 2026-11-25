# بستهٔ استقرار cPanel — کافه‌دانش (کافه‌دانش.ir روی ایران‌هاست)

ساختار:

```
deployment/cpanel/
├── installer/            نصب‌کنندهٔ PHP (index.php + requirements.php + install.php)
├── config/               config.example.php — الگوی تنظیمات (فایل واقعی پس از نصب ساخته می‌شود؛ 0600)
├── database/schema.sql   اسکیمای کامل MySQL/MariaDB (اجرای یک‌بار توسط نصب‌کننده)
├── database/migrations/  مایگریشن‌های افزایشی آینده
├── scripts/              build.sh · package.sh · verify.sh
└── docs/INSTALL.md       راهنمای کامل فارسی نصب، SSL، Cron، پشتیبان‌گیری و به‌روزرسانی
```

نقطهٔ ورود بک‌اند Node: `server.cjs` در ریشهٔ پروژه (StartupFile در Application Manager).

نقشهٔ معماری نهایی:
- یک هاست (ایران‌هاست cPanel) + یک دیتابیس (MySQL/MariaDB داخلی هاست) + یک بک‌اند (Astro SSR با آداپتور Node/Passenger) + پنل مدیریت همان اپ + ذخیره‌سازی رسانه روی دیسک هاست (`data/uploads`) + احراز هویت دیتابیسی (bcrypt + کوکی امضاشده) + پشتیبان‌گیری cPanel/Cron.

بدون وابستگی اجباری به Neon / Vercel / Vercel Blob / OpenRouter.

راهنمای گام‌به‌گام: [docs/INSTALL.md](docs/INSTALL.md)
