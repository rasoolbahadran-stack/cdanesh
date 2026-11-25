/* ==========================================================================
   کافه‌دانش — سرو رسانه‌های محلی با آدرس /uploads/<نام فایل>
   ---------------------------------------------------------------------------
   • فایل‌ها روی فضای هاست در MEDIA_DIR (پیش‌فرض data/uploads) نگهداری می‌شوند؛
     خارج از مسیر عمومی وب تا جلوی اجرای مستقیم فایل آپلودی گرفته شود.
   • مسیر امن‌سازی می‌شود (جلوگیری از پیمایش مسیر) و فقط فایل مجاز سرو می‌شود.
   • هدرهای امنیتی: nosniff + CSP sandbox (اجرای اسکریپت داخل SVG/HTML آپلودی
     مسدود است) + کش مرورگر.
   • روی حالت Blob، آدرس‌ها مطلق‌اند و این مسیر استفاده نمی‌شود.
   ========================================================================== */
import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { mediaDir } from '../../lib/storage';

export const prerender = false;

const MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

export const GET: APIRoute = async ({ params }) => {
  const raw = String(params.file || '').replace(/\\/g, '/');
  const name = path.basename(raw); // فقط نام سادهٔ فایل — بدون زیرمسیر
  if (!name || name.startsWith('.')) return new Response('Not found', { status: 404 });
  const file = path.join(mediaDir(), name);
  const root = path.resolve(mediaDir());
  if (!path.resolve(file).startsWith(root + path.sep) && path.resolve(file) !== root) {
    return new Response('Not found', { status: 404 });
  }
  let data: Buffer;
  try {
    data = await fs.readFile(file);
  } catch {
    return new Response('Not found', { status: 404 });
  }
  const ext = path.extname(name).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      'content-type': mime,
      'x-content-type-options': 'nosniff',
      'content-security-policy': "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:; media-src data:",
      'cache-control': 'public, max-age=31536000, immutable',
      'x-frame-options': 'SAMEORIGIN',
    },
  });
};
