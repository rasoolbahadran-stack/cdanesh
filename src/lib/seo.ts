/* کمکی‌های سئو — ساخت آدرس مطلق */
export const SITE_BASE = 'https://cdanesh.ir';

export function siteUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return SITE_BASE + (path.startsWith('/') ? path : '/' + path);
}
