/* ═══ کافه‌دانش — لایهٔ امن Vercel Blob (سقف زمانی برای همهٔ فراخوانی‌ها) ═══
   همهٔ head/put/list/del از این ماژول وارد می‌شوند تا اگر سرویس Blob یا شبکه
   کند شد، درخواست حداکثر ۸ ثانیه صبر کند و با خطای روشن BLOB_TIMEOUT برنگردد
   به معلق‌ماندن تا سقف تابع (که در پنل به شکل 504 دیده می‌شود). */
import { head, put, list, del } from '@vercel/blob';

const LIMIT_MS = 8000;

function guard(p) {
  return Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error('BLOB_TIMEOUT')), LIMIT_MS)),
  ]);
}

export function blobHead(key) {
  return guard(head(key, { abortSignal: AbortSignal.timeout(LIMIT_MS) }));
}

export function blobPut(key, body, opts = {}) {
  return guard(put(key, body, { ...opts, abortSignal: opts.abortSignal || AbortSignal.timeout(LIMIT_MS) }));
}

export function blobList(opts = {}) {
  return guard(list({ ...opts, abortSignal: opts.abortSignal || AbortSignal.timeout(LIMIT_MS) }));
}

export function blobDel(url) {
  return guard(del(url, { abortSignal: AbortSignal.timeout(LIMIT_MS) }));
}

/* fetch با سقف زمانی — برای خواندن محتوای فایل از Blob */
export function blobFetch(url) {
  return fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(LIMIT_MS) });
}
