#!/usr/bin/env bash
# بررسی سلامت نصب روی هاست: دیتابیس، جداول، مدیر، رسانه، سرور
set -euo pipefail
cd "$(dirname "$0")/../.."
if [ ! -f .env ]; then echo "❌ .env یافت نشد — نصب‌کننده را اجرا کنید"; exit 1; fi
set -a; source .env; set +a
node -e "
const mysql = require('mysql2/promise');
const fs = require('fs');
(async () => {
  const u = new URL(process.env.DATABASE_URL);
  const c = await mysql.createConnection({ host: u.hostname, port: u.port || 3306, user: decodeURIComponent(u.username || 'root'), password: decodeURIComponent(u.password || ''), database: decodeURIComponent(u.pathname.replace(/^\//, '')) });
  const [t] = await c.query('SHOW TABLES');
  const need = ['users','posts','pages','categories','messages','media','settings','login_attempts','content_revisions','cdanesh_admin_trash','error_reports'];
  const have = new Set(t.map(r => Object.values(r)[0]));
  const missing = need.filter(n => !have.has(n));
  console.log(missing.length ? '❌ جدول‌های جاافتاده: ' + missing.join(', ') : '✔ جدول‌ها کامل (' + t.length + ' جدول)');
  const [a] = await c.query(\"SELECT username, must_change_password FROM users WHERE role='admin' AND password_hash <> ''\");
  console.log(a.length ? '✔ حساب مدیر: ' + a.map(x => x.username + (Number(x.must_change_password) ? ' (باید رمز را عوض کند)' : '')).join(', ') : '❌ هیچ حساب مدیریتی با رمز موجود نیست');
  await c.end();
  console.log(fs.existsSync(process.cwd() + '/dist/server/entry.mjs') ? '✔ dist/server/entry.mjs موجود است' : '❌ Build وجود ندارد');
  process.exit(missing.length ? 1 : 0);
})().catch(e => { console.error('❌ اتصال دیتابیس ناموفق:', e.message); process.exit(1); });
"
echo "▸ تست HTTP: این دستور را پس از اجرای اپ اجرا کنید:"
echo "    curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:\$PORT/admin/login"
