/* ==========================================================================
   کافه‌دانش — لایهٔ ذخیره‌سازی رسانه
   ---------------------------------------------------------------------------
   • روی Vercel فقط Vercel Blob مجاز است؛ فضای فایل‌سیستم Function دائمی نیست.
   • محلی/توسعهٔ خارج از Vercel → پوشهٔ public/uploads
   ========================================================================== */
import { hasEnv } from './env';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024; // ۶ مگابایت
export const ALLOWED_MIME: Record<string, string> = {
  'image/webp': 'webp',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

export function storageKind(): 'blob' | 'local' {
  const onVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  const blobConfigured = hasEnv('BLOB_READ_WRITE_TOKEN');

  if (onVercel && !blobConfigured) {
    throw new Error('BLOB_READ_WRITE_TOKEN در محیط Vercel تنظیم نشده است؛ ذخیره‌سازی محلی در Production مجاز نیست.');
  }

  return blobConfigured ? 'blob' : 'local';
}

function safeName(original: string): string {
  const ext = path.extname(original || '').toLowerCase().replace(/[^a-z0-9.]/g, '');
  const base = crypto.randomBytes(8).toString('hex');
  return `${base}${ext || '.bin'}`;
}

export interface SaveResult {
  ok: boolean;
  url?: string;
  filename?: string;
  mime?: string;
  size?: number;
  message?: string;
  error?: string;
}

export async function saveImage(file: File): Promise<SaveResult> {
  const mime = (file.type || '').toLowerCase();
  const ext = ALLOWED_MIME[mime];
  if (!ext) {
    return { ok: false, error: 'BAD_TYPE', message: 'فرمت تصویر مجاز نیست (WebP، PNG، JPG، GIF یا SVG)' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: 'TOO_LARGE', message: 'حجم تصویر بیش از ۶ مگابایت است' };
  }
  const filename = safeName(file.name || `img.${ext}`);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (storageKind() === 'blob') {
    try {
      const { put } = await import('@vercel/blob');
      const res = await put(`cdanesh-media/${filename}`, buffer, {
        access: 'public',
        contentType: mime,
        addRandomSuffix: false,
      });
      return { ok: true, url: res.url, filename, mime, size: buffer.length };
    } catch (e) {
      return { ok: false, error: 'BLOB_FAIL', message: 'ذخیره روی Blob ناموفق بود: ' + String((e as Error).message || e) };
    }
  }

  try {
    const dir = path.resolve(process.cwd(), 'public/uploads');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), buffer);
    return { ok: true, url: `/uploads/${filename}`, filename, mime, size: buffer.length };
  } catch (e) {
    return { ok: false, error: 'WRITE_FAIL', message: 'ذخیرهٔ فایل ناموفق بود: ' + String((e as Error).message || e) };
  }
}

export async function deleteImage(url: string): Promise<boolean> {
  if (!url) return true;
  try {
    if (storageKind() === 'blob' && !url.startsWith('/uploads/')) {
      const { del } = await import('@vercel/blob');
      await del(url);
      return true;
    }
    const name = path.basename(url);
    await fs.unlink(path.resolve(process.cwd(), 'public/uploads', name));
    return true;
  } catch {
    return false;
  }
}
