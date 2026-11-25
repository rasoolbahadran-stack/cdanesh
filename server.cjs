/* ==========================================================================
   کافه‌دانش — نقطهٔ ورود Passenger / cPanel (Node.js Application)
   ---------------------------------------------------------------------------
   cPanel «Application Manager» این فایل را به‌عنوان StartupFile اجرا می‌کند.
   وظایف:
     ۱) خواندن .env کنار اپ (DATABASE_URL، MEDIA_DIR، ADMIN_SESSION_SECRET، …)
     ۲) راه‌اندازی سرور ساخته‌شدهٔ Astro (dist/server/entry.mjs)
   پورت را Passenger با متغیر PORT تعیین می‌کند؛ در اجرای دستی هم می‌توانید
   PORT/HOST را خودتان ست کنید.
   ========================================================================== */
const fs = require('node:fs');
const path = require('node:path');

function loadEnv(dir) {
  const file = path.join(dir, '.env');
  try {
    if (!fs.existsSync(file)) return;
    for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq < 1) continue;
      const k = line.slice(0, eq).trim();
      let v = line.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (process.env[k] === undefined) process.env[k] = v;
    }
  } catch (e) {
    console.error('[server.cjs] .env load failed:', e.message);
  }
}

loadEnv(__dirname);

if (!process.env.DATABASE_URL) {
  console.error('[server.cjs] DATABASE_URL تنظیم نشده — .env را با نصب‌کننده بسازید.');
}

process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '4321';
process.env.HOST = process.env.HOST || '127.0.0.1';

import('./dist/server/entry.mjs').catch((e) => {
  console.error('[server.cjs] server start failed:', e);
  process.exit(1);
});
