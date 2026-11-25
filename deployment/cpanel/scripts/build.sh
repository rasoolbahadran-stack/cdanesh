#!/usr/bin/env bash
# ساخت نسخهٔ Production با آداپتور Node (برای cPanel) — روی دستگاه توسعه یا روی خود هاست (اگر npm موجود است)
set -euo pipefail
cd "$(dirname "$0")/../.."
echo "▸ نصب وابستگی‌های تولید…"
npm ci --omit=dev
echo "▸ Build با آداپتور Node…"
ASTRO_ADAPTER=node npm run build
echo "✅ Build کامل شد → dist/"
echo "اجرای Production: node server.cjs  (یا StartupFile=server.cjs در سی‌پنل)"
