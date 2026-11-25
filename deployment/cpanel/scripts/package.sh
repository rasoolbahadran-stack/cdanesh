#!/usr/bin/env bash
# ساخت بستهٔ ZIP نهایی برای آپلود در cPanel (بدون محرمانه‌ها و فایل‌های توسعه)
set -euo pipefail
cd "$(dirname "$0")/../.."
NAME="cafe-danesh-cpanel-production.zip"
rm -f "$NAME"
# محتویات: فایل‌های اجرایی + deployment + اسکریپت‌های runtime + مستندات
zip -rq "$NAME" \
  dist/ deployment/ scripts/cron-publish.mjs \
  server.cjs package.json package-lock.json \
  astro.config.mjs tsconfig.json src/ public/ \
  -x "*.env" "node_modules/*" ".git/*" "data/*" ".pgdata/*" \
     "tests/*" "e2e*" "*.log" "dev.log" "dist/client/uploads/*"
echo "✅ $NAME ساخته شد: $(du -h "$NAME" | cut -f1)"
echo "کنترل امنیتی: نباید .env یا config.php داخل ZIP باشد:"
unzip -l "$NAME" | grep -E "\.env$|config\.php$" && { echo "❌ فایل محرمانه در ZIP است!"; exit 1; } || echo "✔ پاک"
