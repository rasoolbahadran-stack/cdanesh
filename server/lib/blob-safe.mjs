/* ═══ کافه‌دانش — لایهٔ امن Vercel Blob (سقف زمانی برای همهٔ فراخوانی‌ها) ═══
   سقف پیش‌فرض (مسیرهای عمومی سایت — بازدیدکننده‌ها): ۲۰ ثانیه (PUBLIC_MS)
   سقف عملیات پنل مدیر (انتشار/ویرایش مقاله و صفحه، رسانه، پرداخت): ۶۰ ثانیه (ADMIN_MS)
   هر تابع با opts.ms هم قابل تنظیم است. اگر سرویس Blob یا شبکه کند شد، درخواست
   به‌جای معلق‌ماندن تا سقف تابع، در همین سقف با خطای روشن BLOB_TIMEOUT تمام می‌شود. */
import { head, put, list, del } from '@vercel/blob';

export const PUBLIC_MS = 20000;
export const ADMIN_MS = 60000;

function guard(p, ms) {
  return Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error('BLOB_TIMEOUT')), ms)),
  ]);
}

export function blobHead(key, opts = {}) {
  const { ms, ...rest } = opts;
  const t = ms || PUBLIC_MS;
  return guard(head(key, { ...rest, abortSignal: rest.abortSignal || AbortSignal.timeout(t) }), t);
}

export function blobPut(key, body, opts = {}) {
  const { ms, ...rest } = opts;
  const t = ms || PUBLIC_MS;
  return guard(put(key, body, { ...rest, abortSignal: rest.abortSignal || AbortSignal.timeout(t) }), t);
}

export function blobList(opts = {}) {
  const { ms, ...rest } = opts;
  const t = ms || PUBLIC_MS;
  return guard(list({ ...rest, abortSignal: rest.abortSignal || AbortSignal.timeout(t) }), t);
}

export function blobDel(url, opts = {}) {
  const t = (opts && opts.ms) || PUBLIC_MS;
  return guard(del(url, { abortSignal: AbortSignal.timeout(t) }), t);
}

/* fetch با سقف زمانی — برای خواندن محتوای فایل از Blob */
export function blobFetch(url, opts = {}) {
  const t = (opts && opts.ms) || PUBLIC_MS;
  return fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(t) });
}
